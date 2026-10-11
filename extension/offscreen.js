const SONIOX_WEBSOCKET_URL = 'wss://stt-rt.soniox.com/transcribe-websocket';
const CONNECTION_TIMEOUT_MS = 20000;
const FINISH_TIMEOUT_MS = 5000;
const MAX_RETRIES = 2;
const MAX_BUFFERED_BYTES = 16000 * 2 * 5;
let session = null;
let lastStatus = { state: 'idle', tabId: null, error: null };

function getWebSocketConfig(config) {
  return {
    model: 'stt-rt-v5',
    audio_format: 'pcm_s16le', sample_rate: 16000, num_channels: 1,
    language_hints: [...new Set([config.sourceLang, config.targetLang])],
    enable_language_identification: true,
    enable_speaker_diarization: true,
    enable_endpoint_detection: true,
    translation: { type: 'two_way', language_a: config.sourceLang, language_b: config.targetLang }
  };
}

function floatTo16BitPCM(input) {
  const output = new Int16Array(input.length);
  for (let i = 0; i < input.length; i++) {
    const value = Math.max(-1, Math.min(1, input[i]));
    output[i] = value < 0 ? value * 0x8000 : value * 0x7fff;
  }
  return output;
}

// Carry the fractional position between callbacks: 4096 is not divisible by 3.
function downsampleBuffer(input, inputRate, outputRate, resampler) {
  const ratio = inputRate / outputRate;
  const output = [];
  for (const value of input) {
    resampler.sum += value;
    resampler.count++;
    resampler.phase++;
    if (resampler.phase >= ratio) {
      output.push(resampler.sum / resampler.count);
      resampler.phase -= ratio;
      resampler.sum = 0;
      resampler.count = 0;
    }
  }
  return new Float32Array(output);
}

function processTokens(tokens) {
  const result = { newFinalOriginal: '', newFinalTranslation: '', interimOriginal: '', interimTranslation: '' };
  for (const token of tokens) {
    if (typeof token.text !== 'string' || ['<end>', '<fin>'].includes(token.text)) continue;
    const key = (token.is_final ? 'newFinal' : 'interim') +
      (token.translation_status === 'translation' ? 'Translation' : 'Original');
    result[key] += token.text;
  }
  return result;
}

function publishStatus(s, state, error = null) {
  s.state = state;
  lastStatus = { state, tabId: s.tabId, error };
  // Never log credentials, configuration, or server-echoed payloads.
  return chrome.runtime.sendMessage({ type: 'CAPTURE_STATE', status: lastStatus }).catch(() => {});
}

function releaseAudio(s) {
  if (s.processor) {
    s.processor.onaudioprocess = null;
    s.processor.disconnect();
    s.processor = null;
  }
  if (s.audio) {
    s.audio.pause();
    s.audio.srcObject = null;
    s.audio.remove();
    s.audio = null;
  }
  if (s.stream) {
    s.stream.getTracks().forEach(track => { track.onended = null; track.stop(); });
    s.stream = null;
  }
  if (s.context) {
    void s.context.close().catch(() => {});
    s.context = null;
  }
}

function detachSocket(s) {
  clearTimeout(s.connectionTimer);
  clearInterval(s.keepaliveTimer);
  const ws = s.ws;
  s.ws = null;
  if (ws) {
    ws.onopen = ws.onmessage = ws.onerror = ws.onclose = null;
    if (ws.readyState < WebSocket.CLOSING) ws.close();
  }
}

async function completeSession(s, error = null) {
  if (s.completed) return;
  s.completed = true;
  clearTimeout(s.setupTimer);
  clearTimeout(s.retryTimer);
  clearTimeout(s.finishTimer);
  detachSocket(s);
  releaseAudio(s);
  s.config = null;
  // Deliver queued final subtitles before acknowledging stop.
  await s.delivery;
  await publishStatus(s, error ? 'error' : 'idle', error);
  if (session === s) session = null;
  s.resolveStart({ success: false, error: error || 'Capture stopped before starting' });
  s.resolveStop?.({ success: !error, error });
}

function connectionFailed(s, error, retryable) {
  if (s.completed) return;
  detachSocket(s);
  if (s.state === 'stopping') {
    void completeSession(s, error);
    return;
  }
  if (retryable && s.retries < MAX_RETRIES) {
    s.retries++;
    void publishStatus(s, 'reconnecting');
    // A reconnect is a new stream. Clear interim text without replaying committed audio.
    s.delivery = s.delivery.then(() => chrome.runtime.sendMessage({
      type: 'SUBTITLE_UPDATE', tabId: s.tabId, subtitles: processTokens([])
    })).catch(() => {});
    s.retryTimer = setTimeout(() => connectWebSocket(s), 1000 * 2 ** (s.retries - 1));
  } else {
    void completeSession(s, error);
  }
}

function connectWebSocket(s) {
  if (s.completed || s.state === 'stopping') return;
  let ws;
  try {
    ws = new WebSocket(SONIOX_WEBSOCKET_URL, ['soniox-api-key', s.config.apiKey]);
  } catch {
    void completeSession(s, 'Cannot create connection. Check the API key format.');
    return;
  }
  s.ws = ws;
  s.connectionTimer = setTimeout(() => connectionFailed(s, 'Soniox connection timed out.', true), CONNECTION_TIMEOUT_MS);
  ws.onopen = () => {
    try {
      ws.send(JSON.stringify(getWebSocketConfig(s.config)));
      s.keepaliveTimer = setInterval(() => {
        if (s.ws === ws && ws.readyState === WebSocket.OPEN && s.state !== 'stopping') {
          try { ws.send(JSON.stringify({ type: 'keepalive' })); }
          catch { connectionFailed(s, 'Connection interrupted.', true); }
        }
      }, 20000);
    } catch { connectionFailed(s, 'Cannot configure Soniox connection.', true); }
  };
  ws.onmessage = event => {
    if (s.ws !== ws || s.completed) return;
    let response;
    try { response = JSON.parse(event.data); }
    catch { connectionFailed(s, 'Invalid response from Soniox.', false); return; }
    if (!response || typeof response !== 'object') {
      connectionFailed(s, 'Invalid response from Soniox.', false); return;
    }
    if (response.error_code || response.error_type) {
      const code = Number(response.error_code);
      const type = typeof response.error_type === 'string' && /^[a-z_]+$/.test(response.error_type)
        ? response.error_type : 'request_failed';
      const requestId = typeof response.request_id === 'string' && /^[a-zA-Z0-9-]+$/.test(response.request_id)
        ? ` (request ${response.request_id})` : '';
      connectionFailed(s, `Soniox ${Number.isFinite(code) ? code : ''}: ${type}${requestId}`,
        ['service_unavailable', 'internal_server_error'].includes(type) || code >= 500);
      return;
    }
    if (Array.isArray(response.tokens)) {
      // onopen does not prove authentication succeeded. Wait for a valid result.
      clearTimeout(s.connectionTimer);
      if (s.state !== 'stopping') {
        if (s.state !== 'running') void publishStatus(s, 'running');
        s.resolveStart({ success: true });
      }
      const subtitles = processTokens(response.tokens);
      s.delivery = s.delivery.then(() => chrome.runtime.sendMessage({
        type: 'SUBTITLE_UPDATE', tabId: s.tabId, subtitles
      })).catch(() => {});
    }
    if (response.finished) void completeSession(s);
  };
  ws.onerror = () => connectionFailed(s, 'Network connection failed.', true);
  ws.onclose = () => connectionFailed(s, 'Soniox connection closed before completion.', true);
}

async function startCapture(streamId, config, tabId) {
  if (session) return { success: false, error: 'A capture session is already active.' };
  const s = {
    tabId, config, retries: 0, completed: false, ws: null,
    delivery: Promise.resolve(), resampler: { phase: 0, sum: 0, count: 0 }
  };
  session = s;
  const started = new Promise(resolve => { s.resolveStart = resolve; });
  void setupCapture(s, streamId).catch(() => completeSession(s, 'Audio setup failed.'));
  return started;
}

async function setupCapture(s, streamId) {
  await publishStatus(s, 'connecting');
  if (s.completed) return;
  s.setupTimer = setTimeout(() => {
    void completeSession(s, 'Tab audio setup timed out. Reload the tab and try again.');
  }, CONNECTION_TIMEOUT_MS);
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: { mandatory: { chromeMediaSource: 'tab', chromeMediaSourceId: streamId } }, video: false
    });
    if (s.completed || s.state === 'stopping') {
      stream.getTracks().forEach(track => track.stop());
      return;
    }
    s.stream = stream;
    stream.getTracks().forEach(track => {
      track.onended = () => { void completeSession(s, 'Tab audio capture ended.'); };
    });
    s.audio = document.createElement('audio');
    s.audio.srcObject = stream;
    document.body.appendChild(s.audio);
    await s.audio.play();
    if (s.completed) return;
    s.context = new AudioContext({ sampleRate: 48000 });
    if (s.context.state === 'suspended') await s.context.resume();
    if (s.completed) return;
    const source = s.context.createMediaStreamSource(stream);
    s.processor = s.context.createScriptProcessor(4096, 1, 1);
    s.processor.onaudioprocess = event => {
      if (s.completed || s.state === 'stopping' || s.ws?.readyState !== WebSocket.OPEN) return;
      if (s.ws.bufferedAmount > MAX_BUFFERED_BYTES) {
        connectionFailed(s, 'Network is too slow; audio upload is falling behind.', true);
        return;
      }
      const data = downsampleBuffer(event.inputBuffer.getChannelData(0), s.context.sampleRate, 16000, s.resampler);
      try { s.ws.send(floatTo16BitPCM(data).buffer); }
      catch { connectionFailed(s, 'Audio upload failed.', true); }
    };
    source.connect(s.processor);
    s.processor.connect(s.context.destination);
    clearTimeout(s.setupTimer);
    connectWebSocket(s);
  } catch {
    await completeSession(s, 'Cannot capture or play tab audio. Reload the tab and try again.');
  }
  return;
}

function stopCapture() {
  const s = session;
  if (!s) return Promise.resolve({ success: true });
  if (s.stopPromise) return s.stopPromise;
  s.stopPromise = new Promise(resolve => { s.resolveStop = resolve; });
  if (s.completed) return s.stopPromise;
  void publishStatus(s, 'stopping');
  clearTimeout(s.retryTimer);
  clearTimeout(s.connectionTimer);
  clearInterval(s.keepaliveTimer);
  releaseAudio(s);
  if (s.ws?.readyState === WebSocket.OPEN) {
    s.finishTimer = setTimeout(() => {
      void completeSession(s, 'Timed out waiting for final subtitles; the last sentence may be incomplete.');
    }, FINISH_TIMEOUT_MS);
    try { s.ws.send(''); }
    catch { void completeSession(s, 'Could not finish the stream.'); }
  } else {
    void completeSession(s);
  }
  return s.stopPromise;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'OFFSCREEN_GET_STATUS') {
    sendResponse(lastStatus);
    return false;
  }
  if (message.type === 'OFFSCREEN_START_CAPTURE') {
    startCapture(message.streamId, message.config, message.tabId).then(sendResponse);
    return true;
  }
  if (message.type === 'OFFSCREEN_STOP_CAPTURE') {
    stopCapture().then(sendResponse);
    return true;
  }
  return false;
});

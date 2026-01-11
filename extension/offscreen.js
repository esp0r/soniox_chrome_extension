console.log('[Offscreen] Offscreen script loaded');

const SONIOX_WEBSOCKET_URL = 'wss://stt-rt.soniox.com/transcribe-websocket';

let mediaStream = null;
let audioContext = null;
let websocket = null;
let scriptProcessor = null;
let audioElement = null;
let isCapturing = false;
let finalTokens = [];
let currentConfig = null;

function getWebSocketConfig(config) {
  console.log('[Offscreen] Building WebSocket config');
  
  const wsConfig = {
    api_key: config.apiKey,
    model: 'stt-rt-v3',
    audio_format: 'pcm_s16le',
    sample_rate: 16000,
    num_channels: 1,
    language_hints: [config.sourceLang, config.targetLang],
    enable_language_identification: true,
    enable_speaker_diarization: true,
    enable_endpoint_detection: true,
    translation: {
      type: 'two_way',
      language_a: config.sourceLang,
      language_b: config.targetLang
    }
  };
  
  console.log('[Offscreen] WebSocket config:', JSON.stringify(wsConfig, null, 2));
  return wsConfig;
}

function floatTo16BitPCM(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Array;
}

function downsampleBuffer(buffer, inputSampleRate, outputSampleRate) {
  if (inputSampleRate === outputSampleRate) {
    return buffer;
  }
  const ratio = inputSampleRate / outputSampleRate;
  const newLength = Math.round(buffer.length / ratio);
  const result = new Float32Array(newLength);
  let offsetResult = 0;
  let offsetBuffer = 0;
  
  while (offsetResult < result.length) {
    const nextOffsetBuffer = Math.round((offsetResult + 1) * ratio);
    let accum = 0;
    let count = 0;
    for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
      accum += buffer[i];
      count++;
    }
    result[offsetResult] = accum / count;
    offsetResult++;
    offsetBuffer = nextOffsetBuffer;
  }
  return result;
}

function processTokens(tokens) {
  console.log('[Offscreen] Processing tokens:', tokens.length);
  
  let nonFinalTokens = [];
  
  for (const token of tokens) {
    if (token.text) {
      if (token.is_final) {
        finalTokens.push(token);
      } else {
        nonFinalTokens.push(token);
      }
    }
  }
  
  const allTokens = [...finalTokens, ...nonFinalTokens];
  
  let originalText = '';
  let translationText = '';
  
  for (const token of allTokens) {
    const isTranslation = token.translation_status === 'translation';
    if (isTranslation) {
      translationText += token.text;
    } else {
      originalText += token.text;
    }
  }
  
  const recentFinalCount = 50;
  if (finalTokens.length > recentFinalCount * 2) {
    finalTokens = finalTokens.slice(-recentFinalCount);
    console.log('[Offscreen] Trimmed final tokens to', finalTokens.length);
  }
  
  return {
    original: originalText.trim(),
    translation: translationText.trim()
  };
}

function sendSubtitleUpdate(subtitles) {
  console.log('[Offscreen] Sending subtitle update:', 
    'original:', subtitles.original.slice(-50),
    'translation:', subtitles.translation.slice(-50));
  
  chrome.runtime.sendMessage({
    type: 'SUBTITLE_UPDATE',
    subtitles
  }).catch(err => {
    console.log('[Offscreen] Error sending subtitle update:', err);
  });
}

function connectWebSocket(config) {
  console.log('[Offscreen] Connecting to Soniox WebSocket');
  
  websocket = new WebSocket(SONIOX_WEBSOCKET_URL);
  
  websocket.onopen = () => {
    console.log('[Offscreen] WebSocket connected');
    const wsConfig = getWebSocketConfig(config);
    websocket.send(JSON.stringify(wsConfig));
    console.log('[Offscreen] Sent config to WebSocket');
  };
  
  websocket.onmessage = (event) => {
    try {
      const res = JSON.parse(event.data);
      
      if (res.error_code) {
        console.error('[Offscreen] WebSocket error:', res.error_code, res.error_message);
        chrome.runtime.sendMessage({
          type: 'CAPTURE_ERROR',
          error: `Soniox error: ${res.error_code} - ${res.error_message}`
        });
        stopCapture();
        return;
      }
      
      if (res.tokens && res.tokens.length > 0) {
        console.log('[Offscreen] Received tokens:', res.tokens.length, 
          'final_audio:', res.final_audio_proc_ms, 
          'total_audio:', res.total_audio_proc_ms);
        
        const subtitles = processTokens(res.tokens);
        sendSubtitleUpdate(subtitles);
      }
      
      if (res.finished) {
        console.log('[Offscreen] Session finished');
      }
    } catch (err) {
      console.error('[Offscreen] Error parsing WebSocket message:', err);
    }
  };
  
  websocket.onerror = (error) => {
    console.error('[Offscreen] WebSocket error:', error);
  };
  
  websocket.onclose = (event) => {
    console.log('[Offscreen] WebSocket closed:', event.code, event.reason);
    websocket = null;
  };
}

async function startCapture(streamId, config) {
  console.log('[Offscreen] Starting capture with streamId:', streamId);
  currentConfig = config;
  finalTokens = [];
  
  try {
    mediaStream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: false
    });
    
    console.log('[Offscreen] Got media stream');
    
    // 创建 Audio 元素来播放原始音频（避免静音）
    audioElement = document.createElement('audio');
    audioElement.srcObject = mediaStream;
    audioElement.volume = 1.0;
    document.body.appendChild(audioElement);
    audioElement.play()
      .then(() => console.log('[Offscreen] Audio playback started'))
      .catch(err => console.log('[Offscreen] Audio play error:', err));
    console.log('[Offscreen] Audio element created for playback');
    
    audioContext = new AudioContext({ sampleRate: 48000 });
    console.log('[Offscreen] AudioContext created, state:', audioContext.state, 'sampleRate:', audioContext.sampleRate);
    
    // 确保 AudioContext 处于运行状态
    if (audioContext.state === 'suspended') {
      await audioContext.resume();
      console.log('[Offscreen] AudioContext resumed, state:', audioContext.state);
    }
    
    const source = audioContext.createMediaStreamSource(mediaStream);
    scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
    
    let audioChunkCount = 0;
    scriptProcessor.onaudioprocess = (event) => {
      audioChunkCount++;
      if (audioChunkCount % 50 === 1) {
        console.log('[Offscreen] Audio chunk #' + audioChunkCount, 
          'isCapturing:', isCapturing, 
          'ws state:', websocket?.readyState);
      }
      
      if (!isCapturing || !websocket || websocket.readyState !== WebSocket.OPEN) {
        return;
      }
      
      const inputData = event.inputBuffer.getChannelData(0);
      const downsampled = downsampleBuffer(inputData, audioContext.sampleRate, 16000);
      const pcmData = floatTo16BitPCM(downsampled);
      
      websocket.send(pcmData.buffer);
    };
    
    // 先连接音频处理管道，确保 onaudioprocess 被调用
    source.connect(scriptProcessor);
    scriptProcessor.connect(audioContext.destination);
    console.log('[Offscreen] Audio processing pipeline connected');
    
    // 然后再连接 WebSocket
    connectWebSocket(config);
    
    isCapturing = true;
    console.log('[Offscreen] Capture started successfully');
    
    return { success: true };
  } catch (err) {
    console.error('[Offscreen] Error starting capture:', err);
    stopCapture();
    return { success: false, error: err.message };
  }
}

function stopCapture() {
  console.log('[Offscreen] Stopping capture');
  isCapturing = false;
  
  if (websocket) {
    if (websocket.readyState === WebSocket.OPEN) {
      console.log('[Offscreen] Sending end-of-audio signal');
      websocket.send('');
    }
    websocket.close();
    websocket = null;
  }
  
  if (scriptProcessor) {
    scriptProcessor.disconnect();
    scriptProcessor = null;
  }
  
  if (audioContext) {
    audioContext.close();
    audioContext = null;
  }
  
  if (audioElement) {
    audioElement.pause();
    audioElement.srcObject = null;
    audioElement.remove();
    audioElement = null;
    console.log('[Offscreen] Audio element removed');
  }
  
  if (mediaStream) {
    mediaStream.getTracks().forEach(track => {
      console.log('[Offscreen] Stopping track:', track.kind);
      track.stop();
    });
    mediaStream = null;
  }
  
  finalTokens = [];
  currentConfig = null;
  
  console.log('[Offscreen] Capture stopped');
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Offscreen] Received message:', message.type);
  
  if (message.type === 'OFFSCREEN_START_CAPTURE') {
    startCapture(message.streamId, message.config)
      .then(result => {
        console.log('[Offscreen] Start capture result:', result);
        sendResponse(result);
      })
      .catch(err => {
        console.error('[Offscreen] Start capture error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
  
  if (message.type === 'OFFSCREEN_STOP_CAPTURE') {
    stopCapture();
    sendResponse({ success: true });
    return false;
  }
  
  return false;
});

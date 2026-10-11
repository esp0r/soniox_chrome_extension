let starting = null;
let stopping = null;
let creatingOffscreen = null;
let cancelStart = false;
let setupStatus = null;
const ACTIVE_STATES = ['connecting', 'running', 'reconnecting', 'stopping'];

async function hasOffscreenDocument() {
  return (await chrome.runtime.getContexts({ contextTypes: ['OFFSCREEN_DOCUMENT'] })).length > 0;
}

async function ensureOffscreenDocument() {
  if (creatingOffscreen) return creatingOffscreen;
  creatingOffscreen = (async () => {
    if (!await hasOffscreenDocument()) {
      await chrome.offscreen.createDocument({
        url: 'offscreen.html', reasons: ['USER_MEDIA'],
        justification: 'Capture tab audio for speech-to-text transcription'
      });
    }
  })();
  try { await creatingOffscreen; } finally { creatingOffscreen = null; }
}

async function saveStatus(status) {
  await chrome.storage.local.set({ captureStatus: status, isCapturing: ACTIVE_STATES.includes(status.state) });
  return status;
}

async function getStatus() {
  if (setupStatus) return setupStatus;
  const stored = (await chrome.storage.local.get('captureStatus')).captureStatus;
  if (await hasOffscreenDocument()) {
    try {
      const status = await chrome.runtime.sendMessage({ type: 'OFFSCREEN_GET_STATUS' });
      if (status?.state) {
        // Setup runs before the offscreen session starts. Preserve its status/errors.
        if (status.state === 'idle' && stored?.state === 'error') return stored;
        return status;
      }
    } catch { /* The document may have closed during the query. */ }
  }
  if (stored?.state === 'error') return stored;
  return saveStatus({ state: 'idle', tabId: null, error: null });
}

async function injectContentScript(tabId) {
  try {
    const response = await chrome.tabs.sendMessage(tabId, { type: 'SONIOX_PING' });
    if (response?.ready) return;
  } catch { /* A newly loaded extension may not have injected this tab yet. */ }
  await chrome.scripting.insertCSS({ target: { tabId }, files: ['content.css'] });
  await chrome.scripting.executeScript({ target: { tabId }, files: ['content.js'] });
}

function handleStartCapture(tabId, config) {
  if (starting || stopping) return Promise.resolve({ success: false, error: 'Capture is busy. Please wait.' });
  cancelStart = false;
  starting = (async () => {
    const status = await getStatus();
    if (ACTIVE_STATES.includes(status.state)) return { success: false, error: 'Stop the current capture first.' };
    try {
      if (!config?.apiKey?.trim()) throw new Error('Please enter your API key.');
      if (config.sourceLang === config.targetLang) throw new Error('Source and target languages must be different.');
      setupStatus = { state: 'connecting', tabId, error: null };
      await saveStatus(setupStatus);
      await injectContentScript(tabId);
      await chrome.tabs.sendMessage(tabId, { type: 'HIDE_SUBTITLE' });
      await ensureOffscreenDocument();
      if (cancelStart) throw new Error('Capture cancelled.');
      const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });
      if (cancelStart) throw new Error('Capture cancelled.');
      setupStatus = null;
      const result = await chrome.runtime.sendMessage({
        type: 'OFFSCREEN_START_CAPTURE', streamId, tabId,
        config: { ...config, apiKey: config.apiKey.trim() }
      });
      if (!result) throw new Error('Audio capture did not respond.');
      return result;
    } catch (error) {
      const message = cancelStart ? null : 'Cannot start capture: ' + error.message;
      setupStatus = null;
      await saveStatus({ state: message ? 'error' : 'idle', tabId, error: message });
      return { success: false, error: message || 'Capture cancelled.' };
    }
  })();
  starting.finally(() => { starting = null; }).catch(() => {});
  return starting;
}

function handleStopCapture() {
  if (stopping) return stopping;
  cancelStart = true;
  stopping = (async () => {
    // If setup has not sent START yet, cancelStart prevents it from doing so.
    let result = { success: true };
    if (await hasOffscreenDocument()) {
      result = await chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP_CAPTURE' }) || result;
    }
    if (starting) await starting;
    const status = await getStatus();
    await saveStatus(status);
    // Keep the final subtitle visible and the idle document available for status queries.
    return result;
  })();
  stopping.finally(() => { stopping = null; }).catch(() => {});
  return stopping;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  let work;
  if (message.type === 'START_CAPTURE') work = handleStartCapture(message.tabId, message.config);
  if (message.type === 'STOP_CAPTURE') work = handleStopCapture();
  if (message.type === 'GET_CAPTURE_STATUS') work = getStatus();
  const fromOffscreen = sender.url === chrome.runtime.getURL('offscreen.html');
  if (message.type === 'CAPTURE_STATE' && fromOffscreen) work = saveStatus(message.status);
  if (message.type === 'SUBTITLE_UPDATE' && fromOffscreen) {
    // Route by the session's tab ID, not a service worker global that can disappear.
    work = chrome.tabs.sendMessage(message.tabId, message).catch(() => ({ success: false }));
  }
  if (work) {
    work.then(sendResponse, () => sendResponse({ success: false, error: 'Extension operation failed.' }));
    return true;
  }
  return false;
});

chrome.tabs.onRemoved.addListener(tabId => {
  void getStatus().then(status => {
    if (status.tabId === tabId && ACTIVE_STATES.includes(status.state)) return handleStopCapture();
  }).catch(() => {});
});

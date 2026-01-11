console.log('[Background] Service worker started');

let offscreenDocumentCreated = false;
let currentTabId = null;

async function ensureOffscreenDocument() {
  console.log('[Background] Checking offscreen document');
  
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT']
  });
  
  if (existingContexts.length > 0) {
    console.log('[Background] Offscreen document already exists');
    offscreenDocumentCreated = true;
    return;
  }
  
  console.log('[Background] Creating offscreen document');
  await chrome.offscreen.createDocument({
    url: 'offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Capture tab audio for speech-to-text transcription'
  });
  offscreenDocumentCreated = true;
  console.log('[Background] Offscreen document created');
}

async function closeOffscreenDocument() {
  console.log('[Background] Closing offscreen document');
  if (offscreenDocumentCreated) {
    try {
      await chrome.offscreen.closeDocument();
      offscreenDocumentCreated = false;
      console.log('[Background] Offscreen document closed');
    } catch (err) {
      console.log('[Background] Error closing offscreen document:', err);
    }
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Background] Received message:', message.type, message);
  
  if (message.type === 'START_CAPTURE') {
    handleStartCapture(message.tabId, message.config)
      .then(result => {
        console.log('[Background] Start capture result:', result);
        sendResponse(result);
      })
      .catch(err => {
        console.error('[Background] Start capture error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
  
  if (message.type === 'STOP_CAPTURE') {
    handleStopCapture()
      .then(() => {
        console.log('[Background] Stop capture completed');
        sendResponse({ success: true });
      })
      .catch(err => {
        console.error('[Background] Stop capture error:', err);
        sendResponse({ success: false, error: err.message });
      });
    return true;
  }
  
  if (message.type === 'SUBTITLE_UPDATE') {
    console.log('[Background] Forwarding subtitle update to tab:', currentTabId);
    if (currentTabId) {
      chrome.tabs.sendMessage(currentTabId, message).catch(err => {
        console.log('[Background] Error sending to content script:', err);
      });
    }
    return false;
  }
  
  if (message.type === 'CAPTURE_ERROR') {
    console.error('[Background] Capture error from offscreen:', message.error);
    handleStopCapture();
    return false;
  }
  
  return false;
});

async function injectContentScript(tabId) {
  console.log('[Background] Injecting content script to tab:', tabId);
  
  try {
    await chrome.scripting.insertCSS({
      target: { tabId },
      files: ['content.css']
    });
    console.log('[Background] CSS injected');
    
    await chrome.scripting.executeScript({
      target: { tabId },
      files: ['content.js']
    });
    console.log('[Background] Content script injected');
  } catch (err) {
    console.log('[Background] Error injecting content script:', err);
    throw err;
  }
}

async function handleStartCapture(tabId, config) {
  console.log('[Background] Starting capture for tab:', tabId);
  currentTabId = tabId;
  
  await injectContentScript(tabId);
  await ensureOffscreenDocument();
  
  console.log('[Background] Getting tab capture stream ID');
  const streamId = await chrome.tabCapture.getMediaStreamId({
    targetTabId: tabId
  });
  console.log('[Background] Got stream ID:', streamId);
  
  console.log('[Background] Sending start message to offscreen');
  const response = await chrome.runtime.sendMessage({
    type: 'OFFSCREEN_START_CAPTURE',
    streamId,
    config
  });
  
  console.log('[Background] Offscreen response:', response);
  return response;
}

async function handleStopCapture() {
  console.log('[Background] Stopping capture');
  
  try {
    await chrome.runtime.sendMessage({ type: 'OFFSCREEN_STOP_CAPTURE' });
  } catch (err) {
    console.log('[Background] Error sending stop to offscreen:', err);
  }
  
  if (currentTabId) {
    try {
      await chrome.tabs.sendMessage(currentTabId, { type: 'HIDE_SUBTITLE' });
    } catch (err) {
      console.log('[Background] Error sending hide to content:', err);
    }
  }
  
  currentTabId = null;
  await closeOffscreenDocument();
}

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === currentTabId) {
    console.log('[Background] Captured tab was closed');
    handleStopCapture();
    chrome.storage.local.set({ isCapturing: false });
  }
});
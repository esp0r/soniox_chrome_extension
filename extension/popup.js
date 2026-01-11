console.log('[Popup] Popup script loaded');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const apiKeyInput = document.getElementById('apiKey');
const sourceLangSelect = document.getElementById('sourceLang');
const targetLangSelect = document.getElementById('targetLang');

async function loadSettings() {
  console.log('[Popup] Loading settings from storage');
  const result = await chrome.storage.local.get(['apiKey', 'sourceLang', 'targetLang', 'isCapturing']);
  if (result.apiKey) apiKeyInput.value = result.apiKey;
  if (result.sourceLang) sourceLangSelect.value = result.sourceLang;
  if (result.targetLang) targetLangSelect.value = result.targetLang;
  
  updateUI(result.isCapturing);
  console.log('[Popup] Settings loaded, isCapturing:', result.isCapturing);
}

async function saveSettings() {
  console.log('[Popup] Saving settings');
  await chrome.storage.local.set({
    apiKey: apiKeyInput.value,
    sourceLang: sourceLangSelect.value,
    targetLang: targetLangSelect.value
  });
}

function updateUI(isCapturing) {
  if (isCapturing) {
    startBtn.style.display = 'none';
    stopBtn.style.display = 'block';
    statusDiv.className = 'status running';
    statusDiv.textContent = '🔴 Capturing audio...';
  } else {
    startBtn.style.display = 'block';
    stopBtn.style.display = 'none';
    statusDiv.className = 'status idle';
    statusDiv.textContent = 'Ready to capture';
  }
}

function showError(message) {
  statusDiv.className = 'status error';
  statusDiv.textContent = '❌ ' + message;
}

startBtn.addEventListener('click', async () => {
  console.log('[Popup] Start button clicked');
  
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showError('Please enter your API key');
    return;
  }
  
  await saveSettings();
  
  startBtn.disabled = true;
  statusDiv.className = 'status idle';
  statusDiv.textContent = 'Starting capture...';
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('[Popup] Current tab:', tab.id, tab.url);
    
    const response = await chrome.runtime.sendMessage({
      type: 'START_CAPTURE',
      tabId: tab.id,
      config: {
        apiKey,
        sourceLang: sourceLangSelect.value,
        targetLang: targetLangSelect.value
      }
    });
    
    console.log('[Popup] Start capture response:', response);
    
    if (response?.success) {
      await chrome.storage.local.set({ isCapturing: true });
      updateUI(true);
    } else {
      showError(response?.error || 'Failed to start capture');
    }
  } catch (err) {
    console.error('[Popup] Error starting capture:', err);
    showError(err.message);
  } finally {
    startBtn.disabled = false;
  }
});

stopBtn.addEventListener('click', async () => {
  console.log('[Popup] Stop button clicked');
  
  try {
    const response = await chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' });
    console.log('[Popup] Stop capture response:', response);
    
    await chrome.storage.local.set({ isCapturing: false });
    updateUI(false);
  } catch (err) {
    console.error('[Popup] Error stopping capture:', err);
    showError(err.message);
  }
});

apiKeyInput.addEventListener('change', saveSettings);
sourceLangSelect.addEventListener('change', saveSettings);
targetLangSelect.addEventListener('change', saveSettings);

loadSettings();

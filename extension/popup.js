console.log('[Popup] Popup script loaded');

const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const statusDiv = document.getElementById('status');
const apiKeyInput = document.getElementById('apiKey');
const sourceLangSelect = document.getElementById('sourceLang');
const targetLangSelect = document.getElementById('targetLang');
const displayModeSelect = document.getElementById('displayMode');
const fontSizeRange = document.getElementById('fontSize');
const fontSizeValue = document.getElementById('fontSizeValue');
const maxLinesRange = document.getElementById('maxLines');
const maxLinesValue = document.getElementById('maxLinesValue');
const glossaryText = document.getElementById('glossaryText');
const glossaryEnabled = document.getElementById('glossaryEnabled');
const glossaryTargetLang = document.getElementById('glossaryTargetLang');
const glossaryStatus = document.getElementById('glossaryStatus');

function glossaryConfig() {
  return { glossaryText: glossaryText.value, glossaryEnabled: glossaryEnabled.checked,
    glossaryTargetLang: glossaryTargetLang.value, targetLang: targetLangSelect.value };
}

function validateGlossary() {
  try {
    const context = SonioxGlossary.parse(glossaryText.value, true);
    glossaryStatus.textContent = `${context?.terms.length || 0} terms` +
      (glossaryTargetLang.value !== targetLangSelect.value ? ' · Recognition only: translation languages differ.' : '');
    return true;
  } catch (error) {
    glossaryStatus.textContent = error.message;
    return false;
  }
}

async function loadSettings() {
  console.log('[Popup] Loading settings from storage');
  const result = await chrome.storage.local.get([
    'apiKey', 'sourceLang', 'targetLang',
    'fontSize', 'displayMode', 'maxLines', 'glossaryText', 'glossaryEnabled', 'glossaryTargetLang'
  ]);

  if (result.apiKey) apiKeyInput.value = result.apiKey;
  glossaryText.value = result.glossaryText || '';
  glossaryEnabled.checked = Boolean(result.glossaryEnabled);
  glossaryTargetLang.value = result.glossaryTargetLang || 'zh';
  validateGlossary();
  if (result.sourceLang) sourceLangSelect.value = result.sourceLang;
  if (result.targetLang) targetLangSelect.value = result.targetLang;
  if (result.displayMode) displayModeSelect.value = result.displayMode;
  if (result.fontSize) {
    fontSizeRange.value = result.fontSize;
    fontSizeValue.textContent = result.fontSize + 'px';
  }
  if (result.maxLines) {
    maxLinesRange.value = result.maxLines;
    maxLinesValue.textContent = result.maxLines;
  }
  
  await refreshStatus();
}

async function saveSettings() {
  console.log('[Popup] Saving settings');
  await chrome.storage.local.set({
    glossaryText: glossaryText.value,
    glossaryEnabled: glossaryEnabled.checked,
    glossaryTargetLang: glossaryTargetLang.value,
    apiKey: apiKeyInput.value.trim(),
    sourceLang: sourceLangSelect.value,
    targetLang: targetLangSelect.value,
    displayMode: displayModeSelect.value,
    fontSize: parseInt(fontSizeRange.value),
    maxLines: parseInt(maxLinesRange.value)
  });
}

function updateUI(status = { state: 'idle' }) {
  const active = ['connecting', 'running', 'reconnecting', 'stopping'].includes(status.state);
  startBtn.style.display = active ? 'none' : 'block';
  stopBtn.style.display = active ? 'block' : 'none';
  stopBtn.disabled = status.state === 'stopping';
  statusDiv.className = active ? 'status running' : 'status idle';
  const labels = {
    idle: 'Ready to capture', connecting: 'Connecting to Soniox...',
    running: 'Capturing audio...', reconnecting: 'Reconnecting... audio during interruption may be lost.',
    stopping: 'Finishing the last subtitles...'
  };
  statusDiv.textContent = labels[status.state] || 'Ready to capture';
  if (status.error) showError(status.error);
}

async function refreshStatus() {
  const status = await chrome.runtime.sendMessage({ type: 'GET_CAPTURE_STATUS' });
  if (status?.state) updateUI(status);
}

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes.captureStatus) updateUI(changes.captureStatus.newValue);
});

function showError(message) {
  statusDiv.className = 'status error';
  statusDiv.textContent = '❌ ' + message;
}

fontSizeRange.addEventListener('input', () => {
  fontSizeValue.textContent = fontSizeRange.value + 'px';
});
maxLinesRange.addEventListener('input', () => {
  maxLinesValue.textContent = maxLinesRange.value;
});

fontSizeRange.addEventListener('change', saveSettings);
maxLinesRange.addEventListener('change', saveSettings);
displayModeSelect.addEventListener('change', saveSettings);

startBtn.addEventListener('click', async () => {
  console.log('[Popup] Start button clicked');
  
  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showError('Please enter your API key');
    return;
  }
  
  startBtn.disabled = true;
  statusDiv.className = 'status idle';
  statusDiv.textContent = 'Starting capture...';
  
  try {
    if (glossaryEnabled.checked && !validateGlossary()) throw new Error('Please fix the glossary before starting.');
    await saveSettings();
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    console.log('[Popup] Current tab:', tab.id, tab.url);
    
    const response = await chrome.runtime.sendMessage({
      type: 'START_CAPTURE',
      tabId: tab.id,
      config: {
        ...glossaryConfig(),
        apiKey,
        sourceLang: sourceLangSelect.value,
        targetLang: targetLangSelect.value
      }
    });
    if (response?.success) {
      await refreshStatus();
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
  stopBtn.disabled = true;
  try {
    const response = await chrome.runtime.sendMessage({ type: 'STOP_CAPTURE' });
    await refreshStatus();
    if (!response?.success) showError(response?.error || 'Failed to stop capture');
  } catch {
    showError('Could not stop capture. Please reopen the popup and try again.');
  } finally {
    stopBtn.disabled = false;
  }
});

apiKeyInput.addEventListener('change', saveSettings);
sourceLangSelect.addEventListener('change', saveSettings);
targetLangSelect.addEventListener('change', saveSettings);
targetLangSelect.addEventListener('change', validateGlossary);

async function saveGlossary() {
  validateGlossary();
  try { await saveSettings(); } catch { showError('Could not save the glossary.'); }
}
glossaryText.addEventListener('input', saveGlossary);
glossaryText.addEventListener('keydown', event => {
  if (event.key === 'Tab' && !event.shiftKey) {
    event.preventDefault();
    glossaryText.setRangeText('\t', glossaryText.selectionStart, glossaryText.selectionEnd, 'end');
    void saveGlossary();
  }
});
glossaryEnabled.addEventListener('change', saveGlossary);
glossaryTargetLang.addEventListener('change', saveGlossary);
document.getElementById('glossaryFile').addEventListener('change', async event => {
  try {
    const file = event.target.files[0];
    if (!file) return;
    if (file.size > 100000) throw new Error('Choose a glossary smaller than 100 KB.');
    const text = await file.text();
    SonioxGlossary.parse(text, true);
    glossaryText.value = text;
    glossaryEnabled.checked = true;
    await saveGlossary();
  } catch (error) { showError(error.message); }
  finally { event.target.value = ''; }
});
document.getElementById('glossaryExport').addEventListener('click', () => {
  const url = URL.createObjectURL(new Blob([glossaryText.value], { type: 'text/tab-separated-values;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url; link.download = `soniox-glossary-${glossaryTargetLang.value}.tsv`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

loadSettings().catch(() => showError('Could not load extension settings.'));

console.log('[Content] Content script loaded');

let subtitleContainer = null;
let innerContainer = null;
let originalTextEl = null;
let translationTextEl = null;
let originalInterimEl = null;
let translationInterimEl = null;
let isDragging = false;
let dragStartX = 0;
let dragStartY = 0;
let initialLeft = 0;
let initialTop = 0;

let settings = {
  fontSize: 20,
  displayMode: 'both' // 'both', 'original', 'translation'
};

async function loadSettings() {
  try {
    const result = await chrome.storage.local.get(['fontSize', 'displayMode']);
    if (result.fontSize) settings.fontSize = result.fontSize;
    if (result.displayMode) settings.displayMode = result.displayMode;
    console.log('[Content] Settings loaded:', settings);
    applySettings();
  } catch (err) {
    console.log('[Content] Error loading settings:', err);
  }
}

function applySettings() {
  if (!subtitleContainer) return;
  
  const baseSize = settings.fontSize;
  if (originalTextEl) {
    originalTextEl.style.fontSize = baseSize + 'px';
  }
  if (translationTextEl) {
    translationTextEl.style.fontSize = (baseSize - 2) + 'px';
  }
  
  if (originalTextEl && translationTextEl) {
    switch (settings.displayMode) {
      case 'original':
        originalTextEl.style.display = 'block';
        translationTextEl.style.display = 'none';
        break;
      case 'translation':
        originalTextEl.style.display = 'none';
        translationTextEl.style.display = 'block';
        break;
      default:
        originalTextEl.style.display = 'block';
        translationTextEl.style.display = 'block';
    }
  }
}

function createSubtitleOverlay() {
  console.log('[Content] Creating subtitle overlay');
  
  if (subtitleContainer) {
    console.log('[Content] Subtitle overlay already exists');
    return;
  }
  
  subtitleContainer = document.createElement('div');
  subtitleContainer.id = 'soniox-subtitle-container';
  
  innerContainer = document.createElement('div');
  innerContainer.id = 'soniox-subtitle-inner';
  
  const contentContainer = document.createElement('div');
  contentContainer.id = 'soniox-subtitle-content';
  
  originalTextEl = document.createElement('div');
  originalTextEl.id = 'soniox-original-text';
  originalTextEl.className = 'soniox-subtitle-text';

  originalInterimEl = document.createElement('span');
  originalInterimEl.className = 'soniox-interim';
  originalTextEl.appendChild(originalInterimEl);

  translationTextEl = document.createElement('div');
  translationTextEl.id = 'soniox-translation-text';
  translationTextEl.className = 'soniox-subtitle-text soniox-translation';

  translationInterimEl = document.createElement('span');
  translationInterimEl.className = 'soniox-interim';
  translationTextEl.appendChild(translationInterimEl);

  contentContainer.appendChild(originalTextEl);
  contentContainer.appendChild(translationTextEl);
  innerContainer.appendChild(contentContainer);
  subtitleContainer.appendChild(innerContainer);
  document.body.appendChild(subtitleContainer);
  
  setupDragListeners();
  applySettings();
  console.log('[Content] Subtitle overlay created');
}

function setupDragListeners() {
  innerContainer.addEventListener('mousedown', (e) => {
    const rect = innerContainer.getBoundingClientRect();
    const resizeZone = 20;
    const isInResizeZone = (rect.right - e.clientX < resizeZone) && 
                           (rect.bottom - e.clientY < resizeZone);
    
    if (isInResizeZone) {
      return;
    }
    
    isDragging = true;
    subtitleContainer.classList.add('dragging');
    
    dragStartX = e.clientX;
    dragStartY = e.clientY;
    
    const containerRect = subtitleContainer.getBoundingClientRect();
    initialLeft = containerRect.left;
    initialTop = containerRect.top;
    
    subtitleContainer.style.transform = 'none';
    subtitleContainer.style.left = initialLeft + 'px';
    subtitleContainer.style.top = initialTop + 'px';
    subtitleContainer.style.bottom = 'auto';
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const deltaX = e.clientX - dragStartX;
    const deltaY = e.clientY - dragStartY;
    
    subtitleContainer.style.left = (initialLeft + deltaX) + 'px';
    subtitleContainer.style.top = (initialTop + deltaY) + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      subtitleContainer.classList.remove('dragging');
    }
  });
}

const MAX_FINALIZED_SPANS = 30;

function appendFinalizedText(container, interimEl, text) {
  if (!text) return;
  const span = document.createElement('span');
  span.className = 'soniox-finalized';
  span.textContent = text;
  container.insertBefore(span, interimEl);
}

function trimOldSpans(container) {
  const finalized = container.querySelectorAll('.soniox-finalized');
  const excess = finalized.length - MAX_FINALIZED_SPANS;
  for (let i = 0; i < excess; i++) {
    finalized[i].remove();
  }
}

function updateSubtitles(subtitles) {
  if (!subtitleContainer) {
    createSubtitleOverlay();
  }

  subtitleContainer.style.display = 'block';

  const { newFinalOriginal, newFinalTranslation, interimOriginal, interimTranslation } = subtitles;

  // 追加已确认的文本（稳定，不会再变）
  appendFinalizedText(originalTextEl, originalInterimEl, newFinalOriginal);
  appendFinalizedText(translationTextEl, translationInterimEl, newFinalTranslation);

  // 更新临时文本（正在识别中）
  originalInterimEl.textContent = interimOriginal || '';
  translationInterimEl.textContent = interimTranslation || '';

  // 裁剪过多的已确认 span
  trimOldSpans(originalTextEl);
  trimOldSpans(translationTextEl);

  // 自动滚动到最新内容
  innerContainer.scrollTop = innerContainer.scrollHeight;
}

function hideSubtitles() {
  console.log('[Content] Hiding subtitles');
  if (subtitleContainer) {
    subtitleContainer.style.display = 'none';
    // 清除所有已确认的 span 和临时文本
    originalTextEl.querySelectorAll('.soniox-finalized').forEach(el => el.remove());
    translationTextEl.querySelectorAll('.soniox-finalized').forEach(el => el.remove());
    originalInterimEl.textContent = '';
    translationInterimEl.textContent = '';
  }
}

function removeSubtitleOverlay() {
  console.log('[Content] Removing subtitle overlay');
  if (subtitleContainer) {
    subtitleContainer.remove();
    subtitleContainer = null;
    innerContainer = null;
    originalTextEl = null;
    translationTextEl = null;
    originalInterimEl = null;
    translationInterimEl = null;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('[Content] Received message:', message.type);
  
  if (message.type === 'SUBTITLE_UPDATE') {
    updateSubtitles(message.subtitles);
    sendResponse({ success: true });
    return false;
  }
  
  if (message.type === 'HIDE_SUBTITLE') {
    hideSubtitles();
    sendResponse({ success: true });
    return false;
  }
  
  if (message.type === 'UPDATE_SETTINGS') {
    settings = { ...settings, ...message.settings };
    applySettings();
    sendResponse({ success: true });
    return false;
  }
  
  return false;
});

chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local') {
    if (changes.fontSize) settings.fontSize = changes.fontSize.newValue;
    if (changes.displayMode) settings.displayMode = changes.displayMode.newValue;
    applySettings();
  }
});

loadSettings();
console.log('[Content] Message listener registered');

console.log('[Content] Content script loaded');

let subtitleContainer = null;
let originalTextEl = null;
let translationTextEl = null;
let isDragging = false;
let dragOffset = { x: 0, y: 0 };

function createSubtitleOverlay() {
  console.log('[Content] Creating subtitle overlay');
  
  if (subtitleContainer) {
    console.log('[Content] Subtitle overlay already exists');
    return;
  }
  
  subtitleContainer = document.createElement('div');
  subtitleContainer.id = 'soniox-subtitle-container';
  
  const dragHint = document.createElement('div');
  dragHint.id = 'soniox-drag-hint';
  dragHint.textContent = '拖拽移动位置';
  
  const innerContainer = document.createElement('div');
  innerContainer.id = 'soniox-subtitle-inner';
  
  originalTextEl = document.createElement('div');
  originalTextEl.id = 'soniox-original-text';
  originalTextEl.className = 'soniox-subtitle-text';
  
  translationTextEl = document.createElement('div');
  translationTextEl.id = 'soniox-translation-text';
  translationTextEl.className = 'soniox-subtitle-text soniox-translation';
  
  innerContainer.appendChild(originalTextEl);
  innerContainer.appendChild(translationTextEl);
  subtitleContainer.appendChild(dragHint);
  subtitleContainer.appendChild(innerContainer);
  document.body.appendChild(subtitleContainer);
  
  setupDragListeners();
  console.log('[Content] Subtitle overlay created with drag support');
}

function setupDragListeners() {
  subtitleContainer.addEventListener('mousedown', (e) => {
    isDragging = true;
    subtitleContainer.classList.add('dragging');
    
    const rect = subtitleContainer.getBoundingClientRect();
    dragOffset.x = e.clientX - rect.left - rect.width / 2;
    dragOffset.y = e.clientY - rect.top - rect.height / 2;
    
    subtitleContainer.style.transform = 'none';
    subtitleContainer.style.left = rect.left + rect.width / 2 + 'px';
    subtitleContainer.style.top = rect.top + rect.height / 2 + 'px';
    subtitleContainer.style.bottom = 'auto';
    
    e.preventDefault();
  });
  
  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    
    const x = e.clientX - dragOffset.x;
    const y = e.clientY - dragOffset.y;
    
    subtitleContainer.style.left = x + 'px';
    subtitleContainer.style.top = y + 'px';
  });
  
  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      subtitleContainer.classList.remove('dragging');
    }
  });
}

function updateSubtitles(subtitles) {
  console.log('[Content] Updating subtitles:', 
    'original:', subtitles.original?.slice(-30) || '',
    'translation:', subtitles.translation?.slice(-30) || '');
  
  if (!subtitleContainer) {
    createSubtitleOverlay();
  }
  
  subtitleContainer.style.display = 'block';
  
  const maxLength = 200;
  let original = subtitles.original || '';
  let translation = subtitles.translation || '';
  
  if (original.length > maxLength) {
    original = '...' + original.slice(-maxLength);
  }
  if (translation.length > maxLength) {
    translation = '...' + translation.slice(-maxLength);
  }
  
  originalTextEl.textContent = original;
  translationTextEl.textContent = translation;
}

function hideSubtitles() {
  console.log('[Content] Hiding subtitles');
  if (subtitleContainer) {
    subtitleContainer.style.display = 'none';
    originalTextEl.textContent = '';
    translationTextEl.textContent = '';
  }
}

function removeSubtitleOverlay() {
  console.log('[Content] Removing subtitle overlay');
  if (subtitleContainer) {
    subtitleContainer.remove();
    subtitleContainer = null;
    originalTextEl = null;
    translationTextEl = null;
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
  
  return false;
});

console.log('[Content] Message listener registered');

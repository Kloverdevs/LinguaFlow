import { sendToBackground } from '@/shared/message-bus';
import { getSettings } from '@/shared/storage';
import { TranslationResult } from '@/types/translation';

let pdfPanel: HTMLElement | null = null;
let pdfPanelContent: HTMLElement | null = null;

let isPdfActive = false;

export function initPdfHandler() {
  const isPdfUrl = window.location.pathname.endsWith('.pdf');
  const isPdfExtension = window.location.protocol === 'chrome-extension:' && document.contentType === 'application/pdf';
  const isPdfViewer = document.querySelector('embed[type="application/pdf"]') !== null 
                      || document.querySelector('pdf-viewer') !== null;
                      
  if (isPdfUrl || isPdfExtension || isPdfViewer) {
    isPdfActive = true;
    console.log('[LinguaFlow] PDF Viewer detected. Initializing PDF selection handler.');
    createPdfSidePanel();
    setupPdfSelectionListener();
  }
}

function createPdfSidePanel() {
  pdfPanel = document.createElement('div');
  pdfPanel.id = 'it-pdf-panel';
  pdfPanel.style.position = 'fixed';
  pdfPanel.style.top = '10px';
  pdfPanel.style.right = '10px';
  pdfPanel.style.width = '300px';
  pdfPanel.style.maxHeight = '90vh';
  pdfPanel.style.backgroundColor = 'rgba(255, 255, 255, 0.95)';
  pdfPanel.style.backdropFilter = 'blur(10px)';
  pdfPanel.style.boxShadow = '0 4px 20px rgba(0,0,0,0.15)';
  pdfPanel.style.borderRadius = '12px';
  pdfPanel.style.padding = '16px';
  pdfPanel.style.zIndex = '2147483647';
  pdfPanel.style.fontFamily = 'system-ui, -apple-system, sans-serif';
  pdfPanel.style.display = 'none';
  pdfPanel.style.flexDirection = 'column';
  pdfPanel.style.gap = '10px';
  pdfPanel.style.border = '1px solid rgba(0,0,0,0.1)';
  pdfPanel.style.overflowY = 'auto';

  const header = document.createElement('div');
  header.style.display = 'flex';
  header.style.justifyContent = 'space-between';
  header.style.alignItems = 'center';
  header.style.borderBottom = '1px solid #eee';
  header.style.paddingBottom = '8px';
  
  const title = document.createElement('strong');
  title.textContent = 'Translation';
  title.style.color = '#333';
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = '#888';
  closeBtn.onclick = () => {
    if (pdfPanel) pdfPanel.style.display = 'none';
  };

  header.appendChild(title);
  header.appendChild(closeBtn);
  pdfPanel.appendChild(header);

  pdfPanelContent = document.createElement('div');
  pdfPanelContent.style.fontSize = '14px';
  pdfPanelContent.style.lineHeight = '1.5';
  pdfPanelContent.style.color = '#444';
  pdfPanelContent.style.whiteSpace = 'pre-wrap';
  
  pdfPanel.appendChild(pdfPanelContent);
  
  // Try to append to body, but sometimes PDF viewers have heavily locked down DOMs
  if (document.body) {
    document.body.appendChild(pdfPanel);
  } else {
    document.documentElement.appendChild(pdfPanel);
  }
}

function setupPdfSelectionListener() {
  document.addEventListener('mouseup', async () => {
    // Small delay to allow selection to register
    setTimeout(async () => {
      const selection = window.getSelection();
      const text = selection?.toString().trim();
      
      if (!text || text.length < 2) return;

      const settings = await getSettings();
      if (!settings.hoverMode) return; // Only trigger if extension is actively enabled

      if (pdfPanel && pdfPanelContent) {
        pdfPanelContent.innerHTML = '<i>Translating...</i>';
        pdfPanel.style.display = 'flex';

        try {
          const resp = await sendToBackground<TranslationResult>({
            type: 'TRANSLATE_REQUEST',
            payload: { texts: [text], sourceLang: 'auto', targetLang: settings.targetLang },
          });

          if (resp && resp.success && resp.data.translatedTexts.length > 0) {
            pdfPanelContent.textContent = resp.data.translatedTexts[0];
          } else {
            pdfPanelContent.innerHTML = '<i style="color:red">Translation failed.</i>';
          }
        } catch (e) {
          pdfPanelContent.innerHTML = '<i style="color:red">Translation error.</i>';
        }
      }
    }, 150);
  });
}

export function isPdfPage(): boolean {
  return isPdfActive;
}

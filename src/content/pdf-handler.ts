import * as pdfjsLib from 'pdfjs-dist';

let isPdfActive = false;

export function initPdfHandler() {
  const isPdfUrl = window.location.pathname.endsWith('.pdf');
  const isPdfExtension = window.location.protocol === 'chrome-extension:' && document.contentType === 'application/pdf';
  const isPdfViewer = document.querySelector('embed[type="application/pdf"]') !== null 
                      || document.querySelector('pdf-viewer') !== null;
                      
  if (isPdfUrl || isPdfExtension || isPdfViewer) {
    isPdfActive = true;
    console.log('[LinguaFlow] PDF Viewer detected. Initializing custom PDF.js renderer.');
    hijackPdfViewer();
  }
}

function hijackPdfViewer() {
  // Hide the native Chrome PDF embed
  const embed = document.querySelector('embed[type="application/pdf"]') as HTMLElement;
  if (embed) embed.style.display = 'none';
  
  const pdfViewer = document.querySelector('pdf-viewer') as HTMLElement;
  if (pdfViewer) pdfViewer.style.display = 'none';

  document.body.style.backgroundColor = '#525659';
  document.body.style.overflow = 'auto'; // ensure scrolling

  const root = document.createElement('div');
  root.id = 'lf-pdf-root';
  root.style.padding = '20px';
  root.style.textAlign = 'center';
  document.body.appendChild(root);

  // Inject CSS rules to make translated PDF text visible over the canvas
  const style = document.createElement('style');
  style.textContent = `
    .lf-pdf-text {
      color: transparent;
    }
    .lf-pdf-text::selection {
      background: rgba(0, 122, 255, 0.3);
      color: transparent;
    }
    .lf-pdf-text [data-immersive-translated="true"],
    .lf-pdf-text .it-dyslexia-font {
      color: var(--it-text-color, #000) !important;
      background: rgba(255, 255, 255, 0.9) !important;
      border-radius: 4px;
      padding: 0 2px;
    }
  `;
  document.head.appendChild(style);

  // Set up PDF.js worker
  pdfjsLib.GlobalWorkerOptions.workerSrc = chrome.runtime.getURL('pdfjs/pdf.worker.min.mjs');

  renderPdfFullPage(window.location.href, root);
}

async function renderPdfFullPage(url: string, container: HTMLElement) {
  try {
    const loadingTask = pdfjsLib.getDocument(url);
    const pdf = await loadingTask.promise;
    console.log(`[LinguaFlow] PDF Loaded: ${pdf.numPages} pages.`);
    
    // Render each page sequentially or all at once
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      const viewport = page.getViewport({ scale: 1.5 });

      const pageContainer = document.createElement('div');
      pageContainer.className = 'lf-pdf-page';
      pageContainer.style.position = 'relative';
      pageContainer.style.width = viewport.width + 'px';
      pageContainer.style.height = viewport.height + 'px';
      pageContainer.style.margin = '0 auto 20px auto';
      pageContainer.style.backgroundColor = 'white';
      pageContainer.style.boxShadow = '0 4px 10px rgba(0,0,0,0.5)';
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.display = 'block';
      pageContainer.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        page.render({ canvasContext: ctx, viewport: viewport } as any);
      }

      // Text Layer mapping
      const textLayer = document.createElement('div');
      textLayer.classList.add('lf-pdf-text-layer');
      textLayer.style.position = 'absolute';
      textLayer.style.top = '0';
      textLayer.style.left = '0';
      textLayer.style.width = '100%';
      textLayer.style.height = '100%';
      textLayer.style.overflow = 'hidden';

      const textContent = await page.getTextContent();
      for (const item of textContent.items) {
        if ('str' in item && item.str.trim().length > 0) {
          const span = document.createElement('span');
          span.textContent = item.str;
          
          const tx = item.transform;
          // Font Height approx = item.height
          const x = tx[4] * 1.5;
          const y = viewport.height - (tx[5] * 1.5) - (item.height * 1.5);

          span.style.position = 'absolute';
          span.style.left = x + 'px';
          span.style.top = y + 'px';
          span.style.fontSize = (item.height * 1.5) + 'px';
          span.style.fontFamily = 'sans-serif';
          span.style.whiteSpace = 'pre';
          span.style.transformOrigin = 'left bottom';
          span.className = 'lf-pdf-text';
          
          textLayer.appendChild(span);
        }
      }

      pageContainer.appendChild(textLayer);
      container.appendChild(pageContainer);
    }
  } catch (err) {
    console.error('[LinguaFlow] PDF render error:', err);
    container.innerHTML = `<h2 style="color:white">Failed to render PDF using LinguaFlow PDF.js</h2><p style="color:red">${(err as Error).message}</p>`;
  }
}

export function isPdfPage(): boolean {
  return isPdfActive;
}

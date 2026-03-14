import browser from 'webextension-polyfill';
// Dynamic imports used to prevent JSDOM test environments from crashing on pdfjs-dist DOMMatrix references
let isPdfActive = false;

export function initPdfHandler() {
  const isPdfUrl = window.location.pathname.endsWith('.pdf');
  const isPdfExtension = window.location.protocol === 'chrome-extension:' && document.contentType === 'application/pdf';
  const isPdfViewer = document.querySelector('embed[type="application/pdf"]') !== null 
                      || document.querySelector('pdf-viewer') !== null;
                      
  if (isPdfUrl || isPdfExtension || isPdfViewer) {
    isPdfActive = true;
    console.log('[LinguaFlow] PDF Viewer detected. Ready for manual translation trigger via FAB.');
  }
}

export async function startPdfTranslation() {
  // Find native viewers
  const embed = document.querySelector('embed[type="application/pdf"]') as HTMLElement;
  const pdfViewer = document.querySelector('pdf-viewer') as HTMLElement;
  
  const targetViewer = embed || pdfViewer;
  
  if (targetViewer) {
    // Hide native viewer completely to allow LinguaFlow to take center stage
    targetViewer.style.display = 'none';
  }

  document.body.style.backgroundColor = '#525659';
  document.body.style.overflow = 'hidden'; // stop main body scrolling to prevent double bars

  const root = document.createElement('div');
  root.id = 'lf-pdf-root';
  root.style.position = 'fixed'; // fixed to scroll independently from native viewer
  root.style.top = '0';
  root.style.left = '0';
  root.style.width = '100vw';
  root.style.height = '100vh';
  root.style.padding = '20px 0';
  root.style.backgroundColor = '#e1e3e5'; // slightly lighter grey for translation side
  root.style.zIndex = '999999';
  root.style.textAlign = 'center';
  root.style.overflowY = 'auto'; // allow scrolling just the translated side
  root.style.borderLeft = '2px solid rgba(0,0,0,0.2)';
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
    .lf-pdf-text[data-immersive-translated="true"],
    .lf-pdf-text.it-replace-enter,
    .lf-pdf-text.it-dyslexia-font {
      color: var(--it-text-color, #000) !important;
      background: #ffffff !important;
      border-radius: 4px;
      padding: 0 2px;
    }
  `;
  document.head.appendChild(style);

  // Set up PDF.js worker via Blob URL to bypass content script CORS
  const pdfjsLib = await import('pdfjs-dist');
  let workerBlobUrl: string | null = null;
  try {
    const workerBlob = await fetch(browser.runtime.getURL('pdfjs/pdf.worker.min.mjs')).then(r => r.blob());
    workerBlobUrl = URL.createObjectURL(workerBlob);
    pdfjsLib.GlobalWorkerOptions.workerSrc = workerBlobUrl;
  } catch (err) {
    console.warn('[LinguaFlow] Failed to load PDF JS worker via Blob. It may fall back to fake worker.', err);
    pdfjsLib.GlobalWorkerOptions.workerSrc = browser.runtime.getURL('pdfjs/pdf.worker.min.mjs');
  }

  await renderPdfFullPage(window.location.href, root, pdfjsLib);

  // Revoke blob URL after worker is initialized to free memory
  if (workerBlobUrl) URL.revokeObjectURL(workerBlobUrl);
}

async function renderPdfFullPage(url: string, container: HTMLElement, pdfjsLib: any) {
  try {
    const loadingTask = pdfjsLib.getDocument({
      url: url,
      cMapUrl: 'https://unpkg.com/pdfjs-dist@3.4.120/cmaps/',
      cMapPacked: true
    });
    const pdf = await loadingTask.promise;
    console.log(`[LinguaFlow] PDF Loaded: ${pdf.numPages} pages.`);
    
    // Render each page sequentially or all at once
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum);
      // Calculate scale to fit 90% of the screen width
      const containerWidth = window.innerWidth * 0.9;
      let unscaledViewport = page.getViewport({ scale: 1 });
      let scale = containerWidth / unscaledViewport.width;
      if (scale > 1.5) scale = 1.5; // cap it so tiny PDFs don't get huge
      if (scale <= 0 || !isFinite(scale)) scale = 1.0; // fallback safety
      
      const viewport = page.getViewport({ scale });

      const pageContainer = document.createElement('div');
      pageContainer.className = 'lf-pdf-page';
      pageContainer.style.position = 'relative';
      pageContainer.style.width = viewport.width + 'px';
      pageContainer.style.height = viewport.height + 'px';
      pageContainer.style.margin = '0 auto 20px auto';
      pageContainer.style.backgroundColor = 'white';
      pageContainer.style.boxShadow = '0 4px 10px rgba(0,0,0,0.1)';
      
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      canvas.style.display = 'block';
      pageContainer.appendChild(canvas);

      const ctx = canvas.getContext('2d');
      if (ctx) {
        const renderTask = page.render({ canvasContext: ctx, viewport: viewport } as any);
        await renderTask.promise;
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
      
      // Group items by line based on Y coordinate to prevent 429 Rate Limits from individual character translations
      const lines = new Map<number, { text: string, x: number, y: number, fontHeight: number }>();
      
      for (const item of textContent.items) {
        if ('str' in item && item.str.trim().length > 0) {
          const tx = item.transform;
          const fontHeight = Math.sqrt(tx[2] * tx[2] + tx[3] * tx[3]) * scale;
          const x = tx[4] * scale;
          const y = viewport.height - (tx[5] * scale) - fontHeight;
          
          // Find if a line exists at roughly this Y coordinate
          let matchedY = -1;
          for (const key of lines.keys()) {
            if (Math.abs(key - y) < fontHeight * 0.5) {
              matchedY = key;
              break;
            }
          }
          
          if (matchedY !== -1) {
            const line = lines.get(matchedY)!;
            line.text += item.str;
            // Append spaced characters if necessary, but Japanese typically has no spaces
          } else {
            lines.set(y, { text: item.str, x, y, fontHeight });
          }
        }
      }

      for (const line of lines.values()) {
        const p = document.createElement('p');
        p.textContent = line.text;
        p.style.position = 'absolute';
        p.style.left = line.x + 'px';
        p.style.top = line.y + 'px';
        p.style.fontSize = line.fontHeight + 'px';
        p.style.fontFamily = 'sans-serif';
        // Use pre-wrap and constrain width so translated text wraps instead of bleeding off-screen
        p.style.whiteSpace = 'pre-wrap';
        p.style.width = `calc(100% - ${line.x}px)`;
        p.style.margin = '0'; 
        p.style.transformOrigin = 'left bottom';
        p.className = 'lf-pdf-text';
        
        textLayer.appendChild(p);
      }

      pageContainer.appendChild(textLayer);
      container.appendChild(pageContainer);
    }
  } catch (err) {
    console.error('[LinguaFlow] PDF render error:', err);
    container.textContent = '';
    const h2 = document.createElement('h2');
    h2.style.color = 'white';
    h2.textContent = 'Failed to render PDF using LinguaFlow PDF.js';
    const p = document.createElement('p');
    p.style.color = 'red';
    p.textContent = (err as Error).message;
    container.appendChild(h2);
    container.appendChild(p);
  }
}

export function isPdfPage(): boolean {
  return isPdfActive;
}

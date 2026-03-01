import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { initPdfHandler, isPdfPage } from '../../src/content/pdf-handler';

vi.mock('pdfjs-dist', () => ({
  getDocument: vi.fn(),
  GlobalWorkerOptions: {}
}));

describe('pdf-handler', () => {
  beforeEach(() => {
    // Reset DOM
    document.body.innerHTML = '';
    
    // Reset global URL implementations
    Object.defineProperty(window, 'location', {
      value: {
        pathname: '/',
        protocol: 'http:',
        href: 'http://localhost/'
      },
      writable: true,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should not activate on a standard HTML page', () => {
    initPdfHandler();
    expect(isPdfPage()).toBe(false);
  });

  it('should activate if the URL ends with .pdf', () => {
    window.location.pathname = '/document.pdf';
    initPdfHandler();
    expect(isPdfPage()).toBe(true);
  });

  it('should activate if an <embed type="application/pdf"> exists', () => {
    const embed = document.createElement('embed');
    embed.setAttribute('type', 'application/pdf');
    document.body.appendChild(embed);
    
    initPdfHandler();
    expect(isPdfPage()).toBe(true);
  });

  it('should activate if a <pdf-viewer> exists', () => {
    const viewer = document.createElement('pdf-viewer');
    document.body.appendChild(viewer);

    initPdfHandler();
    expect(isPdfPage()).toBe(true);
  });
});

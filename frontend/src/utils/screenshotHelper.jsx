import React, { useState } from 'react';
import html2canvas from 'html2canvas';

export const captureScreenshot = async (options = {}) => {
  const {
    element = document.body,
    deviceId = null,
    pageName = 'page',
    includeOverlay = true
  } = options;

  try {
    if (includeOverlay) {
      const overlay = document.createElement('div');
      overlay.id = 'screenshot-overlay';
      overlay.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 8px 16px;
        border-radius: 8px;
        font-size: 12px;
        font-family: monospace;
        z-index: 99999;
        pointer-events: none;
      `;
      overlay.innerHTML = `
        <div>SIPJOLT v1.01</div>
        <div>${new Date().toLocaleString()}</div>
        ${deviceId ? `<div>Device: ${deviceId}</div>` : ''}
      `;
      document.body.appendChild(overlay);
    }

    const canvas = await html2canvas(element, {
      useCORS: true,
      allowTaint: true,
      backgroundColor: '#0f172a',
      scale: 2,
      logging: false,
      ignoreElements: (el) => {
        return el.tagName === 'IFRAME' || el.classList?.contains('ignore-screenshot');
      },
      onclone: (doc) => {
        const style = doc.createElement('style');
        style.textContent = `
          * { 
            color: inherit !important;
            background-color: inherit !important;
          }
        `;
        doc.head.appendChild(style);
      }
    }).catch((err) => {
      console.warn('html2canvas partial failure, retrying with simpler config:', err.message);
      return html2canvas(element, {
        useCORS: false,
        allowTaint: true,
        backgroundColor: '#1e293b',
        scale: 1,
        logging: false
      });
    });

    const overlayEl = document.getElementById('screenshot-overlay');
    if (overlayEl) overlayEl.remove();

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = `sipjolt-${pageName}-${timestamp}.png`;

    const link = document.createElement('a');
    link.download = filename;
    link.href = canvas.toDataURL('image/png');
    link.click();

    return { success: true, filename };
  } catch (error) {
    console.error('Screenshot failed:', error);
    const overlayEl = document.getElementById('screenshot-overlay');
    if (overlayEl) overlayEl.remove();
    return { success: false, error: error.message };
  }
};

export const ScreenshotButton = ({ pageName = 'page', deviceId = null }) => {
  const [capturing, setCapturing] = useState(false);

  const handleCapture = async () => {
    setCapturing(true);
    await captureScreenshot({ pageName, deviceId });
    setTimeout(() => setCapturing(false), 500);
  };

  return (
    <button
      onClick={handleCapture}
      disabled={capturing}
      className="fixed bottom-4 right-4 z-50 w-12 h-12 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white rounded-full shadow-lg flex items-center justify-center text-xl transition-all hover:scale-110 active:scale-95"
      title="Capture Screenshot"
    >
      {capturing ? '⏳' : '📸'}
    </button>
  );
};

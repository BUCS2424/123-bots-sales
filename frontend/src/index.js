import React from "react";
import ReactDOM from "react-dom/client";
import "@/index.css";
import App from "@/App";

// Suppress ResizeObserver loop errors (benign error from Radix UI components)
// This is a known issue with no functional impact
const suppressResizeObserverError = (e) => {
  if (!e) return false;
  const message = e.message || e.reason?.message || (typeof e === 'string' ? e : '');
  if (message.includes('ResizeObserver loop') ||
      message.includes('ResizeObserver loop completed with undelivered notifications')) {
    e.stopImmediatePropagation?.();
    e.preventDefault?.();
    return true;
  }
  return false;
};

// Override window.onerror
const originalOnError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (typeof message === 'string' && message.includes('ResizeObserver loop')) {
    return true;
  }
  if (originalOnError) {
    return originalOnError(message, source, lineno, colno, error);
  }
  return false;
};

// Handle error events - capture phase to catch early
window.addEventListener('error', (e) => {
  const message = e.message || e.error?.message || '';
  if (message.includes('ResizeObserver loop')) {
    e.stopImmediatePropagation();
    e.preventDefault();
    return;
  }
  if (suppressResizeObserverError(e)) {
    return;
  }
}, true);

// Handle unhandled rejections
window.addEventListener('unhandledrejection', (e) => {
  if (e.reason && typeof e.reason.message === 'string' && 
      e.reason.message.includes('ResizeObserver loop')) {
    e.preventDefault();
  }
});

// Also suppress via ResizeObserver polyfill approach
if (typeof ResizeObserver !== 'undefined') {
  const OriginalResizeObserver = ResizeObserver;
  window.ResizeObserver = class extends OriginalResizeObserver {
    constructor(callback) {
      super((entries, observer) => {
        window.requestAnimationFrame(() => {
          try {
            callback(entries, observer);
          } catch (e) {
            // Suppress ResizeObserver errors silently
          }
        });
      });
    }
  };
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);

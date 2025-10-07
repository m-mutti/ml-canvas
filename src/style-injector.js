// Auto-inject CSS styles
function injectCSS() {
  const css = `
/* Component styles - using global scope for fixed positioned elements */
.ml-canvas-container {
  width: 100%;
  height: 100%;
  position: relative;
}

.ml-canvas {
  display: block;
  width: 100%;
  height: 100%;
}

.magnifier {
  position: fixed;
  width: 200px;
  height: 200px;
  border: 3px solid #667eea;
  border-radius: 50%;
  pointer-events: none;
  display: none;
  z-index: 1000;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.3);
  background: white;
  overflow: hidden;
}

.magnifier.visible {
  display: block;
}

.magnifier-canvas {
  position: absolute;
  width: auto;
  height: auto;
  cursor: none;
}

.inspect-popup {
  position: fixed;
  width: 400px;
  height: 400px;
  border: 3px solid #00ff00;
  border-radius: 8px;
  pointer-events: none;
  display: none;
  z-index: 1001;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  background: white;
  overflow: hidden;
}

.inspect-popup.visible {
  display: block;
}

.inspect-canvas {
  position: absolute;
  width: 400px;
  height: 400px;
}`

  if (typeof document !== 'undefined') {
    const styleElement = document.createElement('style')
    styleElement.textContent = css
    document.head.appendChild(styleElement)
  }
}

// Only inject once
let injected = false
export function ensureStylesInjected() {
  if (!injected) {
    injectCSS()
    injected = true
  }
}
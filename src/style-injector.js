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
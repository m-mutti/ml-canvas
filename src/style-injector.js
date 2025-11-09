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
  z-index: 1000000;
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
  min-height: 400px;
  border: 3px solid #00ff00;
  border-radius: 8px;
  pointer-events: none;
  display: none;
  z-index: 1000000;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  background: white;
  overflow: visible;
}

.inspect-popup.visible {
  display: block;
}

.inspect-popup.locked {
  pointer-events: all;
  border-color: #0099ff;
}

.inspect-canvas {
  position: absolute;
  width: 400px;
  height: 400px;
}

.inspect-statistics {
  position: relative;
  width: 100%;
  margin-top: 400px;
  padding: 12px;
  background: white;
  border-top: 1px solid #e0e0e0;
}

.statistics-card {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.statistic-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
  background: #f5f5f5;
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
}

.stat-name {
  font-weight: 600;
  color: #333;
}

.stat-value {
  color: #666;
  margin-left: auto;
}

.stat-value-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid #ccc;
  border-radius: 3px;
  font-size: 13px;
  font-family: inherit;
  margin-left: auto;
  min-width: 100px;
}

.stat-value-input:focus {
  outline: none;
  border-color: #0099ff;
  box-shadow: 0 0 0 2px rgba(0, 153, 255, 0.1);
}

.inspect-buttons {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 8px;
}

.inspect-buttons-row {
  display: flex;
  gap: 8px;
  align-items: stretch;
}

.save-button,
.delete-button,
.cancel-button {
  flex: 1;
  padding: 8px 12px;
  margin: 0;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  color: white;
  box-sizing: border-box;
  line-height: 1.5;
  height: 36px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  vertical-align: middle;
  text-align: center;
  -webkit-appearance: none;
  -moz-appearance: none;
  appearance: none;
}

.save-button {
  background: #00aa00;
}

.save-button:hover {
  background: #008800;
}

.delete-button {
  background: #ff6600;
}

.delete-button:hover {
  background: #dd4400;
}

.cancel-button {
  background: #ff4444;
  width: 100%;
}

.cancel-button:hover {
  background: #cc0000;
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

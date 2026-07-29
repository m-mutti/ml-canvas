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
  max-height: calc(100vh - 20px);
  border: 3px solid var(--mlc-inspect-border, #00ff00);
  border-radius: 8px;
  pointer-events: none;
  display: none;
  z-index: 1000000;
  box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
  background: var(--mlc-inspect-bg, white);
  overflow: hidden;
  flex-direction: column;
}

.inspect-popup.visible {
  display: flex;
}

.inspect-popup.locked {
  pointer-events: all;
  border-color: var(--mlc-inspect-border-locked, #0099ff);
}

.inspect-canvas {
  display: block;
  flex: 0 0 400px;
  width: 400px;
  height: 400px;
}

.inspect-shape-info {
  flex: 0 0 auto;
  width: 100%;
  padding: 8px 12px;
  background: var(--mlc-inspect-header-bg, #1a1a2e);
  display: flex;
  align-items: center;
  gap: 10px;
  border-top: 1px solid var(--mlc-inspect-divider, #e0e0e0);
}

.inspect-shape-info .shape-index {
  font-weight: bold;
  font-size: 16px;
  color: var(--mlc-inspect-header-index-color, #00ff00);
  font-family: monospace;
}

.inspect-shape-info .shape-id {
  font-size: 12px;
  color: var(--mlc-inspect-header-id-color, #aaaacc);
  font-family: monospace;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.inspect-statistics {
  flex: 1 1 auto;
  min-height: 0;
  width: 100%;
  padding: 12px;
  background: var(--mlc-inspect-stats-bg, white);
  border-top: 1px solid var(--mlc-inspect-divider, #e0e0e0);
  overflow-y: auto;
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
  background: var(--mlc-stat-item-bg, #f5f5f5);
  border-radius: 4px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
}

.stat-name {
  font-weight: 600;
  color: var(--mlc-stat-name-color, #333);
}

.stat-value {
  color: var(--mlc-stat-value-color, #666);
  margin-left: auto;
}

.stat-value-input {
  flex: 1;
  padding: 4px 8px;
  border: 1px solid var(--mlc-stat-input-border, #ccc);
  border-radius: 3px;
  font-size: 13px;
  font-family: inherit;
  margin-left: auto;
  min-width: 100px;
  background: var(--mlc-stat-input-bg, white);
  color: var(--mlc-stat-input-color, #111);
}

.stat-value-input:focus {
  outline: none;
  border-color: var(--mlc-inspect-border-locked, #0099ff);
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
  color: var(--mlc-button-text-color, white);
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
  background: var(--mlc-save-bg, #00aa00);
}

.save-button:hover {
  background: var(--mlc-save-hover-bg, #008800);
}

.delete-button {
  background: var(--mlc-delete-bg, #ff4444);
}

.delete-button:hover {
  background: var(--mlc-delete-hover-bg, #cc0000);
}

.cancel-button {
  background: var(--mlc-cancel-bg, #6c757d);
  width: 100%;
}

.cancel-button:hover {
  background: var(--mlc-cancel-hover-bg, #5a6268);
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

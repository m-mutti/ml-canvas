<script setup>
import { ref } from 'vue'
import MLCanvas from './components/MLCanvas.vue'

const canvasRef = ref(null)

const colors = [
  '#ff6b6b',
  '#4ecdc4',
  '#45b7d1',
  '#96ceb4',
  '#ffeaa7',
  '#dda0dd',
  '#98d8c8',
  '#f7dc6f',
]

const getRandomColor = () => colors[Math.floor(Math.random() * colors.length)]
const getRandomPosition = () => ({
  x: Math.random() * 400 + 50,
  y: Math.random() * 300 + 50,
})

const clearCanvas = () => {
  if (!canvasRef.value) return
  canvasRef.value.clearCanvas()
}

const addRectangle = () => {
  if (!canvasRef.value) return

  const pos = getRandomPosition()
  canvasRef.value.drawRectangle(pos.x, pos.y, 80, 60, {
    fillStyle: getRandomColor(),
    strokeStyle: '#2c3e50',
    lineWidth: 2,
  })
}

const addPolygon = () => {
  if (!canvasRef.value) return

  const centerX = Math.random() * 400 + 100
  const centerY = Math.random() * 300 + 100
  const size = 40

  const points = [
    { x: centerX, y: centerY - size },
    { x: centerX + size, y: centerY + size },
    { x: centerX - size, y: centerY + size },
  ]

  canvasRef.value.drawPolygon(points, {
    fillStyle: getRandomColor(),
    strokeStyle: '#2c3e50',
    lineWidth: 2,
  })
}
const addImage = async () => {
  if (!canvasRef.value) return

  try {
    // Load image from path and convert to base64
    const response = await fetch('/favicon.ico')
    const blob = await response.blob()

    // Convert blob to base64
    const reader = new FileReader()
    const base64String = await new Promise((resolve) => {
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(blob)
    })

    // Add image with auto-fitting
    await canvasRef.value.addImage(base64String)
  } catch (error) {
    console.error('Failed to load image:', error)
  }
}

const pasteImage = async () => {
  if (!canvasRef.value) return

  try {
    const result = await canvasRef.value.pasteImage()
    if (result) {
      console.log('Image pasted successfully:', result)
    } else {
      console.log('No image found in clipboard')
    }
  } catch (error) {
    console.error('Failed to paste image:', error)
  }
}

const togglePasteEnabled = () => {
  pasteEnabled.value = !pasteEnabled.value
}

const pasteEnabled = ref(true)
const drawingMode = ref('none')
const drawnShapes = ref([])

const setDrawingMode = (mode) => {
  drawingMode.value = mode
}

const getShapes = () => {
  if (!canvasRef.value) return []
  const shapes = canvasRef.value.getDrawnShapes()
  drawnShapes.value = shapes
  return shapes
}

const clearShapes = () => {
  if (!canvasRef.value) return
  canvasRef.value.clearDrawnShapes()
  drawnShapes.value = []
}

const exportShapes = () => {
  const shapes = getShapes()
  console.log('Drawn shapes:', shapes)

  // Create a downloadable JSON file
  const dataStr = JSON.stringify(shapes, null, 2)
  const dataBlob = new Blob([dataStr], { type: 'application/json' })
  const url = URL.createObjectURL(dataBlob)
  const link = document.createElement('a')
  link.href = url
  link.download = 'shapes.json'
  link.click()
  URL.revokeObjectURL(url)
}

const handleShapeCreated = (shape) => {
  console.log('New shape created:', shape)
  // Perform any actions you want when a shape is created
  // For example: send to API, update UI, validate shape, etc.
  drawnShapes.value.push(shape)
}
</script>

<template>
  <div class="app">
    <header class="header">
      <h1>ML Canvas Library Demo</h1>
      <div class="button-group">
        <button @click="addRectangle" class="btn btn-rectangle">Add Rectangle</button>
        <button @click="addPolygon" class="btn btn-polygon">Add Polygon</button>
        <button @click="addImage" class="btn btn-image">Add Image</button>
        <button @click="pasteImage" class="btn btn-paste">Paste Image</button>
        <button
          @click="togglePasteEnabled"
          class="btn btn-toggle"
          :class="{ disabled: !pasteEnabled }"
        >
          {{ pasteEnabled ? 'Disable' : 'Enable' }} Paste
        </button>
        <button @click="clearCanvas" class="btn btn-clear">Clear Canvas</button>
      </div>
      <div class="button-group">
        <button
          @click="setDrawingMode('none')"
          class="btn btn-mode"
          :class="{ active: drawingMode === 'none' }"
        >
          No Drawing
        </button>
        <button
          @click="setDrawingMode('rectangle')"
          class="btn btn-mode"
          :class="{ active: drawingMode === 'rectangle' }"
        >
          Rectangle
        </button>
        <button
          @click="setDrawingMode('polygon')"
          class="btn btn-mode"
          :class="{ active: drawingMode === 'polygon' }"
        >
          Polygon
        </button>
        <button
          @click="setDrawingMode('freestyle')"
          class="btn btn-mode"
          :class="{ active: drawingMode === 'freestyle' }"
        >
          Freestyle
        </button>
        <button @click="getShapes" class="btn btn-info">Get Shapes</button>
        <button @click="exportShapes" class="btn btn-export">Export Shapes</button>
        <button @click="clearShapes" class="btn btn-clear-shapes">Clear Shapes</button>
      </div>
    </header>

    <main class="main">
      <div class="canvas-wrapper">
        <MLCanvas
          ref="canvasRef"
          :pasteEnabled="pasteEnabled"
          :drawingMode="drawingMode"
          @shape-created="handleShapeCreated"
        />
        <div class="instructions">
          <p><strong>Instructions:</strong></p>
          <ul>
            <li>Copy an image to your clipboard (Ctrl+C on any image)</li>
            <li>Click "Paste Image" button or press Ctrl+V to paste</li>
            <li>Use "Enable/Disable Paste" to toggle paste functionality</li>
            <li><strong>Drawing:</strong> Select Rectangle or Polygon mode</li>
            <li><strong>Rectangle:</strong> Click and drag to draw</li>
            <li><strong>Polygon:</strong> Click points, right-click or double-click to finish</li>
            <li><strong>Freestyle:</strong> Click and drag to trace a path</li>
            <li>
              <strong>Sensitivity:</strong> Lower = smoother (more points), Higher = coarser (fewer
              points)
            </li>
            <li>Coordinates are scaled to match original image dimensions</li>
          </ul>
        </div>
        <div v-if="drawingMode === 'freestyle'" class="freestyle-controls">
          <p><strong>Freestyle Controls:</strong></p>
          <div class="control-group">
            <label>Sensitivity: {{ freestyleSensitivity }}</label>
            <input
              type="range"
              v-model.number="freestyleSensitivity"
              min="0.1"
              max="10"
              step="0.1"
              class="slider"
            />
          </div>
          <div class="control-group">
            <label>Simplification: {{ simplificationTolerance }}</label>
            <input
              type="range"
              v-model.number="simplificationTolerance"
              min="0.1"
              max="20"
              step="0.1"
              class="slider"
            />
          </div>
        </div>
        <div v-if="drawnShapes.length > 0" class="shapes-info">
          <p>
            <strong>Drawn Shapes ({{ drawnShapes.length }}):</strong>
          </p>
          <div class="shape-item" v-for="(shape, index) in drawnShapes" :key="index">
            <strong>{{ shape.type }}:</strong>
            <div v-if="shape.type === 'rectangle'">
              x: {{ shape.image.x }}, y: {{ shape.image.y }}, w: {{ shape.image.width }}, h:
              {{ shape.image.height }}
            </div>
            <div v-else-if="shape.type === 'polygon'">
              Points: {{ shape.image.map((p) => `(${p.x},${p.y})`).join(', ') }}
            </div>
            <div v-else-if="shape.type === 'freestyle'">
              Freestyle Path: {{ shape.image.length }} points
            </div>
          </div>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.app {
  height: 100vh;
  display: flex;
  flex-direction: column;
}

.header {
  padding: 20px;
  background: #f8f9fa;
  border-bottom: 1px solid #dee2e6;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  flex-wrap: wrap;
  gap: 15px;
}

.header h1 {
  margin: 0;
  color: #2c3e50;
}

.button-group {
  display: flex;
  gap: 10px;
}

.btn {
  padding: 10px 16px;
  color: white;
  border: none;
  border-radius: 5px;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
}

.btn-rectangle {
  background: #ff6b6b;
}

.btn-rectangle:hover {
  background: #ee5a52;
}

.btn-polygon {
  background: #4ecdc4;
}

.btn-polygon:hover {
  background: #45b7d1;
}

.btn-image {
  background: #ffa726;
}

.btn-image:hover {
  background: #ff9800;
}

.btn-clear {
  background: #6c757d;
}

.btn-clear:hover {
  background: #5a6268;
}

.btn-paste {
  background: #28a745;
}

.btn-paste:hover {
  background: #218838;
}

.btn-toggle {
  background: #17a2b8;
}

.btn-toggle:hover {
  background: #138496;
}

.btn-toggle.disabled {
  background: #dc3545;
}

.btn-toggle.disabled:hover {
  background: #c82333;
}

.btn-mode {
  background: #6f42c1;
}

.btn-mode:hover {
  background: #5a32a3;
}

.btn-mode.active {
  background: #28a745;
}

.btn-mode.active:hover {
  background: #218838;
}

.btn-info {
  background: #17a2b8;
}

.btn-info:hover {
  background: #138496;
}

.btn-export {
  background: #fd7e14;
}

.btn-export:hover {
  background: #e96a00;
}

.btn-clear-shapes {
  background: #dc3545;
}

.btn-clear-shapes:hover {
  background: #c82333;
}

.instructions {
  position: absolute;
  top: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 5px;
  border: 1px solid #dee2e6;
  max-width: 300px;
}

.instructions p {
  margin: 0 0 10px 0;
  font-weight: bold;
}

.instructions ul {
  margin: 0;
  padding-left: 20px;
}

.instructions li {
  margin-bottom: 5px;
}

.shapes-info {
  position: absolute;
  top: 10px;
  right: 10px;
  background: rgba(255, 255, 255, 0.9);
  padding: 15px;
  border-radius: 5px;
  border: 1px solid #dee2e6;
  max-width: 350px;
  max-height: 300px;
  overflow-y: auto;
}

.shapes-info p {
  margin: 0 0 10px 0;
  font-weight: bold;
}

.shape-item {
  margin-bottom: 8px;
  padding: 5px;
  background: #f8f9fa;
  border-radius: 3px;
  font-size: 12px;
}

.shape-item strong {
  color: #495057;
}

.main {
  flex: 1;
  padding: 20px;
}

.canvas-wrapper {
  width: 100%;
  height: 100%;
  border: 2px dashed #dee2e6;
  border-radius: 8px;
  position: relative;
}

.freestyle-controls {
  position: absolute;
  bottom: 10px;
  left: 10px;
  background: rgba(255, 255, 255, 0.95);
  padding: 15px;
  border-radius: 5px;
  border: 1px solid #dee2e6;
  min-width: 250px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.freestyle-controls p {
  margin: 0 0 10px 0;
  font-weight: bold;
  color: #495057;
}

.control-group {
  margin-bottom: 12px;
}

.control-group label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: #6c757d;
  margin-bottom: 4px;
}

.slider {
  width: 100%;
  height: 4px;
  border-radius: 2px;
  background: #ddd;
  outline: none;
  -webkit-appearance: none;
}

.slider::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0066ff;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}

.slider::-moz-range-thumb {
  width: 16px;
  height: 16px;
  border-radius: 50%;
  background: #0066ff;
  cursor: pointer;
  border: 2px solid white;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
}
</style>

<template>
  <div ref="containerRef" class="ml-canvas-container">
    <canvas
      ref="canvasRef"
      :width="canvasWidth"
      :height="canvasHeight"
      class="ml-canvas"
      @mousedown="handleMouseDown"
      @mousemove="handleMouseMove"
      @mouseup="handleMouseUp"
      @mouseleave="handleMouseLeave"
      @dblclick="handleDoubleClick"
      @contextmenu="handleRightClick"
      :style="{ cursor: drawingModeCursor }"
    ></canvas>
    <div
      ref="magnifierRef"
      class="magnifier"
      :class="{ visible: magnifierVisible && props.magnifierEnabled }"
    >
      <canvas ref="magnifierCanvasRef" class="magnifier-canvas"></canvas>
    </div>
    <div
      ref="inspectRef"
      class="inspect-popup"
      :class="{ visible: inspectVisible && props.drawingMode === 'inspect', locked: inspectLocked }"
    >
      <canvas ref="inspectCanvasRef" class="inspect-canvas"></canvas>
      <div v-if="currentShapeStatistics" class="inspect-statistics">
        <div class="statistics-card">
          <div v-for="(stat, index) in currentShapeStatistics" :key="index" class="statistic-item">
            <span class="stat-name">{{ stat.name }}:</span>
            <input
              v-if="inspectLocked && stat.editable !== false"
              :type="stat.type === 'number' ? 'number' : 'text'"
              class="stat-value-input"
              v-model="editableStatistics[index].value"
            />
            <span v-else class="stat-value">{{ stat.value }}</span>
          </div>
        </div>
        <div v-if="inspectLocked" class="inspect-buttons">
          <button class="save-button" @click="saveStatistics">Save</button>
          <button class="cancel-button" @click="cancelInspectLock">Cancel</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { ensureStylesInjected } from '../style-injector.js'

const props = defineProps({
  pasteEnabled: {
    type: Boolean,
    default: true,
  },
  drawingMode: {
    type: String,
    default: 'none', // 'none', 'rectangle', 'polygon', 'freestyle', 'freeform', 'delete', 'inspect'
    validator: (value) =>
      ['none', 'rectangle', 'polygon', 'freestyle', 'freeform', 'delete', 'inspect'].includes(
        value,
      ),
  },
  freestyleSensitivity: {
    type: Number,
    default: 1, // Lower values = more points (smoother), higher values = fewer points (coarser)
    validator: (value) => value >= 0.1 && value <= 10,
  },
  simplificationTolerance: {
    type: Number,
    default: 2, // Tolerance for path simplification algorithm
    validator: (value) => value >= 0.1 && value <= 20,
  },
  magnifierEnabled: {
    type: Boolean,
    default: false,
  },
  inspectPadding: {
    type: Number,
    default: 20, // Padding around shape in inspect mode (in image pixels)
    validator: (value) => value >= 0 && value <= 100,
  },
  showIndex: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits([
  'shape-created',
  'shape-removed',
  'canvas-reset',
  'image-pasted',
  'statistics-updated',
])

const containerRef = ref(null)
const canvasRef = ref(null)
const canvasWidth = ref(0)
const canvasHeight = ref(0)
const ctx = ref(null)
const pastedImage = ref(null)
const imagePasteEnabled = ref(props.pasteEnabled)

// Drawing state
const isDrawing = ref(false)
const startPoint = ref({ x: 0, y: 0 })
const currentPoint = ref({ x: 0, y: 0 })
const polygonPoints = ref([])
const freestylePath = ref([])
const drawnShapes = ref([])
const imageInfo = ref(null) // Stores image position and scale info
let shapeIdCounter = 0 // Counter for generating unique shape IDs

// Magnifier state
const magnifierRef = ref(null)
const magnifierCanvasRef = ref(null)
const magnifierCtx = ref(null)
const magnifierVisible = ref(false)

// Inspect mode state
const inspectRef = ref(null)
const inspectCanvasRef = ref(null)
const inspectCtx = ref(null)
const inspectVisible = ref(false)
const hoveredShapeId = ref(null)
const currentShapeStatistics = ref(null)
const inspectLocked = ref(false)
const lockedShapeId = ref(null)
const lockedPosition = ref({ x: 0, y: 0 })
const editableStatistics = ref(null)

let resizeTimeout = null

// Computed cursor style based on drawing mode
const drawingModeCursor = computed(() => {
  switch (props.drawingMode) {
    case 'delete':
      return 'not-allowed'
    case 'inspect':
      return 'pointer'
    case 'rectangle':
    case 'polygon':
    case 'freestyle':
    case 'freeform':
      return 'crosshair'
    case 'none':
    default:
      return 'default'
  }
})

const updateCanvasSize = () => {
  if (!containerRef.value) return

  const container = containerRef.value
  const rect = container.getBoundingClientRect()
  const newWidth = Math.floor(rect.width)
  const newHeight = Math.floor(rect.height)

  if (newWidth <= 0 || newHeight <= 0) return

  canvasWidth.value = newWidth
  canvasHeight.value = newHeight

  nextTick(() => {
    if (canvasRef.value) {
      const canvas = canvasRef.value

      canvas.width = newWidth
      canvas.height = newHeight

      const context = canvas.getContext('2d')
      ctx.value = context

      // Initialize magnifier canvas
      initializeMagnifierCanvas()

      // Initialize inspect canvas
      initializeInspectCanvas()

      // Redraw the image and shapes after canvas resize
      redrawCanvas()
    }
  })
}

const debouncedResize = () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  resizeTimeout = setTimeout(updateCanvasSize, 100)
}

const initializeMagnifierCanvas = () => {
  if (!magnifierCanvasRef.value) return

  const magnifierCanvas = magnifierCanvasRef.value
  magnifierCanvas.width = 200
  magnifierCanvas.height = 200
  magnifierCtx.value = magnifierCanvas.getContext('2d')
}

const initializeInspectCanvas = () => {
  if (!inspectCanvasRef.value) return

  const inspectCanvas = inspectCanvasRef.value
  inspectCanvas.width = 400
  inspectCanvas.height = 400
  inspectCtx.value = inspectCanvas.getContext('2d')
}

const updateMagnifier = (event) => {
  if (!props.magnifierEnabled || !magnifierCtx.value || !canvasRef.value) {
    magnifierVisible.value = false
    return
  }

  const canvas = canvasRef.value
  const rect = canvas.getBoundingClientRect()
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (event.clientX - rect.left) * scaleX
  const y = (event.clientY - rect.top) * scaleY

  magnifierVisible.value = true

  // Position magnifier
  if (magnifierRef.value) {
    magnifierRef.value.style.left = event.clientX + 20 + 'px'
    magnifierRef.value.style.top = event.clientY - 110 + 'px'

    // Adjust magnifier position if too close to edge
    if (event.clientX > window.innerWidth - 250) {
      magnifierRef.value.style.left = event.clientX - 220 + 'px'
    }
    if (event.clientY < 150) {
      magnifierRef.value.style.top = event.clientY + 20 + 'px'
    }
  }

  // Draw magnified view
  const magnification = 3
  const sourceSize = 200 / magnification

  magnifierCtx.value.clearRect(0, 0, 200, 200)
  magnifierCtx.value.drawImage(
    canvas,
    Math.max(0, x - sourceSize / 2),
    Math.max(0, y - sourceSize / 2),
    sourceSize,
    sourceSize,
    0,
    0,
    200,
    200,
  )

  // Draw crosshair
  magnifierCtx.value.strokeStyle = '#667eea'
  magnifierCtx.value.lineWidth = 1
  magnifierCtx.value.beginPath()
  magnifierCtx.value.moveTo(100, 0)
  magnifierCtx.value.lineTo(100, 200)
  magnifierCtx.value.moveTo(0, 100)
  magnifierCtx.value.lineTo(200, 100)
  magnifierCtx.value.stroke()
}

const getBoundingBox = (shape) => {
  if (shape.type === 'rectangle') {
    return shape.image
  } else if (shape.type === 'polygon' || shape.type === 'freestyle' || shape.type === 'freeform') {
    const points = shape.image
    if (!points || points.length === 0) return null

    const xs = points.map((p) => p.x)
    const ys = points.map((p) => p.y)

    return {
      x: Math.min(...xs),
      y: Math.min(...ys),
      width: Math.max(...xs) - Math.min(...xs),
      height: Math.max(...ys) - Math.min(...ys),
    }
  }
  return null
}

// Lock inspect popup on click
const lockInspectPopup = (shapeId, event) => {
  const shape = findShapeById(shapeId)
  if (!shape || !shape.displayStatistics) {
    return
  }

  inspectLocked.value = true
  lockedShapeId.value = shapeId

  // Create a deep copy of statistics for editing
  editableStatistics.value = JSON.parse(JSON.stringify(shape.displayStatistics))
  currentShapeStatistics.value = editableStatistics.value

  // Store position
  lockedPosition.value = {
    x: event.clientX + 20,
    y: event.clientY - 220,
  }

  // Adjust position if too close to edge
  if (event.clientX > window.innerWidth - 450) {
    lockedPosition.value.x = event.clientX - 420
  }
  if (event.clientY < 250) {
    lockedPosition.value.y = event.clientY + 20
  }

  // Set popup position
  if (inspectRef.value) {
    inspectRef.value.style.left = lockedPosition.value.x + 'px'
    inspectRef.value.style.top = lockedPosition.value.y + 'px'
  }

  inspectVisible.value = true
  hoveredShapeId.value = shapeId
}

// Cancel locked inspect popup
const cancelInspectLock = () => {
  inspectLocked.value = false
  lockedShapeId.value = null
  editableStatistics.value = null
  inspectVisible.value = false
  currentShapeStatistics.value = null
  hoveredShapeId.value = null
}

// Save statistics changes
const saveStatistics = () => {
  if (!lockedShapeId.value || !editableStatistics.value) {
    return
  }

  const shape = findShapeById(lockedShapeId.value)
  if (shape) {
    // Update shape's displayStatistics
    shape.displayStatistics = JSON.parse(JSON.stringify(editableStatistics.value))

    // Emit event
    emit('statistics-updated', {
      shapeId: lockedShapeId.value,
      statistics: shape.displayStatistics,
    })

    // Close the popup after saving
    cancelInspectLock()
  }
}

const updateInspect = (event) => {
  // If locked, don't update on hover
  if (inspectLocked.value) {
    return
  }

  if (
    props.drawingMode !== 'inspect' ||
    !inspectCtx.value ||
    !canvasRef.value ||
    !pastedImage.value ||
    !imageInfo.value
  ) {
    inspectVisible.value = false
    hoveredShapeId.value = null
    currentShapeStatistics.value = null
    return
  }

  const mousePos = getMousePos(event)
  const shapeId = findShapeAtPosition(mousePos)

  if (!shapeId) {
    inspectVisible.value = false
    hoveredShapeId.value = null
    currentShapeStatistics.value = null
    return
  }

  hoveredShapeId.value = shapeId
  const shape = findShapeById(shapeId)
  if (!shape) {
    inspectVisible.value = false
    currentShapeStatistics.value = null
    return
  }

  // Update statistics if the shape has displayStatistics
  if (shape.displayStatistics && Array.isArray(shape.displayStatistics)) {
    currentShapeStatistics.value = shape.displayStatistics
  } else {
    currentShapeStatistics.value = null
  }

  const bbox = getBoundingBox(shape)
  if (!bbox) {
    inspectVisible.value = false
    currentShapeStatistics.value = null
    return
  }

  inspectVisible.value = true

  // Position inspect popup
  if (inspectRef.value) {
    inspectRef.value.style.left = event.clientX + 20 + 'px'
    inspectRef.value.style.top = event.clientY - 220 + 'px'

    // Adjust position if too close to edge
    if (event.clientX > window.innerWidth - 450) {
      inspectRef.value.style.left = event.clientX - 420 + 'px'
    }
    if (event.clientY < 250) {
      inspectRef.value.style.top = event.clientY + 20 + 'px'
    }
  }

  // Draw the cropped image area with padding
  const padding = props.inspectPadding
  const cropX = Math.max(0, bbox.x - padding)
  const cropY = Math.max(0, bbox.y - padding)
  const cropWidth = Math.min(bbox.width + padding * 2, imageInfo.value.originalWidth - cropX)
  const cropHeight = Math.min(bbox.height + padding * 2, imageInfo.value.originalHeight - cropY)

  inspectCtx.value.clearRect(0, 0, 400, 400)

  // Calculate scale to fit in popup (max 400x400)
  const scale = Math.min(400 / cropWidth, 400 / cropHeight)
  const drawWidth = cropWidth * scale
  const drawHeight = cropHeight * scale
  const offsetX = (400 - drawWidth) / 2
  const offsetY = (400 - drawHeight) / 2

  // Draw the cropped image
  inspectCtx.value.drawImage(
    pastedImage.value,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight,
  )

  // Draw the shape outline
  inspectCtx.value.save()

  // Transform context to match the scaled crop area
  inspectCtx.value.translate(offsetX, offsetY)
  inspectCtx.value.scale(scale, scale)
  inspectCtx.value.translate(-cropX, -cropY)

  // Draw the shape
  if (shape.type === 'rectangle') {
    const rect = shape.image
    inspectCtx.value.strokeStyle = shape.style.strokeStyle || '#00ff00'
    inspectCtx.value.lineWidth = 3 / scale
    inspectCtx.value.strokeRect(rect.x, rect.y, rect.width, rect.height)
  } else if (shape.type === 'polygon' || shape.type === 'freestyle' || shape.type === 'freeform') {
    const points = shape.image
    if (points && points.length > 0) {
      inspectCtx.value.beginPath()
      inspectCtx.value.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        inspectCtx.value.lineTo(points[i].x, points[i].y)
      }
      if (shape.style.closePath) {
        inspectCtx.value.closePath()
      }
      inspectCtx.value.strokeStyle = shape.style.strokeStyle || '#00ff00'
      inspectCtx.value.lineWidth = 3 / scale
      inspectCtx.value.stroke()
    }
  }

  inspectCtx.value.restore()
}

const addImage = async (imageSrc, x = 0, y = 0, width = null, height = null, fitCanvas = true) => {
  if (!ctx.value) return

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      let drawWidth = width || img.naturalWidth
      let drawHeight = height || img.naturalHeight

      // Fit image to canvas while maintaining aspect ratio
      if (fitCanvas && (width === null || height === null)) {
        const canvasAspect = canvasWidth.value / canvasHeight.value
        const imageAspect = img.naturalWidth / img.naturalHeight

        if (imageAspect > canvasAspect) {
          // Image is wider relative to canvas
          drawWidth = canvasWidth.value
          drawHeight = canvasWidth.value / imageAspect
        } else {
          // Image is taller relative to canvas
          drawHeight = canvasHeight.value
          drawWidth = canvasHeight.value * imageAspect
        }

        // Center the image
        x = (canvasWidth.value - drawWidth) / 2
        y = (canvasHeight.value - drawHeight) / 2
      }

      ctx.value.drawImage(img, x, y, drawWidth, drawHeight)

      // Store image reference and info for redrawing
      pastedImage.value = img
      imageInfo.value = {
        canvasX: x,
        canvasY: y,
        canvasWidth: drawWidth,
        canvasHeight: drawHeight,
        originalWidth: img.naturalWidth,
        originalHeight: img.naturalHeight,
      }

      resolve({ width: drawWidth, height: drawHeight, x, y })
    }
    img.onerror = reject
    img.src = imageSrc
  })
}

const drawRectangle = (x, y, width, height, options = {}) => {
  if (!ctx.value) return

  const {
    fillStyle = null,
    strokeStyle = '#000000',
    lineWidth = 1,
    lineDash = [],
    displayStatistics = null,
  } = options

  // Image coordinate data (what was passed in)
  const imageData = { x, y, width, height }

  // Convert to canvas coordinates
  const topLeft = scaleToCanvasCoordinates(x, y)
  const bottomRight = scaleToCanvasCoordinates(x + width, y + height)

  const canvasRect = {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  }

  // Store shape using common function
  const shape = storeShape(
    'rectangle',
    canvasRect,
    imageData,
    {
      fillStyle,
      strokeStyle,
      lineWidth,
      lineDash,
    },
    displayStatistics,
  )

  // Redraw entire canvas to preserve image and show new shape
  redrawCanvas()

  return shape
}

const scaleToCanvasCoordinates = (imageX, imageY) => {
  if (!imageInfo.value) return { x: imageX, y: imageY }

  const {
    canvasX: imgX,
    canvasY: imgY,
    canvasWidth: imgW,
    canvasHeight: imgH,
    originalWidth,
    originalHeight,
  } = imageInfo.value

  // Scale from image coordinates to canvas coordinates
  const relativeX = imageX / originalWidth
  const relativeY = imageY / originalHeight

  return {
    x: imgX + relativeX * imgW,
    y: imgY + relativeY * imgH,
  }
}

const drawPolygon = (points, options = {}) => {
  if (!ctx.value || !points || points.length < 3) return

  const {
    fillStyle = null,
    strokeStyle = '#000000',
    lineWidth = 1,
    lineDash = [],
    closePath = true,
    displayStatistics = null,
  } = options

  // Convert image coordinates to canvas coordinates
  const canvasPoints = points.map((p) => scaleToCanvasCoordinates(p.x, p.y))

  // Store shape using common function (canvasPoints for rendering, points for image data)
  const shape = storeShape(
    'polygon',
    canvasPoints,
    points,
    {
      fillStyle,
      strokeStyle,
      lineWidth,
      lineDash,
      closePath,
    },
    displayStatistics,
  )
  // Redraw entire canvas to preserve image and show new shape
  redrawCanvas()

  return shape
}

const clearCanvasRect = () => {
  if (!ctx.value) return
  ctx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
}

const clearCanvas = () => {
  clearCanvasRect()

  // Clear all shapes from storage
  drawnShapes.value = []

  // Reset drawing state
  isDrawing.value = false
  polygonPoints.value = []
  freestylePath.value = []
  startPoint.value = { x: 0, y: 0 }
  currentPoint.value = { x: 0, y: 0 }
}

// Generate unique ID for shapes
const generateShapeId = () => {
  return `shape_${++shapeIdCounter}_${Date.now()}`
}

// Common function to store drawn shapes with IDs
const storeShape = (type, canvasData, imageData = null, style = {}, displayStatistics = null) => {
  const shape = {
    id: generateShapeId(),
    type,
    canvas: canvasData,
    image: imageData || canvasData,
    style,
    timestamp: Date.now(),
    index: drawnShapes.value.length + 1, // 1-based index
  }

  // Add displayStatistics if provided
  if (displayStatistics) {
    shape.displayStatistics = displayStatistics
  }

  drawnShapes.value.push(shape)
  emit('shape-created', shape)
  return shape
}

// Reindex all shapes to maintain sequential order
const reindexShapes = () => {
  drawnShapes.value.forEach((shape, idx) => {
    shape.index = idx + 1
  })
}

// Render a single shape on canvas
const renderShape = (shape) => {
  if (!ctx.value || !shape) return

  const { type, canvas: canvasData, style, index } = shape

  if (type === 'rectangle') {
    const { x, y, width, height } = canvasData
    const { fillStyle = null, strokeStyle = '#000000', lineWidth = 1, lineDash = [] } = style

    ctx.value.save()

    if (lineDash.length > 0) {
      ctx.value.setLineDash(lineDash)
    }

    if (fillStyle) {
      ctx.value.fillStyle = fillStyle
      ctx.value.fillRect(x, y, width, height)
    }

    if (strokeStyle) {
      ctx.value.strokeStyle = strokeStyle
      ctx.value.lineWidth = lineWidth
      ctx.value.strokeRect(x, y, width, height)
    }

    ctx.value.restore()

    // Draw index if showIndex is enabled (outside top-left corner)
    if (props.showIndex) {
      drawShapeIndex(x - 25, y - 5, index, strokeStyle)
    }
  } else if (type === 'polygon' || type === 'freestyle' || type === 'freeform') {
    const points = canvasData
    const {
      fillStyle = null,
      strokeStyle = type === 'polygon' ? '#00ff00' : '#0066ff',
      lineWidth = 2,
      lineDash = [],
      closePath = true,
    } = style

    if (!points || points.length < 2) return

    ctx.value.save()
    ctx.value.beginPath()

    if (lineDash.length > 0) {
      ctx.value.setLineDash(lineDash)
    }

    if ((type === 'freestyle' || type === 'freeform') && points.length > 2) {
      // Use smooth curves for freestyle shapes
      drawSmoothPath(ctx.value, points, closePath)
    } else {
      // Regular line drawing for polygons
      ctx.value.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.value.lineTo(points[i].x, points[i].y)
      }
    }

    if (closePath) {
      ctx.value.closePath()
    }

    if (fillStyle) {
      ctx.value.fillStyle = fillStyle
      ctx.value.fill()
    }

    if (strokeStyle) {
      ctx.value.strokeStyle = strokeStyle
      ctx.value.lineWidth = lineWidth
      ctx.value.stroke()
    }

    ctx.value.restore()

    // Draw index if showIndex is enabled (outside the first point)
    if (props.showIndex && points.length > 0) {
      drawShapeIndex(points[0].x - 25, points[0].y - 5, index, strokeStyle)
    }
  }
}

// Draw index number on shape
const drawShapeIndex = (x, y, index, color) => {
  ctx.value.save()
  ctx.value.font = 'bold 16px Arial'
  ctx.value.fillStyle = color || '#000000'
  ctx.value.strokeStyle = '#ffffff'
  ctx.value.lineWidth = 3
  ctx.value.strokeText(String(index), x, y)
  ctx.value.fillText(String(index), x, y)
  ctx.value.restore()
}

const pasteImage = async (x = 0, y = 0, width = null, height = null, fitCanvas = true) => {
  if (!imagePasteEnabled.value) return null

  try {
    const clipboardItems = await navigator.clipboard.read()

    for (const clipboardItem of clipboardItems) {
      for (const type of clipboardItem.types) {
        if (type.startsWith('image/')) {
          const blob = await clipboardItem.getType(type)
          const imageUrl = URL.createObjectURL(blob)

          const result = await addImage(imageUrl, x, y, width, height, fitCanvas)

          const img = new Image()
          img.src = imageUrl
          pastedImage.value = img

          // Store image info for coordinate scaling
          if (result && fitCanvas) {
            imageInfo.value = {
              canvasX: result.x,
              canvasY: result.y,
              canvasWidth: result.width,
              canvasHeight: result.height,
              originalWidth: img.naturalWidth,
              originalHeight: img.naturalHeight,
            }
          }

          // Clean up the blob URL
          URL.revokeObjectURL(imageUrl)

          // Emit image pasted event
          emit('image-pasted', {
            width: result.width,
            height: result.height,
            x: result.x,
            y: result.y,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
            image: img,
          })

          return result
        }
      }
    }
  } catch (error) {
    console.warn('Failed to paste image from clipboard:', error)
  }

  return null
}

const handlePaste = async (event) => {
  if (!imagePasteEnabled.value) return

  event.preventDefault()

  const clipboardData = event.clipboardData || event.originalEvent.clipboardData
  if (!clipboardData) return

  const items = clipboardData.items
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (item.type.startsWith('image/')) {
      const blob = item.getAsFile()
      if (blob) {
        const imageUrl = URL.createObjectURL(blob)

        const result = await addImage(imageUrl, 0, 0, null, null, true)

        const img = new Image()
        img.src = imageUrl
        pastedImage.value = img

        // Store image info for coordinate scaling
        if (result) {
          imageInfo.value = {
            canvasX: result.x,
            canvasY: result.y,
            canvasWidth: result.width,
            canvasHeight: result.height,
            originalWidth: img.naturalWidth,
            originalHeight: img.naturalHeight,
          }
        }

        // Clean up the blob URL
        URL.revokeObjectURL(imageUrl)

        // Emit image pasted event
        emit('image-pasted', {
          width: result.width,
          height: result.height,
          x: result.x,
          y: result.y,
          originalWidth: img.naturalWidth,
          originalHeight: img.naturalHeight,
          image: img,
        })

        return result
      }
    }
  }
}

const setImagePasteEnabled = (enabled) => {
  imagePasteEnabled.value = enabled
}

const getImage = () => pastedImage.value

const updateImage = async (
  imageElement,
  x = 0,
  y = 0,
  width = null,
  height = null,
  fitCanvas = true,
) => {
  if (!ctx.value || !imageElement) return

  return new Promise((resolve, reject) => {
    try {
      let drawWidth = width || imageElement.naturalWidth
      let drawHeight = height || imageElement.naturalHeight

      // Fit image to canvas while maintaining aspect ratio
      if (fitCanvas && (width === null || height === null)) {
        const canvasAspect = canvasWidth.value / canvasHeight.value
        const imageAspect = imageElement.naturalWidth / imageElement.naturalHeight

        if (imageAspect > canvasAspect) {
          // Image is wider relative to canvas
          drawWidth = canvasWidth.value
          drawHeight = canvasWidth.value / imageAspect
        } else {
          // Image is taller relative to canvas
          drawHeight = canvasHeight.value
          drawWidth = canvasHeight.value * imageAspect
        }

        // Center the image
        x = (canvasWidth.value - drawWidth) / 2
        y = (canvasHeight.value - drawHeight) / 2
      }

      // Clear canvas and redraw with new image
      clearCanvas()
      ctx.value.drawImage(imageElement, x, y, drawWidth, drawHeight)

      // Update stored image reference and info
      pastedImage.value = imageElement
      imageInfo.value = {
        canvasX: x,
        canvasY: y,
        canvasWidth: drawWidth,
        canvasHeight: drawHeight,
        originalWidth: imageElement.naturalWidth,
        originalHeight: imageElement.naturalHeight,
      }

      // Redraw all existing shapes on top of new image
      drawnShapes.value.forEach((shape) => {
        renderShape(shape)
      })

      resolve({ width: drawWidth, height: drawHeight, x, y })
    } catch (error) {
      reject(error)
    }
  })
}

// Mouse event handlers
const getMousePos = (event) => {
  const rect = canvasRef.value.getBoundingClientRect()

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  }
}

const scaleToImageCoordinates = (canvasX, canvasY) => {
  if (!imageInfo.value) return { x: canvasX, y: canvasY }

  const {
    canvasX: imgX,
    canvasY: imgY,
    canvasWidth: imgW,
    canvasHeight: imgH,
    originalWidth,
    originalHeight,
  } = imageInfo.value

  // Check if point is within image bounds
  if (canvasX < imgX || canvasX > imgX + imgW || canvasY < imgY || canvasY > imgY + imgH) {
    return null // Outside image
  }

  // Scale to image coordinates
  const relativeX = (canvasX - imgX) / imgW
  const relativeY = (canvasY - imgY) / imgH

  return {
    x: Math.round(relativeX * originalWidth),
    y: Math.round(relativeY * originalHeight),
  }
}

const handleMouseDown = (event) => {
  const mousePos = getMousePos(event)

  // Handle inspect mode - click to lock popup
  if (props.drawingMode === 'inspect') {
    const clickedShapeId = findShapeAtPosition(mousePos)
    if (clickedShapeId !== null) {
      lockInspectPopup(clickedShapeId, event)
    }
    return
  }

  // Handle delete mode - click to remove shapes
  if (props.drawingMode === 'delete') {
    const clickedShapeId = findShapeAtPosition(mousePos)
    if (clickedShapeId !== null) {
      removeShapeById(clickedShapeId)
    }
    return
  }

  // No interaction in 'none' mode
  if (props.drawingMode === 'none') {
    return
  }

  startPoint.value = mousePos
  currentPoint.value = mousePos

  if (props.drawingMode === 'rectangle') {
    isDrawing.value = true
  } else if (props.drawingMode === 'polygon') {
    polygonPoints.value.push(mousePos)
  } else if (props.drawingMode === 'freestyle' || props.drawingMode === 'freeform') {
    isDrawing.value = true
    freestylePath.value = [mousePos]
  }
}

const handleMouseMove = (event) => {
  // Update magnifier regardless of drawing mode
  updateMagnifier(event)

  // Update inspect popup in inspect mode
  if (props.drawingMode === 'inspect') {
    updateInspect(event)
    return
  }

  if (props.drawingMode === 'none' || props.drawingMode === 'delete') return

  const mousePos = getMousePos(event)
  currentPoint.value = mousePos

  if (props.drawingMode === 'rectangle' && isDrawing.value) {
    redrawCanvas()
    drawPreviewRectangle()
  } else if (props.drawingMode === 'polygon' && polygonPoints.value.length > 0) {
    redrawCanvas()
    drawPreviewPolygon()
  } else if (
    (props.drawingMode === 'freestyle' || props.drawingMode === 'freeform') &&
    isDrawing.value
  ) {
    // Add point to path if it's far enough from the last point
    const lastPoint = freestylePath.value[freestylePath.value.length - 1]
    const distance = Math.sqrt(
      Math.pow(mousePos.x - lastPoint.x, 2) + Math.pow(mousePos.y - lastPoint.y, 2),
    )

    // Use sensitivity prop to control point density
    const minDistance = props.freestyleSensitivity
    if (distance > minDistance) {
      freestylePath.value.push(mousePos)
    }

    redrawCanvas()
    drawFreestylePath()
  }
}

const handleMouseUp = () => {
  if (props.drawingMode === 'rectangle' && isDrawing.value) {
    isDrawing.value = false
    const shape = createRectangleShape()
    if (shape) {
      redrawCanvas()
    }
  } else if (
    (props.drawingMode === 'freestyle' || props.drawingMode === 'freeform') &&
    isDrawing.value
  ) {
    isDrawing.value = false
    const shape = createFreestyleShape()
    if (shape) {
      freestylePath.value = []
      redrawCanvas()
    } else {
      // Clear the incomplete path
      freestylePath.value = []
      redrawCanvas()
    }
  }
}

const handleMouseLeave = () => {
  magnifierVisible.value = false
  // Don't hide inspect popup if it's locked
  if (!inspectLocked.value) {
    inspectVisible.value = false
    hoveredShapeId.value = null
    currentShapeStatistics.value = null
  }
}

const handleDoubleClick = () => {
  if (props.drawingMode === 'polygon' && polygonPoints.value.length >= 2) {
    finishPolygon()
  }
}

const handleRightClick = (event) => {
  event.preventDefault() // Prevent context menu

  if (props.drawingMode === 'polygon' && polygonPoints.value.length >= 2) {
    finishPolygon()
  }
}

const finishPolygon = () => {
  const shape = createPolygonShape()
  if (shape) {
    polygonPoints.value = []
    redrawCanvas()
  }
}

const createRectangleShape = () => {
  const start = startPoint.value
  const end = currentPoint.value

  const canvasRect = {
    x: Math.min(start.x, end.x),
    y: Math.min(start.y, end.y),
    width: Math.abs(end.x - start.x),
    height: Math.abs(end.y - start.y),
  }

  // Scale to image coordinates
  const topLeft = scaleToImageCoordinates(canvasRect.x, canvasRect.y)
  const bottomRight = scaleToImageCoordinates(
    canvasRect.x + canvasRect.width,
    canvasRect.y + canvasRect.height,
  )

  if (!topLeft || !bottomRight) return null

  const imageData = {
    x: topLeft.x,
    y: topLeft.y,
    width: bottomRight.x - topLeft.x,
    height: bottomRight.y - topLeft.y,
  }

  // Use common storage function
  return storeShape('rectangle', canvasRect, imageData, {
    fillStyle: null,
    strokeStyle: '#ff0000',
    lineWidth: 2,
    lineDash: [],
  })
}

const createPolygonShape = () => {
  const canvasPoints = [...polygonPoints.value]
  const imagePoints = canvasPoints
    .map((p) => scaleToImageCoordinates(p.x, p.y))
    .filter((p) => p !== null)

  if (imagePoints.length < 2) return null

  // Use common storage function
  return storeShape('polygon', canvasPoints, imagePoints, {
    fillStyle: null,
    strokeStyle: '#00ff00',
    lineWidth: 2,
    lineDash: [],
    closePath: true,
  })
}

const createFreestyleShape = () => {
  if (freestylePath.value.length < 2) {
    console.log('Not enough points for freestyle shape:', freestylePath.value.length)
    return null
  }

  // Simplify the path to reduce number of points while maintaining smoothness
  const simplifiedPath = simplifyPath(freestylePath.value, props.simplificationTolerance)

  const imagePoints = simplifiedPath
    .map((p) => {
      const scaled = scaleToImageCoordinates(p.x, p.y)
      return scaled
    })
    .filter((p) => p !== null)

  if (imagePoints.length < 2) {
    console.log('Not enough image points after scaling:', imagePoints.length)
    return null
  }

  // Use common storage function with current drawing mode
  const shapeType = props.drawingMode === 'freeform' ? 'freeform' : 'freestyle'
  return storeShape(shapeType, simplifiedPath, imagePoints, {
    fillStyle: null,
    strokeStyle: '#0066ff',
    lineWidth: 2,
    lineDash: [],
    closePath: true,
  })
}

// Douglas-Peucker algorithm for path simplification
const simplifyPath = (points, tolerance) => {
  if (points.length <= 2) return points

  const sqTolerance = tolerance * tolerance

  const simplifyDP = (points, first, last, sqTolerance, simplified) => {
    let maxSqDist = sqTolerance
    let index = -1

    for (let i = first + 1; i < last; i++) {
      const sqDist = getSquareDistanceToSegment(points[i], points[first], points[last])

      if (sqDist > maxSqDist) {
        index = i
        maxSqDist = sqDist
      }
    }

    if (maxSqDist > sqTolerance) {
      if (index - first > 1) simplifyDP(points, first, index, sqTolerance, simplified)
      simplified.push(points[index])
      if (last - index > 1) simplifyDP(points, index, last, sqTolerance, simplified)
    }
  }

  const last = points.length - 1
  const simplified = [points[0]]
  simplifyDP(points, 0, last, sqTolerance, simplified)
  simplified.push(points[last])

  return simplified
}

const getSquareDistanceToSegment = (point, segStart, segEnd) => {
  const dx = segEnd.x - segStart.x
  const dy = segEnd.y - segStart.y

  let finalDx, finalDy

  if (dx !== 0 || dy !== 0) {
    const t = ((point.x - segStart.x) * dx + (point.y - segStart.y) * dy) / (dx * dx + dy * dy)

    if (t > 1) {
      finalDx = point.x - segEnd.x
      finalDy = point.y - segEnd.y
    } else if (t > 0) {
      finalDx = point.x - (segStart.x + dx * t)
      finalDy = point.y - (segStart.y + dy * t)
    } else {
      finalDx = point.x - segStart.x
      finalDy = point.y - segStart.y
    }
  } else {
    finalDx = point.x - segStart.x
    finalDy = point.y - segStart.y
  }

  return finalDx * finalDx + finalDy * finalDy
}

const drawPreviewRectangle = () => {
  const start = startPoint.value
  const end = currentPoint.value

  const x = Math.min(start.x, end.x)
  const y = Math.min(start.y, end.y)
  const width = Math.abs(end.x - start.x)
  const height = Math.abs(end.y - start.y)

  ctx.value.save()
  ctx.value.strokeStyle = '#ff0000'
  ctx.value.lineWidth = 2
  ctx.value.setLineDash([5, 5])
  ctx.value.strokeRect(x, y, width, height)
  ctx.value.restore()
}

const drawPreviewPolygon = () => {
  if (polygonPoints.value.length < 1) return

  ctx.value.save()
  ctx.value.strokeStyle = '#00ff00'
  ctx.value.lineWidth = 2
  ctx.value.setLineDash([5, 5])
  ctx.value.beginPath()

  ctx.value.moveTo(polygonPoints.value[0].x, polygonPoints.value[0].y)
  for (let i = 1; i < polygonPoints.value.length; i++) {
    ctx.value.lineTo(polygonPoints.value[i].x, polygonPoints.value[i].y)
  }

  // Draw line to current mouse position
  ctx.value.lineTo(currentPoint.value.x, currentPoint.value.y)
  ctx.value.stroke()

  // Draw points
  ctx.value.fillStyle = '#00ff00'
  polygonPoints.value.forEach((point) => {
    ctx.value.beginPath()
    ctx.value.arc(point.x, point.y, 3, 0, 2 * Math.PI)
    ctx.value.fill()
  })

  ctx.value.restore()
}

const drawFreestylePath = () => {
  if (freestylePath.value.length < 2) return

  ctx.value.save()
  ctx.value.strokeStyle = '#0066ff'
  ctx.value.lineWidth = 2
  ctx.value.setLineDash([3, 3])
  ctx.value.beginPath()

  // Use smooth curves for better appearance (not closed during preview)
  drawSmoothPath(ctx.value, freestylePath.value, false)

  // Close the path while drawing preview
  if (freestylePath.value.length > 2) {
    ctx.value.closePath()
  }

  ctx.value.stroke()
  ctx.value.restore()
}

// Draw smooth curved path using quadratic curves
const drawSmoothPath = (context, points, isClosed = true) => {
  if (points.length < 2) return

  context.moveTo(points[0].x, points[0].y)

  if (points.length === 2) {
    context.lineTo(points[1].x, points[1].y)
    return
  }

  // Create smooth curves between points
  for (let i = 1; i < points.length - 1; i++) {
    const current = points[i]
    const next = points[i + 1]

    // Calculate control point for smooth curve
    const controlX = (current.x + next.x) / 2
    const controlY = (current.y + next.y) / 2

    context.quadraticCurveTo(current.x, current.y, controlX, controlY)
  }

  // Draw to the last point
  const lastPoint = points[points.length - 1]
  context.lineTo(lastPoint.x, lastPoint.y)

  // If closed, add smooth curve back to start point
  if (isClosed && points.length > 2) {
    const firstPoint = points[0]
    // Create smooth transition back to start
    const controlX = (lastPoint.x + firstPoint.x) / 2
    const controlY = (lastPoint.y + firstPoint.y) / 2
    context.quadraticCurveTo(lastPoint.x, lastPoint.y, controlX, controlY)
  }
}

const redrawCanvas = () => {
  clearCanvasRect()

  // Redraw image if exists
  if (pastedImage.value && imageInfo.value) {
    const { canvasX, canvasY, canvasWidth, canvasHeight } = imageInfo.value
    ctx.value.drawImage(pastedImage.value, canvasX, canvasY, canvasWidth, canvasHeight)
  }

  // Redraw all shapes using renderShape function
  drawnShapes.value.forEach((shape) => {
    renderShape(shape)
  })
}

const getDrawnShapes = () => drawnShapes.value

const clearDrawnShapes = () => {
  drawnShapes.value = []
  redrawCanvas()
}

// Find shape at clicked position - returns shape ID instead of index
const findShapeAtPosition = (mousePos) => {
  for (let i = drawnShapes.value.length - 1; i >= 0; i--) {
    const shape = drawnShapes.value[i]

    if (shape.type === 'rectangle') {
      const rect = shape.canvas
      if (
        mousePos.x >= rect.x &&
        mousePos.x <= rect.x + rect.width &&
        mousePos.y >= rect.y &&
        mousePos.y <= rect.y + rect.height
      ) {
        return shape.id
      }
    } else if (
      shape.type === 'polygon' ||
      shape.type === 'freestyle' ||
      shape.type === 'freeform'
    ) {
      if (isPointInPolygon(mousePos, shape.canvas)) {
        return shape.id
      }
    }
  }
  return null
}

// Find shape by ID
const findShapeById = (id) => {
  return drawnShapes.value.find((shape) => shape.id === id)
}

// Check if point is inside polygon using ray casting algorithm
const isPointInPolygon = (point, polygon) => {
  let inside = false
  const x = point.x
  const y = point.y

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x
    const yi = polygon[i].y
    const xj = polygon[j].x
    const yj = polygon[j].y

    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) {
      inside = !inside
    }
  }
  return inside
}

// Remove shape by ID without full redraw
const removeShapeById = (id, shouldEmit = true) => {
  const shapeIndex = drawnShapes.value.findIndex((shape) => shape.id === id)
  if (shapeIndex >= 0) {
    const removedShape = drawnShapes.value.splice(shapeIndex, 1)[0]
    reindexShapes() // Reindex after removal
    redrawCanvas() // Still need to redraw all since canvas is not layered
    if (shouldEmit) {
      emit('shape-removed', removedShape)
    }
    return removedShape
  }
  return null
}

// Legacy function for backward compatibility - now uses ID-based removal
const removeShape = (indexOrId) => {
  if (typeof indexOrId === 'string') {
    return removeShapeById(indexOrId)
  } else {
    // Handle legacy index-based removal
    if (indexOrId >= 0 && indexOrId < drawnShapes.value.length) {
      const shape = drawnShapes.value[indexOrId]
      return removeShapeById(shape.id)
    }
  }
  return null
}

// Reset entire canvas (clear image and shapes)
const resetCanvas = () => {
  clearCanvas()
  drawnShapes.value = []
  pastedImage.value = null
  imageInfo.value = null
  emit('canvas-reset')
}

// Watch for prop changes
watch(
  () => props.pasteEnabled,
  (newValue) => {
    imagePasteEnabled.value = newValue
  },
)

watch(
  () => props.drawingMode,
  (newMode) => {
    if (newMode === 'none' || newMode === 'delete' || newMode === 'inspect') {
      // Reset drawing state when exiting drawing mode or entering delete/inspect mode
      isDrawing.value = false
      polygonPoints.value = []
      freestylePath.value = []
    }
    if (newMode !== 'inspect') {
      // Hide inspect popup when not in inspect mode
      inspectVisible.value = false
      hoveredShapeId.value = null
      currentShapeStatistics.value = null
      // Close locked popup when changing mode
      if (inspectLocked.value) {
        cancelInspectLock()
      }
    }
  },
)

const getContext = () => ctx.value

const getCanvas = () => canvasRef.value

const getCanvasSize = () => ({
  width: canvasWidth.value,
  height: canvasHeight.value,
})

// Functions for editing displayStatistics by cell ID
const updateDisplayStatistics = (cellId, statistics, emitEvent = true) => {
  const shape = findShapeById(cellId)
  if (!shape) {
    console.warn(`Shape with ID ${cellId} not found`)
    return null
  }

  // Update shape's displayStatistics
  shape.displayStatistics = Array.isArray(statistics) ? JSON.parse(JSON.stringify(statistics)) : []

  // Emit event if requested
  if (emitEvent) {
    emit('statistics-updated', {
      shapeId: cellId,
      statistics: shape.displayStatistics,
    })
  }

  return shape.displayStatistics
}

const updateDisplayStatistic = (cellId, statisticName, newValue, emitEvent = true) => {
  const shape = findShapeById(cellId)
  if (!shape) {
    console.warn(`Shape with ID ${cellId} not found`)
    return null
  }

  if (!shape.displayStatistics || !Array.isArray(shape.displayStatistics)) {
    console.warn(`Shape ${cellId} has no displayStatistics`)
    return null
  }

  const statIndex = shape.displayStatistics.findIndex((stat) => stat.name === statisticName)
  if (statIndex === -1) {
    console.warn(`Statistic ${statisticName} not found in shape ${cellId}`)
    return null
  }

  shape.displayStatistics[statIndex].value = newValue

  // Emit event if requested
  if (emitEvent) {
    emit('statistics-updated', {
      shapeId: cellId,
      statistics: shape.displayStatistics,
    })
  }

  return shape.displayStatistics[statIndex]
}

const addDisplayStatistic = (cellId, statistic, emitEvent = true) => {
  const shape = findShapeById(cellId)
  if (!shape) {
    console.warn(`Shape with ID ${cellId} not found`)
    return null
  }

  if (!shape.displayStatistics) {
    shape.displayStatistics = []
  }

  const newStat = {
    name: statistic.name || 'Unnamed',
    type: statistic.type || 'text',
    value: statistic.value || '',
    editable: statistic.editable !== false,
  }

  shape.displayStatistics.push(newStat)

  // Emit event if requested
  if (emitEvent) {
    emit('statistics-updated', {
      shapeId: cellId,
      statistics: shape.displayStatistics,
    })
  }

  return newStat
}

const removeDisplayStatistic = (cellId, statisticName, emitEvent = true) => {
  const shape = findShapeById(cellId)
  if (!shape) {
    console.warn(`Shape with ID ${cellId} not found`)
    return null
  }

  if (!shape.displayStatistics || !Array.isArray(shape.displayStatistics)) {
    console.warn(`Shape ${cellId} has no displayStatistics`)
    return null
  }

  const statIndex = shape.displayStatistics.findIndex((stat) => stat.name === statisticName)
  if (statIndex === -1) {
    console.warn(`Statistic ${statisticName} not found in shape ${cellId}`)
    return null
  }

  const removedStat = shape.displayStatistics.splice(statIndex, 1)[0]

  // Emit event if requested
  if (emitEvent) {
    emit('statistics-updated', {
      shapeId: cellId,
      statistics: shape.displayStatistics,
    })
  }

  return removedStat
}

const getDisplayStatistics = (cellId) => {
  const shape = findShapeById(cellId)
  if (!shape) {
    console.warn(`Shape with ID ${cellId} not found`)
    return null
  }

  return shape.displayStatistics || []
}

onMounted(() => {
  ensureStylesInjected()
  window.addEventListener('resize', debouncedResize)
  window.addEventListener('paste', handlePaste)
  updateCanvasSize()

  nextTick(() => {
    initializeMagnifierCanvas()
    initializeInspectCanvas()
  })
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedResize)
  window.removeEventListener('paste', handlePaste)
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
})

const setMagnifierEnabled = (enabled) => {
  if (!enabled) {
    magnifierVisible.value = false
  }
}

defineExpose({
  addImage,
  drawRectangle,
  drawPolygon,
  clearCanvas,
  resetCanvas,
  getContext,
  getCanvas,
  getCanvasSize,
  pasteImage,
  getImage,
  updateImage,
  setImagePasteEnabled,
  getDrawnShapes,
  clearDrawnShapes,
  removeShape,
  removeShapeById,
  findShapeAtPosition,
  findShapeById,
  renderShape,
  storeShape,
  setMagnifierEnabled,
  updateDisplayStatistics,
  updateDisplayStatistic,
  addDisplayStatistic,
  removeDisplayStatistic,
  getDisplayStatistics,
})
</script>

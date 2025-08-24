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
      @dblclick="handleDoubleClick"
      @contextmenu="handleRightClick"
    ></canvas>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, nextTick, watch } from 'vue'

const props = defineProps({
  pasteEnabled: {
    type: Boolean,
    default: true
  },
  drawingMode: {
    type: String,
    default: 'none', // 'none', 'rectangle', 'polygon', 'freestyle'
    validator: (value) => ['none', 'rectangle', 'polygon', 'freestyle'].includes(value)
  },
  freestyleSensitivity: {
    type: Number,
    default: 1, // Lower values = more points (smoother), higher values = fewer points (coarser)
    validator: (value) => value >= 0.1 && value <= 10
  },
  simplificationTolerance: {
    type: Number,
    default: 2, // Tolerance for path simplification algorithm
    validator: (value) => value >= 0.1 && value <= 20
  }
})

const emit = defineEmits(['shape-created'])

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

let resizeTimeout = null

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
      const dpr = window.devicePixelRatio || 1

      canvas.width = newWidth * dpr
      canvas.height = newHeight * dpr

      const context = canvas.getContext('2d')
      context.scale(dpr, dpr)
      ctx.value = context
    }
  })
}

const debouncedResize = () => {
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
  resizeTimeout = setTimeout(updateCanvasSize, 100)
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
    lineDash = []
  } = options

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
}

const drawPolygon = (points, options = {}) => {
  if (!ctx.value || !points || points.length < 3) return

  const {
    fillStyle = null,
    strokeStyle = '#000000',
    lineWidth = 1,
    lineDash = [],
    closePath = true
  } = options

  ctx.value.save()
  ctx.value.beginPath()

  if (lineDash.length > 0) {
    ctx.value.setLineDash(lineDash)
  }

  ctx.value.moveTo(points[0].x, points[0].y)

  for (let i = 1; i < points.length; i++) {
    ctx.value.lineTo(points[i].x, points[i].y)
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
}

const clearCanvas = () => {
  if (!ctx.value) return
  ctx.value.clearRect(0, 0, canvasWidth.value, canvasHeight.value)
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
              originalHeight: img.naturalHeight
            }
          }

          // Clean up the blob URL
          URL.revokeObjectURL(imageUrl)

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
            originalHeight: img.naturalHeight
          }
        }

        // Clean up the blob URL
        URL.revokeObjectURL(imageUrl)

        return result
      }
    }
  }
}

const setImagePasteEnabled = (enabled) => {
  imagePasteEnabled.value = enabled
}

const getPastedImage = () => pastedImage.value

// Mouse event handlers
const getMousePos = (event) => {
  const rect = canvasRef.value.getBoundingClientRect()
  const scaleX = canvasRef.value.width / rect.width
  const scaleY = canvasRef.value.height / rect.height

  return {
    x: (event.clientX - rect.left) * scaleX / (window.devicePixelRatio || 1),
    y: (event.clientY - rect.top) * scaleY / (window.devicePixelRatio || 1)
  }
}

const scaleToImageCoordinates = (canvasX, canvasY) => {
  if (!imageInfo.value) return { x: canvasX, y: canvasY }

  const { canvasX: imgX, canvasY: imgY, canvasWidth: imgW, canvasHeight: imgH, originalWidth, originalHeight } = imageInfo.value

  // Check if point is within image bounds
  if (canvasX < imgX || canvasX > imgX + imgW || canvasY < imgY || canvasY > imgY + imgH) {
    return null // Outside image
  }

  // Scale to image coordinates
  const relativeX = (canvasX - imgX) / imgW
  const relativeY = (canvasY - imgY) / imgH

  return {
    x: Math.round(relativeX * originalWidth),
    y: Math.round(relativeY * originalHeight)
  }
}

const handleMouseDown = (event) => {
  if (props.drawingMode === 'none') return

  const mousePos = getMousePos(event)
  startPoint.value = mousePos
  currentPoint.value = mousePos

  if (props.drawingMode === 'rectangle') {
    isDrawing.value = true
  } else if (props.drawingMode === 'polygon') {
    polygonPoints.value.push(mousePos)
  } else if (props.drawingMode === 'freestyle') {
    isDrawing.value = true
    freestylePath.value = [mousePos]
  }
}

const handleMouseMove = (event) => {
  if (props.drawingMode === 'none') return

  const mousePos = getMousePos(event)
  currentPoint.value = mousePos

  if (props.drawingMode === 'rectangle' && isDrawing.value) {
    redrawCanvas()
    drawPreviewRectangle()
  } else if (props.drawingMode === 'polygon' && polygonPoints.value.length > 0) {
    redrawCanvas()
    drawPreviewPolygon()
  } else if (props.drawingMode === 'freestyle' && isDrawing.value) {
    // Add point to path if it's far enough from the last point
    const lastPoint = freestylePath.value[freestylePath.value.length - 1]
    const distance = Math.sqrt(Math.pow(mousePos.x - lastPoint.x, 2) + Math.pow(mousePos.y - lastPoint.y, 2))
    
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
      drawnShapes.value.push(shape)
      emit('shape-created', shape)
      redrawCanvas()
    }
  } else if (props.drawingMode === 'freestyle' && isDrawing.value) {
    console.log('Freestyle mouse up, path length:', freestylePath.value.length)
    isDrawing.value = false
    const shape = createFreestyleShape()
    if (shape) {
      console.log('Shape created successfully')
      drawnShapes.value.push(shape)
      emit('shape-created', shape)
      freestylePath.value = []
      redrawCanvas()
    } else {
      console.log('Failed to create shape')
      // Clear the incomplete path
      freestylePath.value = []
      redrawCanvas()
    }
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
    drawnShapes.value.push(shape)
    emit('shape-created', shape)
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
    height: Math.abs(end.y - start.y)
  }

  // Scale to image coordinates
  const topLeft = scaleToImageCoordinates(canvasRect.x, canvasRect.y)
  const bottomRight = scaleToImageCoordinates(canvasRect.x + canvasRect.width, canvasRect.y + canvasRect.height)

  if (!topLeft || !bottomRight) return null

  return {
    type: 'rectangle',
    canvas: canvasRect,
    image: {
      x: topLeft.x,
      y: topLeft.y,
      width: bottomRight.x - topLeft.x,
      height: bottomRight.y - topLeft.y
    }
  }
}

const createPolygonShape = () => {
  const canvasPoints = [...polygonPoints.value]
  const imagePoints = canvasPoints.map(p => scaleToImageCoordinates(p.x, p.y)).filter(p => p !== null)

  if (imagePoints.length < 2) return null

  return {
    type: 'polygon',
    canvas: canvasPoints,
    image: imagePoints
  }
}

const createFreestyleShape = () => {
  if (freestylePath.value.length < 2) {
    console.log('Not enough points for freestyle shape:', freestylePath.value.length)
    return null
  }
  
  // Simplify the path to reduce number of points while maintaining smoothness
  const simplifiedPath = simplifyPath(freestylePath.value, props.simplificationTolerance)
  console.log('Original path points:', freestylePath.value.length, 'Simplified points:', simplifiedPath.length)
  
  const imagePoints = simplifiedPath.map(p => {
    const scaled = scaleToImageCoordinates(p.x, p.y)
    return scaled
  }).filter(p => p !== null)
  
  console.log('Image points after scaling:', imagePoints.length)
  
  if (imagePoints.length < 2) {
    console.log('Not enough image points after scaling:', imagePoints.length)
    return null
  }
  
  console.log('Creating freestyle shape with', imagePoints.length, 'points')
  
  return {
    type: 'freestyle',
    canvas: simplifiedPath,
    image: imagePoints
  }
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
  polygonPoints.value.forEach(point => {
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
  clearCanvas()

  // Redraw image if exists
  if (pastedImage.value && imageInfo.value) {
    const { canvasX, canvasY, canvasWidth, canvasHeight } = imageInfo.value
    ctx.value.drawImage(pastedImage.value, canvasX, canvasY, canvasWidth, canvasHeight)
  }

  // Redraw all shapes
  drawnShapes.value.forEach(shape => {
    if (shape.type === 'rectangle') {
      const rect = shape.canvas
      ctx.value.save()
      ctx.value.strokeStyle = '#ff0000'
      ctx.value.lineWidth = 2
      ctx.value.strokeRect(rect.x, rect.y, rect.width, rect.height)
      ctx.value.restore()
    } else if (shape.type === 'polygon') {
      const points = shape.canvas
      if (points.length < 2) return

      ctx.value.save()
      ctx.value.strokeStyle = '#00ff00'
      ctx.value.lineWidth = 2
      ctx.value.beginPath()
      ctx.value.moveTo(points[0].x, points[0].y)
      for (let i = 1; i < points.length; i++) {
        ctx.value.lineTo(points[i].x, points[i].y)
      }
      ctx.value.closePath()
      ctx.value.stroke()
      ctx.value.restore()
    } else if (shape.type === 'freestyle') {
      const points = shape.canvas
      if (points.length < 2) return

      ctx.value.save()
      ctx.value.strokeStyle = '#0066ff'
      ctx.value.lineWidth = 2
      ctx.value.beginPath()
      
      // Use smooth curves for final shape too (closed shape)
      drawSmoothPath(ctx.value, points, true)
      ctx.value.closePath()
      ctx.value.stroke()
      ctx.value.restore()
    }
  })
}

const getDrawnShapes = () => drawnShapes.value

const clearDrawnShapes = () => {
  drawnShapes.value = []
  redrawCanvas()
}

// Watch for prop changes
watch(() => props.pasteEnabled, (newValue) => {
  imagePasteEnabled.value = newValue
})

watch(() => props.drawingMode, (newMode) => {
  if (newMode === 'none') {
    // Reset drawing state when exiting drawing mode
    isDrawing.value = false
    polygonPoints.value = []
    freestylePath.value = []
  }
})

const getContext = () => ctx.value

const getCanvas = () => canvasRef.value

const getCanvasSize = () => ({
  width: canvasWidth.value,
  height: canvasHeight.value
})

onMounted(() => {
  window.addEventListener('resize', debouncedResize)
  window.addEventListener('paste', handlePaste)
  updateCanvasSize()
})

onUnmounted(() => {
  window.removeEventListener('resize', debouncedResize)
  window.removeEventListener('paste', handlePaste)
  if (resizeTimeout) {
    clearTimeout(resizeTimeout)
  }
})

defineExpose({
  addImage,
  drawRectangle,
  drawPolygon,
  clearCanvas,
  getContext,
  getCanvas,
  getCanvasSize,
  pasteImage,
  getPastedImage,
  setImagePasteEnabled,
  getDrawnShapes,
  clearDrawnShapes
})
</script>

<style scoped>
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
</style>

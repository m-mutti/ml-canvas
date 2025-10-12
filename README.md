# ML Canvas

A Vue.js canvas component designed specifically for machine learning annotation tasks and AI tool development. This component provides an intuitive interface for drawing shapes, managing images, and collecting labeled data for ML workflows.

## Features

### 🎯 **ML-Ready Annotation Tools**
- **Multiple Drawing Modes**: Rectangle, Polygon, and Freeform drawing for various annotation types
- **Dual Coordinate Systems**: Canvas coordinates for display, image coordinates for ML model training
- **Shape Export**: JSON export functionality for training datasets
- **Event-Driven Architecture**: Real-time shape creation events for custom ML workflows

### 🖼️ **Image Management**
- **Clipboard Support**: Paste images directly from clipboard (Ctrl+V)
- **Auto-fitting**: Images automatically scale to fit canvas while maintaining aspect ratio
- **Coordinate Scaling**: Automatic coordinate transformation between canvas and original image dimensions

### ✏️ **Drawing Capabilities**
- **Rectangle Tool**: Perfect for object detection bounding boxes
- **Polygon Tool**: Ideal for image segmentation masks
- **Freeform Tool**: Great for freehand annotations with path simplification
- **Real-time Preview**: Live preview while drawing with visual feedback

### 🔧 **Developer Features**
- **Shape Management**: Unique IDs for every shape, ID-based removal and querying
- **Shape Events**: Get notified when shapes are created/removed with `@shape-created` and `@shape-removed`
- **Programmatic Control**: Add shapes, clear canvas, manage drawing modes via comprehensive API
- **Interactive Removal**: Click on any shape to remove it when in "No Drawing" mode
- **Reset Functionality**: Complete canvas reset that clears both image and all shapes
- **Customizable**: Adjustable sensitivity, simplification tolerance, and styling
- **TypeScript Ready**: Full type support for better development experience

## 🚀 Demo

### Try it Live
Experience all features of ML Canvas in action:
**[https://ml-canvas.vercel.app/](https://ml-canvas.vercel.app/)**

The demo includes:
- Complete annotation interface with Rectangle, Polygon, Freeform, and Delete modes
- Image clipboard paste functionality (Ctrl+V)
- Real-time shape creation and removal
- Export functionality for ML datasets
- Interactive shape management with unique IDs

### Run Locally
Clone and run the demo on your machine:

```bash
git clone https://github.com/m-mutti/ml-canvas.git
cd ml-canvas
npm install
npm run dev
```

Then open [http://localhost:5173](http://localhost:5173) to see the demo app.

## Installation

```bash
npm install ml-canvas
```

## Quick Start

```vue
<template>
  <MLCanvas 
    ref="canvasRef"
    :drawingMode="drawingMode"
    @shape-created="handleNewAnnotation"
    @image-pasted="handleImagePasted"
  />
</template>

<script setup>
import MLCanvas from './components/MLCanvas.vue'
import { ref } from 'vue'

const canvasRef = ref(null)
const drawingMode = ref('rectangle')

const handleNewAnnotation = (shape) => {
  // Shape contains ID, coordinates, style, and timestamp
  console.log('New annotation:', shape)
  console.log('Shape ID:', shape.id) // Unique identifier
  
  // Send to your ML training pipeline
  sendToMLPipeline(shape.image) // Use image coordinates for training
}

const handleShapeRemoval = (shape) => {
  console.log('Shape removed:', shape.id)
  // Update your ML dataset
  removeFromMLPipeline(shape.id)
}

// Handle image paste events
const handleImagePasted = (imageData) => {
  console.log('Image pasted:', imageData)
  console.log('Canvas dimensions:', imageData.width, imageData.height)
  console.log('Original dimensions:', imageData.originalWidth, imageData.originalHeight)
  console.log('Image object:', imageData.image)
}

// Programmatically add images
const loadImage = async () => {
  await canvasRef.value.addImage('/path/to/image.jpg')
}
</script>
```

## Drawing Modes

### Mode Overview
```javascript
// Available drawing modes
const modes = ['none', 'rectangle', 'polygon', 'freeform', 'delete', 'inspect']

// Set drawing mode
drawingMode.value = 'delete' // Click to remove shapes
drawingMode.value = 'rectangle' // Draw rectangles
drawingMode.value = 'inspect' // Inspect mode with magnified view
drawingMode.value = 'none' // No interaction
```

### Rectangle Mode
Perfect for object detection tasks:
```javascript
// Output format
{
  id: 'shape_1_1672531200000',          // Unique identifier
  type: 'rectangle',
  canvas: { x, y, width, height },     // Display coordinates
  image: { x, y, width, height },      // Original image coordinates
  style: { strokeStyle, lineWidth, ... }, // Applied styling
  timestamp: 1672531200000             // Creation time
}
```

### Polygon Mode
Ideal for semantic segmentation:
```javascript
// Output format
{
  id: 'shape_2_1672531205000',          // Unique identifier
  type: 'polygon',
  canvas: [{ x, y }, ...],             // Display coordinates
  image: [{ x, y }, ...],              // Original image coordinates
  style: { strokeStyle, lineWidth, ... }, // Applied styling
  timestamp: 1672531205000             // Creation time
}
```

### Freeform Mode
Great for custom annotations:
```javascript
// Output format
{
  id: 'shape_3_1672531210000',          // Unique identifier
  type: 'freeform',
  canvas: [{ x, y }, ...],             // Simplified path points
  image: [{ x, y }, ...],              // Original image coordinates
  style: { strokeStyle, lineWidth, ... }, // Applied styling
  timestamp: 1672531210000             // Creation time
}
```

### Delete Mode
Interactive shape removal:
```javascript
// Set to delete mode
drawingMode.value = 'delete'

// Visual feedback:
// - Cursor changes to 'not-allowed'
// - Red button styling when active
// - Click any shape to remove it instantly

// No output - shapes are removed from the drawnShapes array
// Triggers 'shape-removed' event with the deleted shape data
```

### Inspect Mode
Magnified view for detailed inspection:
```javascript
// Set to inspect mode
drawingMode.value = 'inspect'

// Features:
// - Hover over the canvas to see a magnified popup view
// - Shows the area around the cursor with zoom
// - Displays all shapes in the zoomed region
// - Useful for precise inspection of annotations
// - Popup follows mouse cursor with smart positioning

// Customize padding around inspected area (in image pixels)
inspectPadding.value = 20 // Default is 20 pixels
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `drawingMode` | String | `'none'` | Drawing mode: `'none'`, `'rectangle'`, `'polygon'`, `'freeform'`, `'delete'`, `'inspect'` |
| `pasteEnabled` | Boolean | `true` | Enable/disable image pasting from clipboard |
| `freestyleSensitivity` | Number | `1` | Point density for freeform drawing (0.1-10) |
| `simplificationTolerance` | Number | `2` | Path simplification tolerance (0.1-20) |
| `inspectPadding` | Number | `20` | Padding around shape in inspect mode (in image pixels) |
| `showIndex` | Boolean | `false` | Show 1-based index number on each shape |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `shape-created` | `shape` | Emitted when a new shape is completed |
| `shape-removed` | `shape` | Emitted when a shape is removed |
| `canvas-reset` | `void` | Emitted when canvas is completely reset |
| `image-pasted` | `imageData` | Emitted when an image is pasted from clipboard |
| `statistics-updated` | `{ shapeId, statistics }` | Emitted when statistics are saved in inspect mode |

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `addImage(src, x, y, width, height, fitCanvas)` | Image source and positioning | Add image to canvas |
| `pasteImage()` | None | Paste image from clipboard |
| `getImage()` | None | Get the current pasted image reference |
| `updateImage(imageElement, x, y, width, height, fitCanvas)` | HTMLImageElement and positioning | Update canvas with new image while preserving shapes |
| `clearCanvas()` | None | Clear entire canvas (leaves shapes) |
| `resetCanvas()` | None | Reset everything (image + shapes) |
| `getDrawnShapes()` | None | Get all drawn shapes with IDs |
| `clearDrawnShapes()` | None | Clear only drawn shapes |
| `drawRectangle(x, y, w, h, options)` | Coordinates, styling, and displayStatistics | Draw rectangle programmatically |
| `drawPolygon(points, options)` | Points array, styling, and displayStatistics | Draw polygon programmatically |
| `removeShape(idOrIndex)` | Shape ID or index | Remove shape by ID or index |
| `removeShapeById(id)` | Shape ID | Remove shape by ID |
| `findShapeById(id)` | Shape ID | Find shape by ID |
| `findShapeAtPosition(point)` | Mouse coordinates | Find shape ID at position |
| `renderShape(shape)` | Shape object | Render individual shape |
| `storeShape(type, canvas, image, style)` | Shape data | Common storage function |
| `updateDisplayStatistics(cellId, statistics, emitEvent?)` | Shape ID, statistics array, emit event (default: true) | Replace all displayStatistics for a shape |
| `updateDisplayStatistic(cellId, statisticName, newValue, emitEvent?)` | Shape ID, statistic name, new value, emit event (default: true) | Update a single statistic value |
| `addDisplayStatistic(cellId, statistic, emitEvent?)` | Shape ID, statistic object, emit event (default: true) | Add a new statistic to a shape |
| `removeDisplayStatistic(cellId, statisticName, emitEvent?)` | Shape ID, statistic name, emit event (default: true) | Remove a statistic from a shape |
| `getDisplayStatistics(cellId)` | Shape ID | Get all displayStatistics for a shape |

## Interactive Features

### Shape Removal
```javascript
// Click to remove: Set drawing mode to 'delete' and click any shape
drawingMode.value = 'delete'
// Now clicking on shapes will remove them (cursor shows 'not-allowed')

// Programmatic removal by ID
const shapeId = 'shape_1_1672531200000'
canvasRef.value.removeShapeById(shapeId)

// Find and remove shape at specific position
const mousePos = { x: 100, y: 50 }
const shapeId = canvasRef.value.findShapeAtPosition(mousePos)
if (shapeId) {
  canvasRef.value.removeShapeById(shapeId)
}
```

### Image Management
```javascript
// Handle image paste events
const handleImagePasted = (imageData) => {
  console.log('Canvas size:', imageData.width, imageData.height)     // Displayed size
  console.log('Original size:', imageData.originalWidth, imageData.originalHeight) // Actual image dimensions
  console.log('Position:', imageData.x, imageData.y)                 // Canvas position
  console.log('Image object:', imageData.image)                      // HTMLImageElement with original dimensions
  
  // Use original dimensions for ML training
  trainModel(imageData.originalWidth, imageData.originalHeight)
}

// Get current image reference
const currentImage = canvasRef.value.getImage()
if (currentImage) {
  console.log('Current image dimensions:', currentImage.naturalWidth, currentImage.naturalHeight)
}

// Update image while preserving all shapes
const updateCanvasImage = async (newImageSrc) => {
  const img = new Image()
  img.onload = async () => {
    try {
      const result = await canvasRef.value.updateImage(img)
      console.log('Image updated:', result)
      // All existing shapes remain intact
    } catch (error) {
      console.error('Failed to update image:', error)
    }
  }
  img.src = newImageSrc
}

// Update with custom positioning (no auto-fit)
const updateWithCustomPosition = async (imageElement) => {
  await canvasRef.value.updateImage(imageElement, 50, 100, 200, 150, false)
}
```

### Complete Reset
```javascript
// Reset everything - image and all shapes
canvasRef.value.resetCanvas()

// Clear only the canvas background (keeps shapes)
canvasRef.value.clearCanvas()

// Clear only drawn shapes (keeps image)
canvasRef.value.clearDrawnShapes()
```

### Shape Management
```javascript
// Get all shapes with their IDs
const shapes = canvasRef.value.getDrawnShapes()
shapes.forEach(shape => {
  console.log(`Shape ${shape.id}: ${shape.type}`)
})

// Find specific shape
const shape = canvasRef.value.findShapeById('shape_1_1672531200000')
if (shape) {
  console.log('Found shape:', shape.type)
}
```

### Shape Indexing
```javascript
// Enable index display on all shapes
<MLCanvas :showIndex="true" />

// Each shape gets a 1-based index in creation order
// When shapes are deleted, subsequent shapes automatically take lower indices
// Index is displayed outside the shape to avoid obstructing the view

// Access shape index programmatically
const shapes = canvasRef.value.getDrawnShapes()
shapes.forEach(shape => {
  console.log(`Shape ${shape.index}: ${shape.type}`) // 1, 2, 3...
})
```

### Display Statistics (Inspect Mode)
```javascript
// Add statistics to shapes for display in inspect mode
canvasRef.value.drawRectangle(100, 50, 200, 150, {
  strokeStyle: '#ff0000',
  displayStatistics: [
    { name: 'ID', type: 'string', value: '12345', editable: false },  // Read-only
    { name: 'Class', type: 'string', value: 'Person' },                // Editable (default)
    { name: 'Confidence', type: 'number', value: 0.95 },               // Editable (default)
    { name: 'Area', type: 'number', value: 30000, editable: true }     // Explicitly editable
  ]
})

canvasRef.value.drawPolygon(points, {
  strokeStyle: '#00ff00',
  displayStatistics: [
    { name: 'Label', type: 'string', value: 'Road' },
    { name: 'Score', type: 'number', value: 0.87 }
  ]
})

// Interactive editing in inspect mode:
// 1. Hover over shapes to see their statistics
// 2. Click a shape to lock the popup and make statistics editable
// 3. Edit values (respects 'editable' property - default is true)
// 4. Click 'Save' to apply changes and emit 'statistics-updated' event
// 5. Click 'Cancel' to discard changes and close popup

drawingMode.value = 'inspect'

// Listen for statistics updates (only fires when Save is clicked)
<MLCanvas @statistics-updated="handleStatisticsUpdate" />

const handleStatisticsUpdate = ({ shapeId, statistics }) => {
  console.log(`Statistics updated for shape ${shapeId}:`, statistics)
  // Update your ML model or database
}

// Statistic properties:
// - name: Display name for the statistic
// - type: 'string' or 'number' (determines input type)
// - value: Current value
// - editable: Boolean (default: true). Set to false for read-only fields
```

### Programmatic Statistics Management
```javascript
// Get the shape ID from created shapes
const shape = canvasRef.value.drawRectangle(100, 50, 200, 150, {
  displayStatistics: [
    { name: 'Class', type: 'string', value: 'Person' },
    { name: 'Confidence', type: 'number', value: 0.95 }
  ]
})

const shapeId = shape.id

// Get all statistics for a shape
const stats = canvasRef.value.getDisplayStatistics(shapeId)
console.log('Current statistics:', stats)

// Update a single statistic value
canvasRef.value.updateDisplayStatistic(shapeId, 'Confidence', 0.98)

// Add a new statistic to the shape
canvasRef.value.addDisplayStatistic(shapeId, {
  name: 'Area',
  type: 'number',
  value: 30000,
  editable: false  // Optional, defaults to true
})

// Remove a statistic from the shape
canvasRef.value.removeDisplayStatistic(shapeId, 'Area')

// Replace all statistics for a shape
canvasRef.value.updateDisplayStatistics(shapeId, [
  { name: 'Label', type: 'string', value: 'Vehicle' },
  { name: 'Score', type: 'number', value: 0.88 },
  { name: 'Bbox', type: 'string', value: '[100, 50, 200, 150]', editable: false }
])

// All methods emit 'statistics-updated' event by default when changes are made
<MLCanvas @statistics-updated="handleStatisticsUpdate" />

const handleStatisticsUpdate = ({ shapeId, statistics }) => {
  console.log(`Statistics updated for ${shapeId}:`, statistics)
  // Sync with your backend or ML pipeline
  syncToDatabase(shapeId, statistics)
}

// Suppress event emission with optional parameter (useful for batch updates)
canvasRef.value.updateDisplayStatistic(shapeId, 'Confidence', 0.92, false) // No event
canvasRef.value.updateDisplayStatistic(shapeId, 'Area', 28000, false)      // No event
canvasRef.value.addDisplayStatistic(shapeId, {
  name: 'Updated',
  type: 'string',
  value: new Date().toISOString()
}, true) // Emit event only after all updates are done
```

## ML Use Cases

### Object Detection
```javascript
// Use rectangle mode to create bounding boxes
const annotations = shapes
  .filter(s => s.type === 'rectangle')
  .map(s => ({
    id: s.id,                    // Unique identifier for tracking
    class: 'person',
    bbox: [s.image.x, s.image.y, s.image.width, s.image.height],
    timestamp: s.timestamp       // Creation time
  }))
```

### Image Segmentation
```javascript
// Use polygon mode for segmentation masks
const masks = shapes
  .filter(s => s.type === 'polygon')
  .map(s => ({
    id: s.id,                    // Unique identifier for tracking
    class: 'road',
    points: s.image.map(p => [p.x, p.y]),
    timestamp: s.timestamp       // Creation time
  }))
```

### Custom Annotations
```javascript
// Use freeform mode for specialized tasks
const customAnnotations = shapes
  .filter(s => s.type === 'freeform')
  .map(s => ({
    id: s.id,                    // Unique identifier for tracking
    type: 'gesture',
    path: s.image,
    timestamp: s.timestamp       // Creation time
  }))
```

### Annotation Management
```javascript
// Track annotation changes for ML pipeline updates
const handleShapeCreated = (shape) => {
  // Add to ML dataset
  MLDataset.add(shape.id, {
    type: shape.type,
    coordinates: shape.image,
    timestamp: shape.timestamp
  })
}

const handleShapeRemoved = (shape) => {
  // Remove from ML dataset
  MLDataset.remove(shape.id)
}

// Batch operations with IDs
const batchRemove = (shapeIds) => {
  shapeIds.forEach(id => {
    canvasRef.value.removeShapeById(id)
  })
}
```

## Export Formats

The component supports exporting annotations in JSON format compatible with popular ML frameworks:

```json
{
  "annotations": [
    {
      "id": "shape_1_1672531200000",
      "type": "rectangle",
      "class": "person",
      "coordinates": { "x": 100, "y": 50, "width": 200, "height": 300 },
      "timestamp": 1672531200000
    },
    {
      "id": "shape_2_1672531205000",
      "type": "polygon", 
      "class": "car",
      "points": [[x1, y1], [x2, y2], [x3, y3]],
      "timestamp": 1672531205000
    },
    {
      "id": "shape_3_1672531210000",
      "type": "freeform", 
      "class": "gesture",
      "path": [[x1, y1], [x2, y2], [x3, y3]],
      "timestamp": 1672531210000
    }
  ]
}
```

## Development

The component is built with Vue 3 and provides a clean, extensible architecture for ML annotation tools. Key features include:

- **Separation of Concerns**: Canvas operations, coordinate systems, and ML data formats are cleanly separated
- **Event-Driven**: Real-time updates through Vue's reactive system with shape lifecycle events
- **Performance Optimized**: Efficient drawing with path simplification, debounced operations, and centralized rendering
- **Shape Management**: Unique IDs, centralized storage, and flexible removal system
- **Interactive Interface**: Click-to-remove functionality and comprehensive reset options
- **Extensible**: Easy to add new drawing modes, export formats, and shape management features

## Project Setup

```bash
npm install
```

### Compile and Hot-Reload for Development

```bash
npm run dev
```

### Compile and Minify for Production

```bash
npm run build
```

### Run Unit Tests with [Vitest](https://vitest.dev/)

```bash
npm run test:unit
```

### Lint with [ESLint](https://eslint.org/)

```bash
npm run lint
```

## Contributing

We welcome contributions! This component is designed to be the foundation for ML annotation tools. 

See [CONTRIBUTING.md](./CONTRIBUTING.md) for detailed guidelines on:
- Adding new drawing modes and export formats
- ML framework integrations
- Performance optimizations
- Development setup and testing

## License

MIT License - see LICENSE file for details.

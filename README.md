# ML Canvas

A Vue.js canvas component designed specifically for machine learning annotation tasks and AI tool development. This component provides an intuitive interface for drawing shapes, managing images, and collecting labeled data for ML workflows.

## Features

### 🎯 **ML-Ready Annotation Tools**
- **Multiple Drawing Modes**: Rectangle, Polygon, and Freestyle drawing for various annotation types
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
- **Freestyle Tool**: Great for freehand annotations with path simplification
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
- Complete annotation interface with Rectangle, Polygon, Freestyle, and Delete modes
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
const modes = ['none', 'rectangle', 'polygon', 'freestyle', 'delete']

// Set drawing mode
drawingMode.value = 'delete' // Click to remove shapes
drawingMode.value = 'rectangle' // Draw rectangles
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

### Freestyle Mode
Great for custom annotations:
```javascript
// Output format
{
  id: 'shape_3_1672531210000',          // Unique identifier
  type: 'freestyle',
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

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `drawingMode` | String | `'none'` | Drawing mode: `'none'`, `'rectangle'`, `'polygon'`, `'freestyle'`, `'delete'` |
| `pasteEnabled` | Boolean | `true` | Enable/disable image pasting from clipboard |
| `freestyleSensitivity` | Number | `1` | Point density for freestyle drawing (0.1-10) |
| `simplificationTolerance` | Number | `2` | Path simplification tolerance (0.1-20) |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `shape-created` | `shape` | Emitted when a new shape is completed |
| `shape-removed` | `shape` | Emitted when a shape is removed |
| `canvas-reset` | `void` | Emitted when canvas is completely reset |

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `addImage(src, x, y, width, height, fitCanvas)` | Image source and positioning | Add image to canvas |
| `pasteImage()` | None | Paste image from clipboard |
| `clearCanvas()` | None | Clear entire canvas (leaves shapes) |
| `resetCanvas()` | None | **NEW** Reset everything (image + shapes) |
| `getDrawnShapes()` | None | Get all drawn shapes with IDs |
| `clearDrawnShapes()` | None | Clear only drawn shapes |
| `drawRectangle(x, y, w, h, options)` | Coordinates and styling | Draw rectangle programmatically |
| `drawPolygon(points, options)` | Points array and styling | Draw polygon programmatically |
| `removeShape(idOrIndex)` | Shape ID or index | Remove shape by ID or index |
| `removeShapeById(id)` | Shape ID | **NEW** Remove shape by ID |
| `findShapeById(id)` | Shape ID | **NEW** Find shape by ID |
| `findShapeAtPosition(point)` | Mouse coordinates | **NEW** Find shape ID at position |
| `renderShape(shape)` | Shape object | **NEW** Render individual shape |
| `storeShape(type, canvas, image, style)` | Shape data | **NEW** Common storage function |

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
// Use freestyle mode for specialized tasks
const customAnnotations = shapes
  .filter(s => s.type === 'freestyle')
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

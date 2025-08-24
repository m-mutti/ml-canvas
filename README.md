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
- **Shape Events**: Get notified when shapes are created with `@shape-created`
- **Programmatic Control**: Add shapes, clear canvas, manage drawing modes via API
- **Customizable**: Adjustable sensitivity, simplification tolerance, and styling
- **TypeScript Ready**: Full type support for better development experience

## Installation

```bash
npm install
npm run dev
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
  // Shape contains both canvas and image coordinates
  console.log('New annotation:', shape)
  
  // Send to your ML training pipeline
  sendToMLPipeline(shape.image) // Use image coordinates for training
}

// Programmatically add images
const loadImage = async () => {
  await canvasRef.value.addImage('/path/to/image.jpg')
}
</script>
```

## Drawing Modes

### Rectangle Mode
Perfect for object detection tasks:
```javascript
// Output format
{
  type: 'rectangle',
  canvas: { x, y, width, height },     // Display coordinates
  image: { x, y, width, height }       // Original image coordinates
}
```

### Polygon Mode
Ideal for semantic segmentation:
```javascript
// Output format
{
  type: 'polygon',
  canvas: [{ x, y }, ...],             // Display coordinates
  image: [{ x, y }, ...]               // Original image coordinates
}
```

### Freestyle Mode
Great for custom annotations:
```javascript
// Output format
{
  type: 'freestyle',
  canvas: [{ x, y }, ...],             // Simplified path points
  image: [{ x, y }, ...]               // Original image coordinates
}
```

## API Reference

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `drawingMode` | String | `'none'` | Drawing mode: `'none'`, `'rectangle'`, `'polygon'`, `'freestyle'` |
| `pasteEnabled` | Boolean | `true` | Enable/disable image pasting from clipboard |
| `freestyleSensitivity` | Number | `1` | Point density for freestyle drawing (0.1-10) |
| `simplificationTolerance` | Number | `2` | Path simplification tolerance (0.1-20) |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `shape-created` | `shape` | Emitted when a new shape is completed |

### Methods

| Method | Parameters | Description |
|--------|------------|-------------|
| `addImage(src, x, y, width, height, fitCanvas)` | Image source and positioning | Add image to canvas |
| `pasteImage()` | None | Paste image from clipboard |
| `clearCanvas()` | None | Clear entire canvas |
| `getDrawnShapes()` | None | Get all drawn shapes |
| `clearDrawnShapes()` | None | Clear only drawn shapes |
| `drawRectangle(x, y, w, h, options)` | Coordinates and styling | Draw rectangle programmatically |
| `drawPolygon(points, options)` | Points array and styling | Draw polygon programmatically |

## ML Use Cases

### Object Detection
```javascript
// Use rectangle mode to create bounding boxes
const annotations = shapes
  .filter(s => s.type === 'rectangle')
  .map(s => ({
    class: 'person',
    bbox: [s.image.x, s.image.y, s.image.width, s.image.height]
  }))
```

### Image Segmentation
```javascript
// Use polygon mode for segmentation masks
const masks = shapes
  .filter(s => s.type === 'polygon')
  .map(s => ({
    class: 'road',
    points: s.image.map(p => [p.x, p.y])
  }))
```

### Custom Annotations
```javascript
// Use freestyle mode for specialized tasks
const customAnnotations = shapes
  .filter(s => s.type === 'freestyle')
  .map(s => ({
    type: 'gesture',
    path: s.image
  }))
```

## Export Formats

The component supports exporting annotations in JSON format compatible with popular ML frameworks:

```json
{
  "annotations": [
    {
      "type": "rectangle",
      "class": "person",
      "coordinates": { "x": 100, "y": 50, "width": 200, "height": 300 }
    },
    {
      "type": "polygon", 
      "class": "car",
      "points": [[x1, y1], [x2, y2], [x3, y3]]
    }
  ]
}
```

## Development

The component is built with Vue 3 and provides a clean, extensible architecture for ML annotation tools. Key features include:

- **Separation of Concerns**: Canvas operations, coordinate systems, and ML data formats are cleanly separated
- **Event-Driven**: Real-time updates through Vue's reactive system
- **Performance Optimized**: Efficient drawing with path simplification and debounced operations
- **Extensible**: Easy to add new drawing modes and export formats

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

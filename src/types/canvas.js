/**
 * @typedef {Object} Point
 * @property {number} x - The x coordinate
 * @property {number} y - The y coordinate
 */

/**
 * @typedef {Object} Rectangle
 * @property {number} x - Top-left x coordinate
 * @property {number} y - Top-left y coordinate
 * @property {number} width - Rectangle width
 * @property {number} height - Rectangle height
 */

/**
 * @typedef {Object} DrawingOptions
 * @property {string|null} [fillStyle=null] - Fill color/gradient/pattern
 * @property {string} [strokeStyle='#000000'] - Stroke color
 * @property {number} [lineWidth=1] - Line width
 * @property {number[]} [lineDash=[]] - Line dash pattern
 */

/**
 * @typedef {Object} PolygonOptions
 * @property {string|null} [fillStyle=null] - Fill color/gradient/pattern
 * @property {string} [strokeStyle='#000000'] - Stroke color
 * @property {number} [lineWidth=1] - Line width
 * @property {number[]} [lineDash=[]] - Line dash pattern
 * @property {boolean} [closePath=true] - Whether to close the polygon path
 */

/**
 * @typedef {Object} FreestyleOptions
 * @property {string|null} [fillStyle=null] - Fill color/gradient/pattern
 * @property {string} [strokeStyle='#0066ff'] - Stroke color
 * @property {number} [lineWidth=2] - Line width
 * @property {number[]} [lineDash=[]] - Line dash pattern
 * @property {boolean} [closePath=true] - Whether to close the freestyle path
 */

/**
 * @typedef {Object} ShapeStyle
 * @property {string|null} [fillStyle] - Fill color/gradient/pattern
 * @property {string} [strokeStyle] - Stroke color
 * @property {number} [lineWidth] - Line width
 * @property {number[]} [lineDash] - Line dash pattern
 * @property {boolean} [closePath] - Whether to close the path (polygons/freestyle only)
 */

/**
 * @typedef {Object} Shape
 * @property {string} id - Unique shape identifier
 * @property {'rectangle'|'polygon'|'freestyle'} type - Shape type
 * @property {Rectangle|Point[]} canvas - Canvas coordinate data
 * @property {Rectangle|Point[]} image - Original image coordinate data
 * @property {ShapeStyle} style - Shape styling options
 * @property {number} timestamp - Creation timestamp
 */

/**
 * @typedef {Object} RectangleShape
 * @extends Shape
 * @property {'rectangle'} type - Shape type
 * @property {Rectangle} canvas - Canvas rectangle coordinates
 * @property {Rectangle} image - Original image rectangle coordinates
 */

/**
 * @typedef {Object} PolygonShape  
 * @extends Shape
 * @property {'polygon'} type - Shape type
 * @property {Point[]} canvas - Canvas polygon points
 * @property {Point[]} image - Original image polygon points
 */

/**
 * @typedef {Object} FreestyleShape
 * @extends Shape
 * @property {'freestyle'} type - Shape type
 * @property {Point[]} canvas - Canvas freestyle path points (simplified)
 * @property {Point[]} image - Original image freestyle path points
 */

/**
 * @typedef {Object} CanvasSize
 * @property {number} width - Canvas width
 * @property {number} height - Canvas height
 */

/**
 * @typedef {Object} ImageResult
 * @property {number} width - Drawn image width
 * @property {number} height - Drawn image height
 * @property {number} x - Image x position
 * @property {number} y - Image y position
 */

/**
 * @typedef {Object} PasteResult
 * @property {number|null} width - Pasted image width, null if no image was pasted
 * @property {number|null} height - Pasted image height, null if no image was pasted
 * @property {number|null} x - Pasted image x position, null if no image was pasted
 * @property {number|null} y - Pasted image y position, null if no image was pasted
 */

/**
 * @typedef {Object} ImageInfo
 * @property {number} canvasX - Image x position on canvas
 * @property {number} canvasY - Image y position on canvas
 * @property {number} canvasWidth - Image width on canvas
 * @property {number} canvasHeight - Image height on canvas
 * @property {number} originalWidth - Original image width
 * @property {number} originalHeight - Original image height
 */

/**
 * Drawing mode types
 * @typedef {'none'|'rectangle'|'polygon'|'freestyle'} DrawingMode
 */

/**
 * @typedef {Object} MLCanvasEvents
 * @property {function(Shape): void} 'shape-created' - Emitted when a shape is created
 * @property {function(Shape): void} 'shape-removed' - Emitted when a shape is removed
 * @property {function(): void} 'canvas-reset' - Emitted when canvas is completely reset
 */

/**
 * @typedef {Object} MLCanvasProps
 * @property {boolean} [pasteEnabled=true] - Enable/disable clipboard paste functionality
 * @property {DrawingMode} [drawingMode='none'] - Current drawing mode
 * @property {number} [freestyleSensitivity=1] - Sensitivity for freestyle drawing (0.1-10)
 * @property {number} [simplificationTolerance=2] - Path simplification tolerance (0.1-20)
 */

/**
 * @typedef {Object} MLCanvasMethods
 * @property {function(string, number?, number?, number?, number?, boolean?): Promise<ImageResult>} addImage - Add image to canvas
 * @property {function(number, number, number, number, DrawingOptions?): Shape} drawRectangle - Draw rectangle programmatically
 * @property {function(Point[], PolygonOptions?): Shape} drawPolygon - Draw polygon programmatically
 * @property {function(): void} clearCanvas - Clear entire canvas
 * @property {function(): void} resetCanvas - Reset canvas and clear all data
 * @property {function(): Promise<PasteResult|null>} pasteImage - Paste image from clipboard
 * @property {function(): HTMLImageElement|null} getPastedImage - Get pasted image reference
 * @property {function(boolean): void} setImagePasteEnabled - Enable/disable paste functionality
 * @property {function(): Shape[]} getDrawnShapes - Get all drawn shapes
 * @property {function(): void} clearDrawnShapes - Clear all drawn shapes
 * @property {function(string|number): Shape|null} removeShape - Remove shape by ID or index
 * @property {function(string): Shape|null} removeShapeById - Remove shape by ID
 * @property {function(Point): string|null} findShapeAtPosition - Find shape ID at mouse position
 * @property {function(string): Shape|null} findShapeById - Find shape by ID
 * @property {function(Shape): void} renderShape - Render a single shape
 * @property {function(string, Rectangle|Point[], Rectangle|Point[], ShapeStyle?): Shape} storeShape - Store shape with common function
 * @property {function(): CanvasRenderingContext2D|null} getContext - Get canvas 2D context
 * @property {function(): HTMLCanvasElement|null} getCanvas - Get canvas element
 * @property {function(): CanvasSize} getCanvasSize - Get canvas dimensions
 */

export {}
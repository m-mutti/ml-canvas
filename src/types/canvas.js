/**
 * @typedef {Object} Point
 * @property {number} x - The x coordinate
 * @property {number} y - The y coordinate
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
 * @typedef {Object} CanvasSize
 * @property {number} width - Canvas width
 * @property {number} height - Canvas height
 */

/**
 * @typedef {Object} ImageResult
 * @property {number} width - Drawn image width
 * @property {number} height - Drawn image height
 */

/**
 * @typedef {Object} PasteResult
 * @property {number|null} width - Pasted image width, null if no image was pasted
 * @property {number|null} height - Pasted image height, null if no image was pasted
 */

export {}
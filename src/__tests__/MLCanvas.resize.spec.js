import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { nextTick } from 'vue'

import MLCanvas from '../components/MLCanvas.vue'

const rect = (width, height) => ({
  width,
  height,
  top: 0,
  right: width,
  bottom: height,
  left: 0,
  x: 0,
  y: 0,
  toJSON: () => ({}),
})

describe('MLCanvas resizing', () => {
  let size
  let resizeObservers
  let contexts
  let wrapper

  beforeEach(() => {
    vi.useFakeTimers()
    size = { width: 400, height: 300 }
    resizeObservers = []
    contexts = new WeakMap()

    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (
        this.classList?.contains('ml-canvas-container') ||
        this.classList?.contains('ml-canvas')
      ) {
        return rect(size.width, size.height)
      }
      return rect(0, 0)
    })

    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockImplementation(function () {
      if (!contexts.has(this)) {
        contexts.set(this, {
          beginPath: vi.fn(),
          clearRect: vi.fn(),
          closePath: vi.fn(),
          drawImage: vi.fn(),
          fill: vi.fn(),
          fillRect: vi.fn(),
          fillText: vi.fn(),
          lineTo: vi.fn(),
          moveTo: vi.fn(),
          quadraticCurveTo: vi.fn(),
          restore: vi.fn(),
          save: vi.fn(),
          scale: vi.fn(),
          setLineDash: vi.fn(),
          setTransform: vi.fn(),
          stroke: vi.fn(),
          strokeRect: vi.fn(),
          strokeText: vi.fn(),
          translate: vi.fn(),
        })
      }
      return contexts.get(this)
    })

    class MockImage {
      naturalWidth = 800
      naturalHeight = 400

      set src(value) {
        this.currentSrc = value
        this.onload?.()
      }
    }

    class MockResizeObserver {
      constructor(callback) {
        this.callback = callback
        resizeObservers.push(this)
      }

      observe = vi.fn()
      disconnect = vi.fn()
    }

    vi.stubGlobal('Image', MockImage)
    vi.stubGlobal('ResizeObserver', MockResizeObserver)
    vi.stubGlobal('requestAnimationFrame', (callback) => setTimeout(callback, 0))
    vi.stubGlobal('cancelAnimationFrame', (id) => clearTimeout(id))
    vi.stubGlobal('devicePixelRatio', 2)
  })

  afterEach(() => {
    wrapper?.unmount()
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })

  const mountCanvasWithImage = async ({ props = {}, shapeOptions = {} } = {}) => {
    wrapper = mount(MLCanvas, { props })
    await nextTick()
    await nextTick()

    await wrapper.vm.addImage('test-image.png')
    const shape = wrapper.vm.drawRectangle(100, 100, 200, 100, shapeOptions)
    const canvas = wrapper.find('canvas.ml-canvas').element
    const context = contexts.get(canvas)
    context.drawImage.mockClear()
    context.strokeRect.mockClear()
    return { canvas, context, shape }
  }

  it('refits the image and reprojects annotations after a window resize', async () => {
    const { canvas, context, shape } = await mountCanvasWithImage()

    size = { width: 200, height: 300 }
    window.dispatchEvent(new Event('resize'))
    await vi.runAllTimersAsync()
    await nextTick()

    expect(context.drawImage).toHaveBeenLastCalledWith(expect.any(Image), 0, 100, 200, 100)
    expect(shape.canvas).toEqual({ x: 25, y: 125, width: 50, height: 25 })
    expect(context.strokeRect).toHaveBeenLastCalledWith(25, 125, 50, 25)
    expect(canvas.width).toBe(400)
    expect(canvas.height).toBe(600)
    expect(context.setTransform).toHaveBeenLastCalledWith(2, 0, 0, 2, 0, 0)
  })

  it('updates for container-only and hidden-to-visible resizes through ResizeObserver', async () => {
    const { context } = await mountCanvasWithImage()

    expect(resizeObservers).toHaveLength(1)
    size = { width: 600, height: 300 }
    resizeObservers[0].callback()
    await vi.runAllTimersAsync()
    await nextTick()

    expect(context.drawImage).toHaveBeenLastCalledWith(expect.any(Image), 0, 0, 600, 300)

    context.drawImage.mockClear()
    size = { width: 0, height: 0 }
    resizeObservers[0].callback()
    await vi.runAllTimersAsync()
    expect(context.drawImage).not.toHaveBeenCalled()

    size = { width: 500, height: 250 }
    resizeObservers[0].callback()
    await vi.runAllTimersAsync()
    await nextTick()

    expect(context.drawImage).toHaveBeenLastCalledWith(expect.any(Image), 0, 0, 500, 250)
  })

  it('toggles only the border in the locked inspect preview', async () => {
    const { context: canvasContext } = await mountCanvasWithImage({
      props: {
        drawingMode: 'inspect',
        inspectPopoverConfiguration: {
          canvas: { showShapeIndex: false },
          buttons: {
            showBorderToggle: true,
            hideBordersLabel: 'Hide Cell Border',
            showBordersLabel: 'Show Cell Border',
          },
        },
      },
      shapeOptions: {
        displayStatistics: [{ name: 'Signals', value: 1 }],
      },
    })

    const inspectCanvas = wrapper.find('canvas.inspect-canvas').element
    const inspectContext = contexts.get(inspectCanvas)

    await wrapper.find('canvas.ml-canvas').trigger('mousemove', {
      clientX: 75,
      clientY: 125,
    })
    await wrapper.find('canvas.ml-canvas').trigger('mousedown', {
      button: 0,
      clientX: 75,
      clientY: 125,
    })
    await nextTick()

    const toggle = wrapper.find('.border-toggle-button')
    expect(toggle.exists()).toBe(true)
    expect(toggle.text()).toBe('Hide Cell Border')

    canvasContext.strokeRect.mockClear()
    inspectContext.clearRect.mockClear()
    inspectContext.drawImage.mockClear()
    inspectContext.strokeRect.mockClear()

    await toggle.trigger('click')
    expect(wrapper.find('.border-toggle-button').text()).toBe('Show Cell Border')
    expect(inspectContext.clearRect).toHaveBeenCalled()
    expect(inspectContext.drawImage).toHaveBeenCalled()
    expect(inspectContext.strokeRect).not.toHaveBeenCalled()
    expect(canvasContext.strokeRect).not.toHaveBeenCalled()

    await toggle.trigger('click')
    expect(wrapper.find('.border-toggle-button').text()).toBe('Hide Cell Border')
    expect(inspectContext.strokeRect).toHaveBeenCalled()
    expect(canvasContext.strokeRect).not.toHaveBeenCalled()
  })
})

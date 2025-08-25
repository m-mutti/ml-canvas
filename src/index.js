import MLCanvas from './components/MLCanvas.vue'

const install = (app) => {
  app.component('MLCanvas', MLCanvas)
}

export { MLCanvas, install }
export default { install }

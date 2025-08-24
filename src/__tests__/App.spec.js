import { describe, it, expect } from 'vitest'

import { mount } from '@vue/test-utils'
import App from '../App.vue'

describe('App', () => {
  it('renders the ML Canvas application', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('ML Canvas Library Demo')
  })

  it('renders drawing mode buttons', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Rectangle')
    expect(wrapper.text()).toContain('Polygon')
    expect(wrapper.text()).toContain('Freestyle')
  })

  it('renders canvas instructions', () => {
    const wrapper = mount(App)
    expect(wrapper.text()).toContain('Instructions')
    expect(wrapper.text()).toContain('Click and drag to draw')
  })
})

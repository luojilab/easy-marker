import BaseElement from './base'
import Position from '../lib/position'

export default class Mask extends BaseElement {
  constructor(container, option) {
    super()
    const defaultOptions = {
      color: '#FEFFCA',
      opacity: 0.5,
      animateDuration: 100,
    }
    this.container = container
    this.option = Object.assign(defaultOptions, option)
    this.paths = []
    this.position = {
      header: new Position(),
      body: new Position(),
      footer: new Position(),
    }
    this.animating = false
    this.animateStartTime = 0
    this.animateEndTime = 0
    this.animatePercent = 0
    this.polygonElement = null
    this.createElement()
    this.mount()
  }

  get top() {
    return this.position.header.y
  }

  get left() {
    return this.position.header.x
  }

  get height() {
    return this.position.header.height + this.position.body.height + this.position.footer.height
  }

  createElement() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    // svg.style.zIndex = this.option.zIndex
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.position = 'absolute'
    svg.style.top = '0'
    svg.style.left = '0'
    svg.style.overflow = 'visible'

    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    polygon.style.fill = this.option.color
    polygon.style.strokeWidth = 0
    polygon.style.strokeOpacity = this.option.opacity
    polygon.style.opacity = this.option.opacity
    polygon.style.transition = 'opacity 0.2s ease'

    svg.appendChild(polygon)
    this.element = svg
    this.polygonElement = polygon
  }

  render(headerPosition, bodyPosition, footerPosition) {
    const { header, body, footer } = this.position
    if (
      this.paths.length !== 0 &&
      header.equal(headerPosition) &&
      body.equal(bodyPosition) &&
      footer.equal(footerPosition)
    ) {
      return
    }
    this.polygonElement.style.opacity = this.option.opacity
    const fromPosition = this.position
    this.position.header.setAll(headerPosition)
    this.position.body.setAll(bodyPosition)
    this.position.footer.setAll(footerPosition)

    this.animateStartTime = Date.now()
    this.animateEndTime = this.animateStartTime + this.option.animateDuration
    this.animatePercent = 0
    if (!this.animating) {
      this.animating = true
      this.animated(fromPosition)
    }
  }

  animated(from) {
    const realPercent = (Date.now() - this.animateStartTime) / (this.animateEndTime - this.animateStartTime)
    let nextPercent = 0

    if (realPercent >= 1) {
      nextPercent = 1
      this.animatePercent = 1
    } else {
      const nextAnimationPercent = 1000 / 60 / this.option.animateDuration + (realPercent - this.animatePercent) * 1.3
      this.animatePercent += nextAnimationPercent
      nextPercent = nextAnimationPercent > 1 ? 1 : nextAnimationPercent / (1 - realPercent)
    }

    const nextHeaderPosition = this.constructor.getAnimateFrame(from.header, this.position.header, nextPercent)
    const nextBodyPosition = this.constructor.getAnimateFrame(from.body, this.position.body, nextPercent)
    const nextFooterPosition = this.constructor.getAnimateFrame(from.footer, this.position.footer, nextPercent)
    const nextPosition = {
      header: nextHeaderPosition,
      body: nextBodyPosition,
      footer: nextFooterPosition,
    }
    this.paths = this.constructor.getPaths(nextPosition)
    const points = this.paths.map(([x, y]) => `${x},${y}`).join(' ')
    this.polygonElement.setAttribute('points', points)
    if (realPercent >= 1) {
      this.animating = false
      return
    }
    window.requestAnimationFrame(() => this.animated(nextPosition))
  }

  reset() {
    this.paths = []
    this.polygonElement.style.opacity = '0'
    this.polygonElement.setAttribute('points', '')
  }

  static getAnimateFrame(from, to, percent) {
    const framePosition = new Position()
    framePosition.x = from.x + (to.x - from.x) * percent
    framePosition.y = from.y + (to.y - from.y) * percent
    framePosition.height = from.height + (to.height - from.height) * percent
    framePosition.width = from.width + (to.width - from.width) * percent
    return framePosition
  }

  static getPaths(position) {
    const { header, body, footer } = position
    const paths = []
    if (header.isSet) {
      paths.push([header.x, header.y])
      paths.push([header.x + header.width, header.y])
      paths.push([header.x + header.width, header.y + header.height])
    }
    if (body.isSet) {
      paths.push([body.x + body.width, body.y])
      paths.push([body.x + body.width, body.y + body.height])
    }
    if (footer.isSet) {
      paths.push([footer.x + footer.width, footer.y])
      paths.push([footer.x + footer.width, footer.y + footer.height])
      paths.push([footer.x, footer.y + footer.height])
      paths.push([footer.x, footer.y])
    }
    if (body.isSet) {
      paths.push([body.x, body.y + body.height])
      paths.push([body.x, body.y])
    }
    if (header.isSet) {
      paths.push([header.x, header.y + header.height])
    }

    return paths
  }
}

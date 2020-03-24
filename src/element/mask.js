import BaseElement from './base'
import Position from '../lib/position'
import { rectToPointArray } from '../lib/helpers'
import { EasyMarkerMode } from '../lib/types'

export default class Mask extends BaseElement {
  constructor(container, option) {
    super()
    const defaultOptions = {
      color: '#FEFFCA',
      opacity: 0.5,
      animateDuration: 100,
    }
    this.mode = option.mode || EasyMarkerMode.NODE

    this.container = container
    this.option = Object.assign(defaultOptions, option)

    if (this.mode === EasyMarkerMode.NODE) {
      this.paths = []
      this.position = {
        header: new Position(),
        body: new Position(),
        footer: new Position(),
      }
      this.animateStartTime = 0
      this.animateEndTime = 0
      this.animatePercent = 0
      this.polygonElement = null
    } else {
      this.rects = []
    }
    this.animating = false

    this.createElement()
    this.mount()
  }

  get top() {
    if (this.mode === EasyMarkerMode.NODE) {
      return this.position.header.y
    }
    if (this.rects[0]) {
      return this.rects[0].top
    }
    return 0
  }

  get left() {
    if (this.mode === EasyMarkerMode.NODE) {
      return this.position.header.x
    }
    if (this.rects[0]) {
      return this.rects[0].left
    }
    return 0
  }

  get height() {
    if (this.mode === EasyMarkerMode.NODE) {
      return this.position.header.height + this.position.body.height + this.position.footer.height
    }
    const lastRect = this.rects[this.rects.length - 1]
    if (lastRect) {
      return lastRect.top + lastRect.height
    }
    return 0
  }

  createElement() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.zIndex = 2
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.position = 'absolute'
    svg.style.top = '0'
    svg.style.left = '0'
    svg.style.overflow = 'visible'

    if (this.mode === EasyMarkerMode.NODE) {
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
      polygon.style.fill = this.option.color
      polygon.style.strokeWidth = 0
      polygon.style.strokeOpacity = this.option.opacity
      polygon.style.opacity = this.option.opacity
      polygon.style.transition = 'opacity 0.2s ease'
      svg.appendChild(polygon)
      this.polygonElement = polygon
    }
    this.element = svg
  }

  render(...args) {
    if (this.mode === EasyMarkerMode.NODE) {
      this.renderBlock(...args)
    } else {
      this.renderRectsLine(...args)
    }
  }

  renderBlock(headerPosition, bodyPosition, footerPosition) {
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
    if (this.mode === EasyMarkerMode.NODE) {
      this.paths = []
      this.polygonElement.style.opacity = '0'
      this.polygonElement.setAttribute('points', '')
    }
    if (this.mode === EasyMarkerMode.REGION) {
      this.removeAllRectangle()
    }
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

  renderRectsLine(rects) {
    this.rects = rects
    const points = rects.map((rect) => {
      const margin = 0
      return rectToPointArray(rect, { x: 0, y: 0 }, margin)
    })
    if (!this.animating) {
      this.animating = true
      window.requestAnimationFrame(() => this.renderRectsLineAnimated(points))
    }
  }
  renderRectsLineAnimated(points) {
    this.removeAllRectangle()
    points.forEach((linePoints) => {
      this.element.appendChild(this.createRectangle(linePoints))
    })
    this.animating = false
  }
  createRectangle(pointList) {
    const points = pointList.reduce((acc, [x, y]) => (acc === '' ? `${x},${y}` : `${acc} ${x},${y}`), '')
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    polygon.style.fill = this.option.color
    polygon.style.strokeWidth = 0
    polygon.style.strokeOpacity = this.option.opacity
    polygon.style.opacity = this.option.opacity
    polygon.setAttribute('points', points)
    return polygon
  }
  removeAllRectangle() {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild)
    }
  }
}

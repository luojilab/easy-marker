import BaseElement from './base'
import Position from '../lib/position'
import { rectToPointArray, screenRelativeToContainerRelative } from '../lib/helpers'
import { EasyMarkerMode } from '../lib/types'
import TextNode from '../lib/text_node'

export const MaskType = {
  BLOCK: 'block',
  LINE: 'line',
}

export default class Mask extends BaseElement {
  constructor(container, option) {
    super()
    const defaultOptions = {
      color: '#FEFFCA',
      opacity: 0.5,
      animateDuration: 100,
    }
    this.mode = option.mode || EasyMarkerMode.NODE
    this.maskType = option.maskType || (this.mode === EasyMarkerMode.NODE ? MaskType.BLOCK : MaskType.LINE)
    this.container = container
    this.option = Object.assign(defaultOptions, option)

    if (this.maskType === MaskType.BLOCK) {
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
    this.easyMarker = null
    this.createElement()
    this.mount()
  }

  // get screenRelativeOffset() {
  //   const { top, left } = this.container.getBoundingClientRect()
  //   return {
  //     x: left,
  //     y: top,
  //   }
  // }

  get screenRelativeOffset() {
    if (!this.easyMarker) {
      return {
        x: 0,
        y: 0,
      }
    }
    return this.easyMarker.screenRelativeOffset
  }

  get top() {
    if (this.maskType === MaskType.BLOCK) {
      return this.position.header.y
    }
    if (this.rects[0]) {
      return this.mode === EasyMarkerMode.NODE ?
        this.rects[0].top - this.screenRelativeOffset.y : this.rects[0].top
    }
    return 0
  }

  get left() {
    if (this.maskType === MaskType.BLOCK) {
      return this.position.header.x
    }
    if (this.rects[0]) {
      return this.mode === EasyMarkerMode.NODE ?
        this.rects[0].left - this.screenRelativeOffset.x : this.rects[0].left
    }
    return 0
  }

  get height() {
    if (this.maskType === MaskType.BLOCK) {
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

    if (this.maskType === MaskType.BLOCK) {
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

  render(start, end) {
    if (this.mode === EasyMarkerMode.NODE) {
      if (this.maskType === 'line') {
        let rects
        try {
          ({ rects } = TextNode.getSelectNodeRectAndText(
            start.node,
            end.node,
            start.offset,
            end.offset
          ))
        } catch (error) {
          console.error('EasyMarkerError:', error) // eslint-disable-line no-console
          rects = []
        }
        const lineHeight = Number(window.getComputedStyle(start.node.parentElement).lineHeight.replace('px', ''))
        this.renderRectsLine(rects, lineHeight)
      } else {
        const { header, body, footer } = TextNode.getSelectRects(
          start,
          end,
        )
        const relativeHeader = screenRelativeToContainerRelative(
          header,
          this.screenRelativeOffset,
        )
        const relativeBody = screenRelativeToContainerRelative(
          body,
          this.screenRelativeOffset,
        )
        const relativeFooter = screenRelativeToContainerRelative(
          footer,
          this.screenRelativeOffset,
        )
        this.renderBlock(relativeHeader, relativeBody, relativeFooter)
      }
    }

    if (this.mode === EasyMarkerMode.REGION) {
      const rects = this.easyMarker.region.getRects(start, end)
      if (this.maskType === 'line') {
        this.renderRectsLine(rects)
      } else {
        let header
        let footer
        let body
        rects.forEach((rect, index) => {
          if (index === 0) {
            header = new Position()
            body = new Position()
            footer = new Position()
            header.setAll(rect)
            body.setAll(rect)
            footer.setAll(rect)
            body.y = rect.y + rect.height
            body.height = 0
            footer.height = 0
            footer.y = rect.y + rect.height
          } else if (index === rects.length - 1) {
            footer.setAll(rect)
            body.height = rect.y - (header.y + header.height)
          } else {
            const right = body.x + body.width
            const left = body.x
            if (rect.x < left) {
              body.x = rect.x
            }
            if (rect.x + rect.width >= right) {
              body.width = rect.x + rect.width - body.x
            }
          }
        })
        this.renderBlock(header, body, footer)
      }
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
    if (this.maskType === MaskType.BLOCK) {
      this.paths = []
      this.polygonElement.style.opacity = '0'
      this.polygonElement.setAttribute('points', '')
    }
    if (this.maskType === MaskType.LINE) {
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

  renderRectsLine(rects, lineHeight) {
    this.rects = rects
    const points = rects.map((rect) => {
      let margin = 0
      let offset = { x: 0, y: 0 }
      if (this.mode === EasyMarkerMode.NODE) {
        lineHeight = lineHeight || rect.height
        margin = this.option.margin || (lineHeight - rect.height) / 4
        offset = this.screenRelativeOffset
      }
      return rectToPointArray(rect, offset, margin)
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

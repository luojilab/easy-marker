import BaseElement from './base'
import TextNode from '../text_node'
import { getTouchPosition, inRectangle, anyToPx } from '../helpers'
/**
 * Highlight
 *
 * @export
 * @class Highlight
 * @extends {BaseElement}
 */
export default class Highlight extends BaseElement {
  constructor(container, option) {
    super()
    const defaultOptions = {
      color: 'FEFFCA',
      opacity: 1,
      // margin: '0.1rem',
    }
    this.container = container
    this.option = Object.assign(defaultOptions, option)
    this.option.margin = anyToPx(this.option.margin)
    this.lineMap = new Map()
    this.onClick = () => { }
    this.createElement()
    this.mount()
    this.id = 0
  }

  getID() {
    return this.id++
  }

  /**
   *
   *
   * @param {Selection} selection
   * @param {any} id
   * @param {any} meta
   * @param {Object} offset
   * @param {number} offset.x
   * @param {number} offset.y
   * @memberof Highlight
   */
  highlight(selection, id, meta = {}, offset) {
    const lineID = id === undefined || id === null ? this.getID() : id
    const startTextNode = new TextNode(selection.anchorNode, selection.anchorOffset)
    const endTextNode = new TextNode(selection.focusNode, selection.focusOffset)
    let lineHeight = Number(window.getComputedStyle(selection.anchorNode.parentElement).lineHeight.replace('px', ''))
    let rects
    try {
      ({ rects } = TextNode.getSelectNodeRectAndText(
        startTextNode.node,
        endTextNode.node,
        startTextNode.offset,
        endTextNode.offset
      ))
    } catch (error) {
      console.error('EasyMarkerError:', error) // eslint-disable-line no-console
      rects = []
    }


    const relativeRects = []
    const points = rects.map((rect) => {
      const relativeRect = {
        top: rect.top - offset.y,
        bottom: rect.bottom - offset.y,
        height: rect.height,
        width: rect.width,
        left: rect.left - offset.x,
        right: rect.right - offset.x,
      }
      relativeRects.push(relativeRect)
      lineHeight = lineHeight || rect.height
      const margin = this.option.margin || (lineHeight - rect.height) / 4
      return this.constructor.rectToPointArray(rect, offset, margin)
        .reduce((acc, [x, y]) => `${acc} ${x},${y}`, '')
    })
    this.lineMap.set(lineID, {
      selection, points, relativeRects, meta, lineHeight,
    })
    return lineID
  }

  render() {
    this.removeAllRectangle()
    this.lineMap.forEach((line) => {
      line.points.forEach((points) => {
        this.element.appendChild(this.createRectangle(points))
      })
    })
  }

  /**
   *
   *
   * @param {Object[]} lines
   * @param {Selection} lines[].selection
   * @param {any} [lines[].id]
   * @param {any} [lines[].meta]
   * @memberof Highlight
   */
  highlightLines(lines, offset) {
    this.lineMap.clear()
    const ids = lines.map(({ selection, id, meta }) => this.highlight(selection, id, meta, offset))
    this.render()
    return ids
  }

  /**
   *
   *
   * @param {Selection} selection
   * @param {*} id
   * @param {*} meta
   * @param {Object} offset
   * @memberof Highlight
   */
  highlightLine(selection, id, meta, offset) {
    const lineID = this.highlight(selection, id, meta, offset)
    this.render()
    return lineID
  }

  /**
   *
   *
   * @param {any} id
   * @returns {boolean}
   * @memberof Highlight
   */
  cancelHighlightLine(id) {
    this.lineMap.delete(id)
    this.render()
  }

  createElement() {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
    svg.style.zIndex = '1'
    svg.style.width = '100%'
    svg.style.height = '100%'
    svg.style.position = 'absolute'
    svg.style.top = '0'
    svg.style.left = '0'
    svg.style.overflow = 'visible'
    this.element = svg
  }

  createRectangle(points) {
    const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon')
    polygon.style.fill = this.option.color
    polygon.style.strokeWidth = 0
    polygon.style.strokeOpacity = this.option.opacity
    polygon.style.opacity = this.option.opacity
    polygon.setAttribute('points', points)
    return polygon
  }

  handleTap(e) {
    const { x, y } = getTouchPosition(e)
    const { top, left } = this.container.getBoundingClientRect()
    let clickLine
    this.lineMap.forEach((line, id) => {
      for (let i = 0; i < line.relativeRects.length; i++) {
        const rect = line.relativeRects[i]
        const margin = (line.lineHeight - rect.height) / 2
        if (inRectangle(x - left, y - top, rect, margin)) {
          clickLine = { id, line }
          break
        }
      }
    })
    if (clickLine) {
      this.onClick(clickLine.id, clickLine.line.meta, clickLine.line.selection)
      return true
    }
    return false
  }

  removeAllRectangle() {
    while (this.element.firstChild) {
      this.element.removeChild(this.element.firstChild)
    }
  }
  /**
   *
   *
   * @static
   * @param {ClientRect} rect
   * @param {Object} offset
   * @param {number} offset.x
   * @param {number} offset.y
   * @memberof Highlight
   */
  static rectToPointArray(rect, offset, margin) {
    const points = []
    if (rect.width === 0) return points

    points.push([rect.left - margin, rect.top - margin])
    points.push([rect.right + margin, rect.top - margin])
    points.push([rect.right + margin, rect.bottom + margin])
    points.push([rect.left - margin, rect.bottom + margin])

    points.forEach((point) => {
      point[0] -= offset.x
      point[1] -= offset.y
    })
    return points
  }
}


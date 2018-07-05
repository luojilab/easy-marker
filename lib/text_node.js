import { getNodeRects, copyRect } from './helpers'
import Position from './position'

/**
 * Text node
 *
 * @export
 * @class TextNode
 */
export default class TextNode {
  constructor(node, offset) {
    this.node = node
    this.offset = offset
  }

  /**
   * Get the selected text
   *
   * @static
   * @param {any} startTextNode
   * @param {any} endTextNode
   * @memberof TextNode
   */
  static getSelectText(startTextNode, endTextNode) {
    try {
      const { text } = this.getSelectNodeRectAndText(
        startTextNode.node,
        endTextNode.node,
        startTextNode.offset,
        endTextNode.offset
      )
      return text
    } catch (error) {
      console.error('EasyMarkerError:', error) // eslint-disable-line no-console
      return ''
    }
  }

  /**
   * Get the selected area
   *
   * @static
   * @param {any} startTextNode
   * @param {any} endTextNode
   * @returns
   * @memberof TextNode
   */
  static getSelectRects(startTextNode, endTextNode) {
    const headerLine = new Position()
    const bodyLine = new Position()
    const footerLine = new Position()

    if (!startTextNode || !endTextNode) {
      return {
        header: headerLine,
        body: bodyLine,
        footer: footerLine,
      }
    }

    if (startTextNode.node.nodeName !== '#text' || endTextNode.node.nodeName !== '#text') {
      // eslint-disable-next-line no-console
      console.error('The parameters for getting the selection rect should be a TextNode', {
        startTextNode,
        endTextNode,
      })
      return {
        header: headerLine,
        body: bodyLine,
        footer: footerLine,
      }
    }
    let rects
    try {
      ({ rects } = this.getSelectNodeRectAndText(
        startTextNode.node,
        endTextNode.node,
        startTextNode.offset,
        endTextNode.offset
      ))
    } catch (error) {
      console.error('EasyMarkerError:', error) // eslint-disable-line no-console
      rects = []
    }


    const lineMergedRectMap = new Map()
    rects.forEach((rect) => {
      if (lineMergedRectMap.has(rect.top)) {
        lineMergedRectMap.get(rect.top).width += rect.width
      } else {
        lineMergedRectMap.set(rect.top, copyRect(rect))
      }
    })

    const lineMergedRects = [...lineMergedRectMap.values()]

    let startLineHeight = 0
    const leftArr = []
    const rightArr = []
    if (lineMergedRects.length > 0) {
      const headRect = lineMergedRects.shift()
      startLineHeight =
        Number(window.getComputedStyle(startTextNode.node.parentElement).lineHeight.replace('px', '')) ||
        headRect.height
      headerLine.x = headRect.left
      headerLine.width = headRect.width
      headerLine.y = headRect.top - (startLineHeight - headRect.height) / 2
      headerLine.height = startLineHeight
      leftArr.push(headerLine.x)
      rightArr.push(headRect.right)
    }

    let endLineHight = 0
    if (lineMergedRects.length > 0) {
      const footRect = lineMergedRects.pop()
      endLineHight =
        Number(window.getComputedStyle(endTextNode.node.parentElement).lineHeight.replace('px', '')) || footRect.height
      footerLine.x = footRect.left
      footerLine.width = footRect.width
      footerLine.y = footRect.top - (endLineHight - footRect.height) / 2
      footerLine.height = endLineHight

      leftArr.push(footerLine.x)
      rightArr.push(footRect.right)
    }

    if (lineMergedRects.length > 0) {
      let maxRight = 0
      lineMergedRects.forEach((lineRect) => {
        if (bodyLine.x && bodyLine.width) {
          if (lineRect.left < bodyLine.x) {
            bodyLine.x = lineRect.left
          }

          if (lineRect.width > bodyLine.width) {
            bodyLine.width = lineRect.width
          }
          if (maxRight < lineRect.right) {
            maxRight = lineRect.right
          }
        } else {
          bodyLine.x = lineRect.left
          bodyLine.width = lineRect.width
          maxRight = lineRect.right
        }
      })
      leftArr.push(bodyLine.x)
      rightArr.push(maxRight)
    }
    const minLeft = Math.min(...leftArr)
    if (minLeft !== Infinity) {
      bodyLine.x = minLeft
    }
    const maxRight = Math.max(...rightArr)
    if (maxRight !== -Infinity) {
      bodyLine.width = maxRight - bodyLine.x
    }

    bodyLine.y = headerLine.y + startLineHeight
    if (footerLine.isSet) {
      bodyLine.height = footerLine.y - bodyLine.y
    } else {
      footerLine.x = headerLine.x
      footerLine.y = headerLine.y + startLineHeight
    }

    return {
      header: headerLine,
      body: bodyLine,
      footer: footerLine,
    }
  }

  static getSelectNodeRectAndText(startNode, endNode, startIndex, endIndex) {
    const result = {
      rects: [],
      text: '',
    }
    if (startNode.childNodes.length > 0 && startNode.nodeName !== 'SCRIPT' && startNode.nodeName !== 'STYLE') {
      const childNode = startNode.childNodes[0]
      const { text, rects } = this.getSelectNodeRectAndText(childNode, endNode, 0, endIndex)
      result.rects.push(...rects)
      result.text += text
      return result
    }

    if (startNode.nodeName === '#text') {
      const textEndIndex = startNode === endNode ? endIndex : startNode.textContent.length
      result.rects.push(...getNodeRects(startNode, startIndex, textEndIndex))
      result.text += startNode.textContent.substring(startIndex, textEndIndex)
    }

    if (startNode === endNode) {
      return result
    }

    const nextNode = startNode.nextSibling
    if (nextNode) {
      const { text, rects } = this.getSelectNodeRectAndText(nextNode, endNode, 0, endIndex)
      result.rects.push(...rects)
      result.text += text
    } else {
      let currentNode = startNode.parentNode
      while (currentNode && currentNode.nextSibling === null) {
        currentNode = currentNode.parentNode
      }
      if (currentNode) {
        const { text, rects } = this.getSelectNodeRectAndText(currentNode.nextSibling, endNode, 0, endIndex)
        result.rects.push(...rects)
        result.text += text
      } else {
        throw new Error('Invalid end node')
      }
    }
    return result
  }
}

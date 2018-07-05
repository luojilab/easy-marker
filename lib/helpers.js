/**
 * Get the location of the clicked word
 *
 * @export
 * @param {HTMLElement} pElement
 * @param {number} x
 * @param {number}  y
 * @param {Array<string>} separators
 * @returns
 */
export function getClickWordsPosition(pElement, x, y, separators = ['']) {
  if (!pElement || (!pElement && pElement.childNodes)) return null
  let lineHeight = Number(window.getComputedStyle(pElement).lineHeight.replace('px', ''))
  for (let i = 0; i < pElement.childNodes.length; i++) {
    const node = pElement.childNodes[i]

    if (node.nodeName === '#text') {
      const words = split(node.textContent, separators)
      let currentTextIndex = 0
      const range = document.createRange()

      for (let index = 0; index < words.length; index++) {
        const wordsLength = words[index].length
        range.setStart(node, currentTextIndex)
        range.setEnd(node, currentTextIndex + wordsLength)
        const textRects = range.getClientRects()

        for (let j = 0; j < textRects.length; j++) {
          const rect = textRects[j]
          lineHeight = lineHeight || rect.height
          const margin = (lineHeight - rect.height) / 2
          if (rect.left < x && rect.right > x && rect.top - margin < y && rect.bottom + margin > y) {
            const rects = []

            for (let k = 0; k < textRects.length; k++) {
              const textRect = textRects[k]
              rects.push(Object.assign({}, textRect, {
                top: textRect.top - margin,
                height: lineHeight,
                bottom: textRect.bottom + margin,
                left: textRect.left,
                right: textRect.right,
                width: textRect.width,
              }))
            }
            return {
              node,
              rects,
              textRects,
              index: currentTextIndex,
              wordsLength,
            }
          }
        }
        currentTextIndex += wordsLength
      }
    } else if (node.nodeName === '#comment') {
      continue // eslint-disable-line no-continue
    } else {
      const result = getClickWordsPosition(node, x, y, separators)
      if (result) return result
    }
  }
  return null
}

/**
 * Get the location of the click
 *
 * @export
 * @param {HTMLElement| Node} pElement
 * @param {number} x
 * @param {number} y
 * @param {boolean} isStart
 */
export function getClickPosition(pElement, x, y, isStart) {
  if (!pElement || (!pElement && pElement.childNodes)) return null
  let lineHeight = Number(window.getComputedStyle(pElement).lineHeight.replace('px', ''))
  for (let i = 0; i < pElement.childNodes.length; i++) {
    const node = pElement.childNodes[i]
    let position = null

    if (node.nodeName === '#text') {
      const words = [...node.textContent]
      const range = document.createRange()
      for (let index = 0; index < words.length; index++) {
        range.setStart(node, index)
        range.setEnd(node, index + 1)
        let preRect
        let nextRect
        const rects = range.getClientRects()
        let rect
        if (rects.length > 1) {
          rect = rects[1] // eslint-disable-line prefer-destructuring
        } else if (rects.length === 1) {
          rect = rects[0] // eslint-disable-line prefer-destructuring
        } else {
          continue // eslint-disable-line no-continue
        }
        lineHeight = lineHeight || rect.height
        const margin = (lineHeight - rect.height) / 2
        if (rect.top - margin <= y && rect.bottom + margin >= y) {
          position = {
            x: rect.left,
            y: rect.top - margin,
            height: lineHeight,
            index,
            node,
          }

          try {
            range.setStart(node, index + 1)
            range.setEnd(node, index + 2)
            const nextRects = range.getClientRects()

            if (nextRects.length > 1) {
              nextRect = nextRects[1] // eslint-disable-line prefer-destructuring
            } else if (nextRects.length === 1) {
              nextRect = nextRects[0] // eslint-disable-line prefer-destructuring
            } else {
              nextRect = null
            }
          } catch (error) {
            nextRect = null
          }

          const isLineStart = preRect === undefined || (preRect && preRect.bottom <= rect.top)
          const isLineEnd = nextRect === null || (nextRect && nextRect.top >= rect.bottom)

          if (x < rect.right) {
            const isLeft = x < (rect.left + rect.right) / 2
            if ((isLineStart && !isStart) || (!isLeft && !(isLineEnd && isStart))) {
              position.x += rect.width
              position.index += 1
            }
            return position
          }

          if (
            isLineEnd &&
            pElement.childNodes[i + 1] === undefined &&
            (!pElement.nextSibling || (pElement.nextSibling && pElement.nextSibling.nodeName !== '#text'))
          ) {
            if (!isStart) {
              position.x += rect.width
              position.index += 1
            }
            return position
          }
        }
        preRect = rect
      }
    } else if (node.nodeName === '#comment') {
      continue // eslint-disable-line no-continue
    } else {
      const result = getClickPosition(node, x, y, isStart)
      if (result) return result
    }
  }
  return null
}

/**
 * Get the relative position of the touch
 *
 * @export
 * @param {TouchEvent} e
 * @param {Object} offset Offset of the clicked location
 * @returns
 */
export function getTouchPosition(e, offset = { x: 0, y: 0 }) {
  return {
    x: (e.clientX || e.changedTouches[0].clientX) + offset.x,
    y: (e.clientY || e.changedTouches[0].clientY) + offset.y,
  }
}

/**
 * Returns the distance between two points
 *
 * @export
 * @param {any} start
 * @param {any} end
 * @returns
 */
export function getDistance(start, end) {
  return Math.sqrt((start.x - end.x) ** 2 + (start.y - end.y) ** 2)
}

/**
 * Convert px to rem
 *
 * @export
 * @param {any} px
 * @returns
 */
export function pxToRem(px) {
  const baseFontSize = Number((document.documentElement.style.fontSize || '24px').replace('px', ''))
  return px / baseFontSize
}

/**
 *
 *
 * @export
 * @param {any} pixelUnit
 * @returns
 */
export function anyToPx(pixelUnit) {
  if (typeof pixelUnit === 'number') return pixelUnit
  if (typeof pixelUnit === 'string') {
    if (pixelUnit.indexOf('px') > -1) return Number(pixelUnit.replace('px', ''))
    if (pixelUnit.indexOf('rem') > -1) {
      const baseFontSize = Number((document.documentElement.style.fontSize || '24px').replace('px', ''))
      return Number(pixelUnit.replace('rem', '')) * baseFontSize
    }
    return Number(pixelUnit)
  }
  return 0
}

/**
 * Get the text node areas
 *
 * @export
 * @param {any} node
 * @param {any} start
 * @param {any} end
 * @returns
 */
export function getNodeRects(node, start, end) {
  const range = document.createRange()
  const startIndex = start === undefined ? 0 : start
  const endIndex = end === undefined ? node.textContent.length : end
  try {
    range.setStart(node, startIndex)
    range.setEnd(node, endIndex)
    return domCollectionToArray(range.getClientRects())
  } catch (error) {
    console.error('EasyMarkerError:', error) // eslint-disable-line no-console
    return []
  }
}

/**
 * Get the absolute positioning of the element
 * todo: use getBoundingClientRect()
 * @export
 * @param {HTMLElement} element
 */
export function getElementAbsolutePosition(element) {
  let x = element.offsetLeft
  let y = element.offsetTop
  const width = element.clientWidth
  const height = element.clientHeight
  let current = element.offsetParent

  while (current !== null) {
    x += current.offsetLeft
    y += current.offsetTop
    current = current.offsetParent
  }

  return {
    x,
    y,
    width,
    height,
  }
}

/**
 * Converts the location relative to the screen to the location relative to the parent container
 *
 * @export
 * @param {Object} position
 * @param {any} containerPosition
 * @param {any} scrollTop
 */
export function screenRelativeToContainerRelative(position, offset) {
  if (!position.isSet) return position

  position.y -= offset.y
  position.x -= offset.x

  return position
}

/**
 * Split the string, the result contains the separator
 * E.g:
 *    separators:[',','!']
 *    'hello, world! => ['hello,', ' world!']
 * @export
 * @param {string} string
 * @param {Array<string>} [separators=['']]
 */
export function split(string, separators = ['']) {
  const separatorRegStr = separators.reduce((acc, separator) => {
    if (separator === '') return acc
    if (acc === '') return `\\${separator}`
    return `${acc}|\\${separator}`
  }, '')
  const separator = new RegExp(`(${separatorRegStr})`)
  const splitStrings = string.split(separator)
  const resultStrings = []
  for (let i = 0; i < splitStrings.length; i += 2) {
    const mergedStr = splitStrings[i] + (splitStrings[i + 1] || '')
    if (mergedStr.length > 0) {
      resultStrings.push(mergedStr)
    }
  }
  return resultStrings
}

/**
 * Check whether in the rectangle
 *
 * @export
 * @param {number} x
 * @param {number} y
 * @param {ClientRect} rect
 * @returns {boolean}
 */
export function inRectangle(x, y, rect, margin) {
  return rect.top - margin <= y && rect.bottom + margin >= y && rect.left <= x && rect.right >= x
}

export function copyRect(rect) {
  return {
    bottom: rect.bottom,
    height: rect.height,
    left: rect.left,
    right: rect.right,
    top: rect.top,
    width: rect.width,
  }
}
export function domCollectionToArray(collection) {
  const array = []
  for (let i = 0; i < collection.length; i++) {
    array.push(collection[i])
  }
  return array
}

export function matchSubString(originStr = '', subStr = '') {
  let matchSubstr = ''
  const formatSubStr = subStr.replace(/\s+/g, '')
  for (let i = 0, j = 0; i < originStr.length; i++) {
    if (j >= formatSubStr.length) {
      return matchSubstr
    }
    if (originStr[i] === formatSubStr[j]) {
      matchSubstr += originStr[i]
      j++
    } else if (originStr[i].match(/\n|\r|\s/)) {
      if (matchSubstr !== '') {
        matchSubstr += originStr[i]
      }
    } else {
      j = 0
      matchSubstr = ''
    }
  }
  return matchSubstr
}

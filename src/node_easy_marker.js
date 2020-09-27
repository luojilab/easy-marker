import BaseEasyMarker from './base_easy_marker'
import TextNode from './lib/text_node'
import {
  getClickWordsPosition,
  getTouchPosition,
  matchSubString,
  getClickPosition,
} from './lib/helpers'
import { SelectStatus, EasyMarkerMode, DeviceType } from './lib/types'

class NodeEasyMarker extends BaseEasyMarker {
  constructor(options) {
    super(options)
    this.textNode = {
      start: null,
      end: null,
    }
    this.markdown = null
    this.mode = EasyMarkerMode.NODE
    this.touchStartTime = 0
  }
  get start() {
    return this.textNode.start
  }

  get end() {
    return this.textNode.end
  }

  /**
   * Get the selected text
   *
   * @memberof EasyMarker
   * @returns {string}
   */
  getSelectText() {
    const text =
      TextNode.getSelectText(this.textNode.start, this.textNode.end, this.excludeElements) || ''
    return matchSubString(this.container.innerText, text) || text.replace(/\s+/g, '\n')
  }

  static getSelectMarkdown() {
    // TODO: 临时关掉 getMarkdown 方法 稍后处理
    return 'Markdown is not supported in current mode.'
    // return (
    //   this.markdown.getSelectMarkdown(
    //     this.textNode.start.node,
    //     this.textNode.end.node,
    //     this.textNode.start.offset,
    //     this.textNode.end.offset,
    //     this.excludeElements
    //   ).markdown || ''
    // )
  }

  /**
   * Swap the start and end cursors
   *
   * @private
   * @param {any} clickPosition
   * @param {any} currentPosition
   * @memberof EasyMarker
   */
  swapCursor(clickPosition, currentPosition) {
    const { x, y } = currentPosition
    if (this.movingCursor === this.cursor.start) {
      const endPosition = this.cursor.end.position
      if (y > endPosition.y || (y === endPosition.y && x >= endPosition.x)) {
        this.cursor.start.position = this.cursor.end.position
        this.movingCursor = this.cursor.end
        this.textNode.start = new TextNode(
          this.textNode.end.node,
          this.textNode.end.offset,
        )
        this.textNode.end = new TextNode(
          clickPosition.node,
          clickPosition.index,
        )
      } else {
        this.textNode.start = new TextNode(
          clickPosition.node,
          clickPosition.index,
        )
      }
    } else {
      const startPosition = this.cursor.start.position
      if (
        y < startPosition.y ||
        (y === startPosition.y && x <= startPosition.x)
      ) {
        this.cursor.end.position = this.cursor.start.position
        this.movingCursor = this.cursor.start
        this.textNode.end = new TextNode(
          this.textNode.start.node,
          this.textNode.start.offset,
        )
        this.textNode.start = new TextNode(
          clickPosition.node,
          clickPosition.index,
        )
      } else {
        this.textNode.end = new TextNode(
          clickPosition.node,
          clickPosition.index,
        )
      }
    }
  }

  /**
   * Start text selection
   *
   * @private
   * @param {any} element
   * @param {any} x
   * @param {any} y
   * @memberof EasyMarker
   */
  selectWords(element, x, y) {
    const separators = [
      '\u3002\u201D',
      '\uFF1F\u201D',
      '\uFF01\u201D',
      '\u3002',
      '\uFF1F',
      '\uFF01',
    ]
    const {
      rects, node, index, wordsLength,
    } =
      getClickWordsPosition(element, x, y, separators) || {}
    if (!rects || (rects && rects.length === 0)) return
    const startRect = rects[0]
    const endRect = rects[rects.length - 1]
    // start
    const startLeft = startRect.left - this.screenRelativeOffset.x
    const startTop = startRect.top - this.screenRelativeOffset.y
    this.textNode.start = new TextNode(node, index)
    this.cursor.start.height = startRect.height
    this.cursor.start.position = { x: startLeft, y: startTop }

    // end
    const endLeft = endRect.left - this.screenRelativeOffset.x
    const endTop = endRect.top - this.screenRelativeOffset.y
    this.textNode.end = new TextNode(node, index + wordsLength)
    this.cursor.end.height = endRect.height
    this.cursor.end.position = { x: endLeft + endRect.width, y: endTop }

    this.cursor.start.show()
    this.cursor.end.show()

    this.renderMask()
    this.selectStatus = SelectStatus.FINISH
  }

  /**
   * Renders the selected mask layer
   * @private
   * @memberof EasyMarker
   */
  renderMask() {
    this.mask.render(this.textNode.start, this.textNode.end)
  }

  /**
   * Move the cursor to the specified location
   *
   * @private
   * @param {HTMLElement} element
   * @param {number} x Relative to the screen positioning x
   * @param {number} y Relative to the screen positioning Y
   * @memberof EasyMarker
   */
  moveCursor(element, x, y) {
    const clickPosition = getClickPosition(
      element,
      x,
      y,
      this.movingCursor === this.cursor.start,
    )
    if (clickPosition === null) return
    const relativeX = clickPosition.x - this.screenRelativeOffset.x
    const relativeY = clickPosition.y - this.screenRelativeOffset.y
    const unmovingCursor =
      this.movingCursor === this.cursor.start
        ? this.cursor.end
        : this.cursor.start
    if (
      unmovingCursor.position.x === relativeX &&
      unmovingCursor.position.y === relativeY
    ) { return }
    this.swapCursor(clickPosition, { x: relativeX, y: relativeY })

    this.movingCursor.height = clickPosition.height
    this.movingCursor.position = { x: relativeX, y: relativeY }

    this.cursor.start.show()
    this.cursor.end.show()
    this.renderMask()
  }

  /**
   * touchstart event handler
   *
   * @private
   * @param {TouchEvent} e
   * @memberof EasyMarker
   */
  handleTouchStart(e) {
    super.handleTouchStart(e)
    if (this.deviceType === DeviceType.PC) {
      if (this.selectStatus === SelectStatus.FINISH) {
        const isMenuClick = this.menu.inRegion(e)
        const position = this.getTouchRelativePosition(e)
        const startCursorRegion = this.cursor.start.inRegion(position)
        const endCursorRegion = this.cursor.end.inRegion(position)
        if (!isMenuClick && !startCursorRegion.inRegion && !endCursorRegion.inRegion) {
          this.reset()
        }
      }
      if (this.selectStatus === SelectStatus.NONE && this.isContains(e.target)) {
        this.touchStartTime = Date.now()
        const { x, y } = getTouchPosition(e)
        const element = document.elementFromPoint(x, y)
        const clickPosition = getClickPosition(
          element,
          x,
          y,
          this.movingCursor !== this.cursor.start,
        )
        if (clickPosition) {
          this.textNode.start = new TextNode(
            clickPosition.node,
            clickPosition.index,
          )
          if (this.textNode.start) {
            const startLeft = clickPosition.x - this.screenRelativeOffset.x
            const startTop = clickPosition.y - this.screenRelativeOffset.y

            this.cursor.start.height = clickPosition.height
            this.cursor.start.position = { x: startLeft, y: startTop }
          }
        }
      }
    }
  }

  handleTouchMoveThrottle(e) {
    if (this.deviceType === DeviceType.PC) {
      if (this.selectStatus === SelectStatus.NONE && this.textNode.start && !this.textNode.end) {
        if (Date.now() - this.touchStartTime < 100) return
        const { x, y } = getTouchPosition(e)
        const element = document.elementFromPoint(x, y)
        const clickPosition = getClickPosition(
          element,
          x,
          y,
          this.movingCursor === this.cursor.start,
        )
        if (clickPosition) {
          this.textNode.end = new TextNode(
            clickPosition.node,
            clickPosition.index,
          )

          if (this.textNode.end) {
            const endLeft = clickPosition.x - this.screenRelativeOffset.x
            const endTop = clickPosition.y - this.screenRelativeOffset.y

            this.cursor.end.height = clickPosition.height
            this.cursor.end.position = { x: endLeft, y: endTop }
            this.selectStatus = SelectStatus.SELECTING
          }
        }
      }
    }
    super.handleTouchMoveThrottle(e)
  }

  /**
   * copy listener
   *
   * @private
   * @memberof EasyMarker
   */
  copyListener(e) {
    if (this.selectStatus === SelectStatus.FINISH) {
      this.menu.copyListener({
        start: this.textNode.start,
        end: this.textNode.end,
        content: this.getSelectText(),
        markdown: NodeEasyMarker.getSelectMarkdown(),
      }, e)
      this.reset()
    }
  }

  /**
   * Tap event
   *
   * @private
   * @param {TouchEvent} e
   * @memberof EasyMarker
   */
  handleTap(e) {
    if (this.selectStatus === SelectStatus.FINISH) {
      this.menu.handleTap(e, {
        start: this.textNode.start,
        end: this.textNode.end,
        content: this.getSelectText(),
        markdown: NodeEasyMarker.getSelectMarkdown(),
      })
      const position = this.getTouchRelativePosition(e)
      const startCursorRegion = this.cursor.start.inRegion(position)
      const endCursorRegion = this.cursor.end.inRegion(position)
      if (startCursorRegion.inRegion || endCursorRegion.inRegion) return
      this.reset()
    } else if (this.selectStatus === SelectStatus.NONE) {
      const inHighlightLine = this.highlight.handleTap(e)
      if (
        !inHighlightLine &&
        !this.options.disableTapHighlight &&
        !this.options.disableSelect &&
        this.isContains(e.target) &&
        this.deviceType === DeviceType.MOBILE
      ) {
        const { x, y } = getTouchPosition(e)
        this.selectWords(e.target, x, y)
      }
    }
  }

  /**
   * Long press event
   *
   * @private
   * @param {TouchEvent} e
   * @memberof EasyMarker
   */
  handleLongTap(e) {
    if (this.deviceType === DeviceType.MOBILE) {
      if (this.isContains(e.target)) {
        const { x, y } = getTouchPosition(e)
        this.selectWords(e.target, x, y)
      }
    }
  }

  /**
   * touchmove event handler
   *
   * @private
   * @param {TouchEvent} e
   * @memberof EasyMarker
   */
  handleTouchEnd(e) {
    super.handleTouchEnd(e)
    if (this.selectStatus === SelectStatus.SELECTING) {
      this.selectStatus = SelectStatus.FINISH
    }
    if (this.deviceType === DeviceType.PC) {
      if (this.selectStatus === SelectStatus.NONE) {
        this.reset()
      }
    }
  }

  setSelection(selection) {
    this.textNode.start = new TextNode(
      selection.anchorNode,
      selection.anchorOffset,
    )
    this.textNode.end = new TextNode(
      selection.focusNode,
      selection.focusOffset,
    )
  }

  destroy() {
    super.destroy()
    this.textNode = {
      start: null,
      end: null,
    }
    this.markdown = null
    this.mode = EasyMarkerMode.NODE
  }

  reset() {
    super.reset()
    this.textNode = {
      start: null,
      end: null,
    }
  }
}
export default NodeEasyMarker

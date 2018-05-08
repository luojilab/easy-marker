import Cursor, { CursorType } from './element/cursor'
import Menu from './element/menu'
import Mask from './element/mask'
import Highlight from './element/highlight'
import TextNode from './text_node'
import TouchEvent, { EventType } from './touch_event'

import {
  getClickWordsPosition,
  getClickPosition,
  getTouchPosition,
  // getElementAbsolutePosition,
  screenRelativeToContainerRelative,
} from './helpers'

const SelectStatus = {
  NONE: 'none',
  SELECTING: 'selecting',
  FINISH: 'finish',
}

const defaultOptions = {
  menuItems: [],
  menuTopOffset: 0,
}

const preventDefaultCb = e => e.preventDefault()
/**
 * A simple article  marker library
 * @example
 * const em = new EasyMarker({
 *   menuTopOffset:'2rem',
 *   menuItems: [
 *     {
 *       text: '划线笔记',
 *       handler: function (data) {
 *         console.log('划线笔记', data, this)
 *         this.highlightLine(data,1)
 *       }
 *     },
 *     {
 *       text: '分享',
 *       handler: (data) => {console.log('分享',data)}
 *     },
 *     {
 *       text: '复制',
 *       handler: (data) => {console.log('分享',data)}
 *     }
 *   ]
 *  )
 *
 *  em.create(document.querySelector('.article-body'),
 *    document.body,
 *    document.querySelectorAll('.article-body>:not(.text)')
 *
 * @export
 */
class EasyMarker {
  /**
   * Creates an instance of EasyMarker.
   * @param {Object} options options
   * @param {Object[]} options.menuItems menu item option
   * @param {string} options.menuItems[].text menu text
   * @param {EasyMarker~menuClickHandler} options.menuItems[].handler menu item click handler
   * @param {number|string} options.menuTopOffset the offset from the top of the menu relative screen, default 0.
   * @memberof EasyMarker
   */
  constructor(options) {
    this.options = Object.assign({}, defaultOptions, options)
    this.$selectStatus = SelectStatus.NONE
    this.timerHandler = null
    this.container = null
    this.scrollContainer = null
    this.excludeElements = []
    this.highlight = null
    this.movingCursor = null
    this.touchEvent = null
    this.cursor = {
      start: null,
      end: null,
    }
    this.textNode = {
      start: null,
      end: null,
    }
    this.mask = null
    this.menu = null
  }

  // region public fields

  get selectStatus() {
    return this.$selectStatus
  }

  set selectStatus(val) {
    this.$selectStatus = val
    if (val === SelectStatus.FINISH) {
      const top = this.mask.top - (this.movingCursor.height / 2)
      this.menu.setPosition(top, this.mask.top + this.mask.height)
      this.menu.show()
    } else {
      this.menu.hide()
    }
  }

  /**
   * Initialization factory
   *
   * @static
   * @param {HTMLElement} containerElement container element
   * @param {HTMLElement} [scrollContainerElement] scroll container element
   * @param {Array<HTMLElement>} [excludeElements] not included elements
   * @returns {EasyMarker}
   * @memberof EasyMarker
   */
  static create(containerElement, scrollContainerElement, excludeElements) {
    const easyMarker = new this()
    easyMarker.create(containerElement, scrollContainerElement, excludeElements)
    return easyMarker
  }

  /**
   * Initialization
   *
   * @param {HTMLElement} containerElement container element
   * @param {HTMLElement} [scrollContainerElement] scroll container element
   * @param {Array<HTMLElement>} [excludeElements] not included elements
   * @memberof EasyMarker
   */
  create(containerElement, scrollContainerElement, excludeElements) {
    this.container = containerElement
    this.adjustTextStyle()
    this.container.oncontextmenu = (event) => { event.returnValue = false }

    this.excludeElements = [...excludeElements]
    this.scrollContainer = scrollContainerElement || document.body
    this.container.addEventListener('contextmenu', preventDefaultCb)
    this.scrollContainer.onscroll = this.handleScroll.bind(this)
    // this.position.setAll(getElementAbsolutePosition(this.container))

    this.container.style.userSelect = 'none'
    this.container.style.webkitUserSelect = 'none'
    this.container.style.position = 'relative'

    this.touchEvent = new TouchEvent(this.container)
    this.touchEvent.registerEvent(EventType.TOUCH_START, this.handleTouchStart.bind(this))
    this.touchEvent.registerEvent(EventType.TOUCH_MOVE, this.handleTouchMove.bind(this))
    this.touchEvent.registerEvent(EventType.TOUCH_MOVE_THROTTLE, this.handleTouchMoveThrottle.bind(this))
    this.touchEvent.registerEvent(EventType.TOUCH_END, this.handleTouchEnd.bind(this))
    this.touchEvent.registerEvent(EventType.TAP, this.handleTap.bind(this))
    this.touchEvent.registerEvent(EventType.LONG_TAP, this.handleLongTap.bind(this))

    this.cursor.start = new Cursor(this.container, CursorType.START)
    this.cursor.end = new Cursor(this.container, CursorType.END)
    this.movingCursor = this.cursor.end

    this.mask = new Mask(this.container)
    this.highlight = new Highlight(this.container)
    this.menu = new Menu(this.container, { menuItems: this.options.menuItems, topOffset: this.options.menuTopOffset })
    this.menu.easyMarker = this
  }

  /**
   * Get the selected text
   *
   * @memberof EasyMarker
   * @returns {string}
   */
  getSelectText() {
    const text = TextNode.getSelectText(this.textNode.start, this.textNode.end) || ''
    const reg = new RegExp(text.replace(/[\s\S]/g, '$&\\n*'))
    const textWithStyle = this.container.innerText.match(reg)[0]
    return textWithStyle || text
  }

  /**
   * Highlight the lines between the specified nodes
   * @example
   * const id = 2;
   * const selection = {
   *   anchorNode: textNodeA,
   *   anchorOffset: 1,
   *   focusNode: textNodeB,
   *   focusOffset: 2
   * };
   * const meta = { someKey: 'someValue' };
   * em.highlightLine(selection, id, meta);
  * @param {Object} selection selection
  * @param {Node} selection.anchorNode start node
  * @param {number} selection.anchorOffset start node's text offset
  * @param {Node} selection.focusNode end node
  * @param {number} selection.focusOffset start node's text offset
   * @param {*} [id] line id
   * @param {*} [meta] meta information
   * @memberof EasyMarker
   */
  highlightLine(selection, id, meta) {
    this.highlight.highlightLine(selection, id, meta, this.screenRelativeOffset)
  }

  /**
   * Highlight multiple lines
   * @example
   * const id = 2;
   * const selection = {
   *   anchorNode: textNodeA,
   *   anchorOffset: 1,
   *   focusNode: textNodeB,
   *   focusOffset: 2
   * };
   * const meta = { someKey: 'someValue' };
   * em.highlightLines([{selection, id, meta}]);
   * @param {Object[]} lines
   * @param {*} [lines[].id]
   * @param {*} [lines[].meta]
   * @param {Object} lines[].selection
   * @param {Node} lines[].selection.anchorNode
   * @param {number} lines[].selection.anchorOffset
   * @param {Node} lines[].selection.focusNode
   * @param {number} lines[].selection.focusOffset
   * @memberof EasyMarker
   */
  highlightLines(lines) {
    this.highlight.highlightLines(lines, this.screenRelativeOffset)
  }

  /**
   * Cancel highlight
   *
   * @param {*} id line ID
   * @returns {boolean}
   * @memberof EasyMarker
   */
  cancelHighlightLine(id) {
    this.highlight.cancelHighlightLine(id)
  }

  /**
   * Highlight line click handler
   *
   * @param {EasyMarker~highlightLineClickHandler} cb
   * @memberof EasyMarker
   */
  onHighlightLineClick(cb) {
    this.highlight.onClick = cb
  }
  /**
   * Register event hook
   *
   * @param {*} cb
   * @memberof EasyMarker
   */
  registerEventHook(cb) {
    this.touchEvent.registerHook(cb)
  }
  /**
   * Destroy instance
   *
   * @memberof EasyMarker
   */
  destroy() {
    this.container.oncontextmenu = null
    this.container.removeEventListener('contextmenu', preventDefaultCb)
    this.scrollContainer.onscroll = null

    this.touchEvent.destroy()
    this.cursor.start.destroy()
    this.cursor.end.destroy()
    this.mask.destroy()
    this.highlight.destroy()
    this.menu.destroy()

    this.$selectStatus = SelectStatus.NONE
    this.timerHandler = null
    this.container = null
    this.scrollContainer = null
    this.excludeElements = []
    this.highlight = null
    this.movingCursor = null
    this.touchEvent = null
    this.cursor = {
      start: null,
      end: null,
    }
    this.textNode = {
      start: null,
      end: null,
    }
    this.mask = null
    this.menu = null
  }

  reset() {
    this.selectStatus = SelectStatus.NONE
    this.cursor.start.hide()
    this.cursor.end.hide()
    this.textNode = {
      start: null,
      end: null,
    }
    this.mask.reset()
  }

  // endregion

  // region private fields

  /**
   * Screen relative offset
   *
   * @readonly
   * @private
   * @memberof EasyMarker
   */
  get screenRelativeOffset() {
    const { top, left } = this.container.getBoundingClientRect()
    return {
      x: left,
      y: top,
    }
  }
  /**
   *
   * @private
   * @memberof EasyMarker
   */
  adjustTextStyle() {
    const { children } = this.container
    for (let i = 0; i < children.length; i++) {
      children[i].style.zIndex = '5'
      children[i].style.position = 'relative'
    }
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
    const clickPosition = getClickPosition(element, x, y, this.movingCursor === this.cursor.start)
    if (clickPosition === null) return
    const relativeX = clickPosition.x - this.screenRelativeOffset.x
    const relativeY = clickPosition.y - this.screenRelativeOffset.y
    const unmovingCursor = this.movingCursor === this.cursor.start ? this.cursor.end : this.cursor.start
    if (unmovingCursor.position.x === relativeX && unmovingCursor.position.y === relativeY) return

    this.swapCursor(clickPosition, { x: relativeX, y: relativeY })

    this.movingCursor.height = clickPosition.height
    this.movingCursor.position = { x: relativeX, y: relativeY }
    this.renderMask()
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
        this.textNode.start = new TextNode(this.textNode.end.node, this.textNode.end.offset)
        this.textNode.end = new TextNode(clickPosition.node, clickPosition.index)
      } else {
        this.textNode.start = new TextNode(clickPosition.node, clickPosition.index)
      }
    } else {
      const startPosition = this.cursor.start.position
      if (y < startPosition.y || (y === startPosition.y && x <= startPosition.x)) {
        this.cursor.end.position = this.cursor.start.position
        this.movingCursor = this.cursor.start
        this.textNode.end = new TextNode(this.textNode.start.node, this.textNode.start.offset)
        this.textNode.start = new TextNode(clickPosition.node, clickPosition.index)
      } else {
        this.textNode.end = new TextNode(clickPosition.node, clickPosition.index)
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
    const separators = ['。”', '？”', '！”', '。', '？', '！']
    const {
      rects, node, index, wordsLength,
    } = getClickWordsPosition(element, x, y, separators) || {}
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
    const { header, body, footer } = TextNode.getSelectRects(this.textNode.start, this.textNode.end)
    const relativeHeader = screenRelativeToContainerRelative(header, this.screenRelativeOffset)
    const relativeBody = screenRelativeToContainerRelative(body, this.screenRelativeOffset)
    const relativeFooter = screenRelativeToContainerRelative(footer, this.screenRelativeOffset)
    this.mask.render(relativeHeader, relativeBody, relativeFooter)
  }


  /**
   *
   * @private
   * @param {HTMLElement} element
   * @memberof EasyMarker
   */
  isContains(element) {
    return this.container.contains(element) &&
       this.excludeElements.findIndex(el => el.contains(element)) === -1
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
      })
      const position = this.getTouchRelativePosition(e)
      const startCursorRegion = this.cursor.start.inRegion(position)
      const endCursorRegion = this.cursor.end.inRegion(position)
      if (startCursorRegion.inRegion || endCursorRegion.inRegion) return
      this.reset()
    } else if (this.selectStatus === SelectStatus.NONE) {
      const inHighlightLine = this.highlight.handleTap(e)
      if (!inHighlightLine && this.isContains(e.target)) {
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
    if (this.isContains(e.target)) {
      const { x, y } = getTouchPosition(e)
      this.selectWords(e.target, x, y)
    }
  }

  /**
   * touchstart event handler
   *
   * @private
   * @param {TouchEvent} e
   * @memberof EasyMarker
   */
  handleTouchStart(e) {
    if (this.selectStatus === SelectStatus.FINISH) {
      const position = this.getTouchRelativePosition(e)
      const startCursorRegion = this.cursor.start.inRegion(position)
      const endCursorRegion = this.cursor.end.inRegion(position)
      if (startCursorRegion.inRegion && endCursorRegion.inRegion) {
        this.selectStatus = SelectStatus.SELECTING
        this.movingCursor = startCursorRegion.distance < endCursorRegion.distance ?
          this.cursor.start : this.cursor.end
      } else if (endCursorRegion.inRegion) {
        this.selectStatus = SelectStatus.SELECTING
        this.movingCursor = this.cursor.end
      } else if (startCursorRegion.inRegion) {
        this.selectStatus = SelectStatus.SELECTING
        this.movingCursor = this.cursor.start
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
  handleTouchMove(e) {
    if (this.selectStatus === SelectStatus.SELECTING) {
      e.preventDefault()
    }
  }

  /**
   * Throttle event of touchmove
   *
   * @private
   * @param {TouchEvent} e
   * @memberof EasyMarker
   */
  handleTouchMoveThrottle(e) {
    if (this.selectStatus === SelectStatus.SELECTING) {
      const offset = {
        x: 0,
        y: -this.movingCursor.height / 2,
      }
      const { x, y } = getTouchPosition(e, offset)
      const target = document.elementFromPoint(x, y)
      if (this.isContains(target)) {
        this.moveCursor(target, x, y)
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
  handleTouchEnd() {
    clearTimeout(this.timerHandler)
    this.timerHandler = null
    if (this.selectStatus === SelectStatus.SELECTING) {
      this.selectStatus = SelectStatus.FINISH
    }
  }

  /**
   *
   * @private
   * @memberof EasyMarker
   */
  handleScroll() {
    if (this.selectStatus === SelectStatus.FINISH) {
      this.menu.handleScroll()
    }
  }


  getTouchRelativePosition(e) {
    const offset = {
      x: 0,
      y: -this.movingCursor.height / 2,
    }
    const position = getTouchPosition(e, offset)
    position.x -= this.screenRelativeOffset.x
    position.y -= this.screenRelativeOffset.y
    return position
  }

  // endregion
}

export default EasyMarker

/**
 * Menu item click handler
 * @callback EasyMarker~menuClickHandler
 * @param {Object} selection selection
 * @param {Node} selection.anchorNode start node
 * @param {number} selection.anchorOffset start node's text offset
 * @param {Node} selection.focusNode end node
 * @param {number} selection.focusOffset start node's text offset
 */

/**
 * Menu item click handler
 * @callback EasyMarker~highlightLineClickHandler
 * @param {*} id line ID
 * @param {*} meta meta information
 * @param {Object} selection selection
 * @param {Node} selection.anchorNode start node
 * @param {number} selection.anchorOffset start node's text offset
 * @param {Node} selection.focusNode end node
 * @param {number} selection.focusOffset start node's text offset
 */

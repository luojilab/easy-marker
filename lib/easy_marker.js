import Cursor, { CursorType } from './element/cursor'
import Menu from './element/menu'
import Mask from './element/mask'
import Highlight from './element/highlight'
import TextNode from './text_node'
import Markdown from './markdown'
import TouchEvent, { EventType } from './touch_event'

import {
  getClickWordsPosition,
  getClickPosition,
  getTouchPosition,
  // getElementAbsolutePosition,
  matchSubString,
  screenRelativeToContainerRelative,
  anyToPx,
} from './helpers'

const SelectStatus = {
  NONE: 'none',
  SELECTING: 'selecting',
  FINISH: 'finish',
}

const defaultOptions = {
  menuItems: [],
  menuTopOffset: 0,
  cursor: {
    same: false,
  },
  scrollOffsetBottom: 100,
  scrollSpeedLevel: 4,
}

const preventDefaultCb = e => e.preventDefault()
/**
 * A simple article  marker library
 * @example
 * // A simple example
 * const em = new EasyMarker({
 *   menuTopOffset: '2rem',
 *   menuItems: [
 *     {
 *       text: '划线笔记',
 *       id: 1
 *     },
 *     {
 *       text: '分享',
 *       style: {
 *         backgroundColor: '#407ff2',
 *         paddingLeft: '0.5rem'
 *       },
 *       id: 2
 *     },
 *     {
 *       text: '复制',
 *       id: 3
 *     }
 *   ],
 *   menuHandler: (id, data) => {
 *      console.log('You click the menu!');
 *      console.log(id, data);
 *   },
 *  )
 *
 *  em.create(document.querySelector('.article-body'),
 *    document.body,
 *    document.querySelectorAll('.article-body>:not(.text)')
 *
 * // a markdown example
 * const em = new EasyMarker({
 * menuTopOffset:'2rem',
 * scrollSpeedLevel: 6,
 * scrollOffsetBottom: '1.5rem',
 *   menuItems: [
 *     {
 *       text: '划线笔记',
 *       id: 1,
 *       iconClassList:['iconfont', 'icon-mark']
 *     },
 *     {
 *       text: '分享',
 *       style: {
 *         backgroundColor: '#407ff2',
 *         paddingLeft: '0.5rem'
 *       },
 *       id: 2,
 *       iconClassList:['iconfont', 'icon-share']
 *     },
 *     {
 *       text: '复制',
 *       id: 3,
 *       iconClassList:['iconfont', 'icon-copy'],
 *     }
 *   ],
 *   menuHandler: (id, data) => {
 *      console.log('You click the menu!');
 *      console.log(id, data);
 *   },
 * // Not required
 *  markdownOptions: {
 *   H1: text => `\n# ${text}\n\n`,
 *   H2: text => `\n## ${text}\n\n`,
 *   H3: text => `\n### ${text}\n\n`,
 *   H4: text => `\n#### ${text}\n\n`,
 *   H5: text => `\n##### ${text}\n\n`,
 *   H6: text => `\n###### ${text}\n\n`,
 *   P: text => `${text}\n\n`,
 *   FIGCAPTION: text => `${text}\n\n`,
 *   STRONG: text => `**${text}**`,
 *   B: text => `**${text}**`,
 *   EM: text => `*${text}*`,
 *   I: text => `*${text}*`,
 *   S: text => `~~${text}~~`,
 *   INS: text => `++${text}++`,
 *   // IMG
 *   // option.alt: IMG alt
 *   // option.src: IMG src
 *   // option.width: IMG width
 *   // option.height: IMG height
 *   IMG: option => `![${option.alt}](${option.src}?size=${option.width}x${option.height})\n`,
 *   // UL
 *   // option.listLevel: List nesting level
 *   UL: (text, option) => {
 *     if (option.listLevel > 1) {
 *       return `\n${text}`
 *     }
 *     return `\n${text}\n`
 *   },
 *   // OL
 *   // option.listLevel: List nesting level
 *   OL: (text, option) => {
 *     if (option.listLevel > 1) {
 *       return `\n${text}`
 *     }
 *     return `\n${text}\n`
 *   },
 *   // LI
 *   // option.type: parentNode nodeName,
 *   // option.isLastOne: Whether the last item in the list
 *   // option.itemLevel: List nesting level
 *   // option.hasChild: Is the node has child node
 *   // option.index: The index in the list
 *   LI: (text, option) => {
 *     let spaceString = ''
 *     for (let i = 1; i < option.itemLevel; i++) { spaceString += '    ' }
 *     let endString = '\n'
 *     if (option.hasChild || option.isLastOne) {
 *       endString = ''
 *     }
 *     if (option.type === 'UL') { return `${spaceString}- ${text}${endString}` }
 *     return `${spaceString}${option.index}. ${text}${endString}`
 *   },
 *  }
 * })
 *
 * em.create(document.querySelector('.article-body'), document.body)
 *
 * @export
 */
class EasyMarker {
  /**
   * Creates an instance of EasyMarker.
   * @param {Object} options options
   * @param {Object[]} options.menuItems menu item option
   * @param {string} options.menuItems[].text menu text
   * @param {string[]} options.menuItems[].iconClassList menu icon class list
   * @param {string} options.menuItems[].style menu item style
   * @param {EasyMarker~menuClickHandler} options.menuHandler menu item click handler
   * @param {number|string} options.menuTopOffset the offset from the top of the menu relative screen, default 0.
   * @param {Object} options.menuStyle the menu style
   * @param {Object} options.menuStyle.menu the menu style
   * @param {Object} options.menuStyle.triangle the triangle style
   * @param {Object} options.menuStyle.item the sub menu style
   * @param {Object} options.disableTapHighlight disable highlight when tap
   * @param {Object} options.cursor cursor config
   * @param {Object} options.cursor.color cursor color
   * @param {Object} options.cursor.same whether the cursor is in the same direction
   * @param {Object} options.mask mask config
   * @param {Object} options.mask.color mask color
   * @param {Object} options.highlight highlight config
   * @param {Object} options.highlight.color highlight color
   * @param {number} options.scrollSpeedLevel The speed of scrolling when touching bottom, default 4
   * @param {number|string} options.scrollOffsetBottom The distance from the bottom when triggering scrolling，default 100
   * @param {Object} options.markdownOptions Customize options about the mapping relations between HTML and Markdown
   * @memberof EasyMarker
   */
  constructor(options) {
    this.options = Object.assign({}, defaultOptions, options)
    this.$selectStatus = SelectStatus.NONE
    this.windowHeight = null
    this.container = null
    this.scrollContainer = null
    this.excludeElements = []
    this.highlight = null
    this.movingCursor = null
    this.touchEvent = null
    this.scrollInterval = null
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
    this.markdown = null
    this.scrollOffsetBottom = null
    this.scrollSpeedLevel = null
    this.selectStatusChangeHandler = () => {}
  }

  get selectStatus() {
    return this.$selectStatus
  }

  set selectStatus(val) {
    if (val !== this.$selectStatus) {
      this.selectStatusChangeHandler(val)
    }
    this.$selectStatus = val
    if (val === SelectStatus.FINISH) {
      const top = this.mask.top - this.movingCursor.height / 2
      const { left } = this.mask
      this.menu.setPosition(top, this.mask.top + this.mask.height, left)
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
  static create(
    containerElement,
    scrollContainerElement,
    excludeElements = [],
  ) {
    const easyMarker = new this()
    easyMarker.create(
      containerElement,
      scrollContainerElement,
      excludeElements,
    )
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
  create(containerElement, scrollContainerElement, excludeElements = []) {
    this.container = containerElement
    this.adjustTextStyle()
    this.container.oncontextmenu = (event) => {
      event.returnValue = false
    }

    this.windowHeight = document.documentElement.clientHeight
    this.excludeElements = [...excludeElements]
    this.scrollContainer = scrollContainerElement || document.body
    this.container.addEventListener('contextmenu', preventDefaultCb)
    this.scrollContainer.onscroll = this.handleScroll.bind(this)
    // this.position.setAll(getElementAbsolutePosition(this.container))

    this.container.style.userSelect = 'none'
    this.container.style.webkitUserSelect = 'none'
    this.container.style.position = 'relative'

    this.touchEvent = new TouchEvent(this.container)
    this.touchEvent.registerEvent(
      EventType.TOUCH_START,
      this.handleTouchStart.bind(this),
    )
    this.touchEvent.registerEvent(
      EventType.TOUCH_MOVE,
      this.handleTouchMove.bind(this),
    )
    this.touchEvent.registerEvent(
      EventType.TOUCH_MOVE_THROTTLE,
      this.handleTouchMoveThrottle.bind(this),
    )
    this.touchEvent.registerEvent(
      EventType.TOUCH_END,
      this.handleTouchEnd.bind(this),
    )
    this.touchEvent.registerEvent(EventType.TAP, this.handleTap.bind(this))
    this.touchEvent.registerEvent(
      EventType.LONG_TAP,
      this.handleLongTap.bind(this),
    )

    const CursorElement =
      this.options.cursor && this.options.cursor.Cursor
        ? this.options.cursor.Cursor
        : Cursor

    if (this.options.cursor.same) {
      this.cursor.start = new CursorElement(
        this.container,
        CursorType.END,
        this.options.cursor || {},
      )
    } else {
      this.cursor.start = new CursorElement(
        this.container,
        CursorType.START,
        this.options.cursor || {},
      )
    }
    this.cursor.end = new CursorElement(
      this.container,
      CursorType.END,
      this.options.cursor || {},
    )
    this.movingCursor = this.cursor.end

    this.mask = new Mask(this.container, this.options.mask || {})
    this.highlight = new Highlight(
      this.container,
      this.options.highlight || {},
    )
    this.menu = new Menu(this.container, {
      menuHandler: this.options.menuHandler,
      menuItems: this.options.menuItems,
      topOffset: this.options.menuTopOffset,
      style: this.options.menuStyle,
    })
    this.menu.easyMarker = this
    this.markdown = new Markdown(this.container, this.options.markdownOptions)
    this.scrollOffsetBottom = anyToPx(this.options.scrollOffsetBottom)
    this.scrollSpeedLevel = this.options.scrollSpeedLevel
  }

  /**
   * Get the selected text
   *
   * @memberof EasyMarker
   * @returns {string}
   */
  getSelectText() {
    const text =
      TextNode.getSelectText(this.textNode.start, this.textNode.end) || ''
    return matchSubString(this.container.innerText, text) || text
  }

  getSelectMarkdown() {
    return (
      this.markdown.getSelectMarkdown(
        this.textNode.start.node,
        this.textNode.end.node,
        this.textNode.start.offset,
        this.textNode.end.offset,
      ).markdown || ''
    )
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
    this.highlight.highlightLine(
      selection,
      id,
      meta,
      this.screenRelativeOffset,
    )
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
   * Select status changing callback
   *
   * @param {Function} cb
   * @memberof EasyMarker
   */
  onSelectStatusChange(cb) {
    this.selectStatusChangeHandler = cb
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
    const { header, body, footer } = TextNode.getSelectRects(
      this.textNode.start,
      this.textNode.end,
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
    this.mask.render(relativeHeader, relativeBody, relativeFooter)
  }

  /**
   *
   * @private
   * @param {HTMLElement} element
   * @memberof EasyMarker
   */
  isContains(element) {
    return (
      this.container.contains(element) &&
      this.excludeElements.findIndex(el => el.contains(element)) === -1
    )
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
        markdown: this.getSelectMarkdown(),
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
        this.isContains(e.target)
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
        this.movingCursor =
          startCursorRegion.distance < endCursorRegion.distance
            ? this.cursor.start
            : this.cursor.end
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
      const offset = this.movingCursor.offset || {
        x: 0,
        y: -this.movingCursor.height / 2,
      }
      const targetY = e.clientY || e.changedTouches[0].clientY
      if (targetY >= this.windowHeight - this.scrollOffsetBottom) {
        if (this.scrollInterval !== null) clearInterval(this.scrollInterval)
        const rate =
          ((targetY - this.windowHeight + this.scrollOffsetBottom) *
            this.scrollSpeedLevel) /
          this.scrollOffsetBottom
        this.scrollInterval = setInterval(() => {
          this.scrollContainer.scrollTop += rate
          document.documentElement.scrollTop += rate
        }, 1)
      } else {
        clearInterval(this.scrollInterval)
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
    if (this.selectStatus === SelectStatus.SELECTING) {
      if (this.scrollInterval) {
        clearInterval(this.scrollInterval)
        this.scrollInterval = null
      }
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
 * @param {*} id menu ID
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

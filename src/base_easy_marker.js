import Cursor, { CursorType } from './element/cursor'
import Menu from './element/menu'
import Mask from './element/mask'
import Highlight from './element/highlight'

import Markdown from './lib/markdown'
import TouchEvent, { EventType } from './lib/touch_event'

import {
  getTouchPosition,
  anyToPx,
  getTouch,
  isMobile,
} from './lib/helpers'
import { SelectStatus } from './lib/types'

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
 *       iconName:'iconfont icon-mark'
 *     },
 *     {
 *       text: '分享',
 *       style: {
 *         backgroundColor: '#407ff2',
 *         paddingLeft: '0.5rem'
 *       },
 *       id: 2,
 *       iconName:'iconfont icon-share'
 *     },
 *     {
 *       text: '复制',
 *       id: 3,
 *       iconName:'iconfont icon-copy'
 *     }
 *   ],
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
 * em.onMenuClick((id, data) => {
 *   console.log('You click the menu!');
 *   console.log(id, data);
 * });
 *
 * @export
 */
class EasyMarker {
  /**
   * Creates an instance of EasyMarker.
   * @param {Object} options options
   * @param {Object[]} options.menuItems menu item option
   * @param {string} options.menuItems[].text menu text
   * @param {string[]} options.menuItems[].iconName menu icon class
   * @param {Object} options.menuItems[].style menu item style
   * @param {Object} options.menuItems[].iconStyle menu item icon style
   * @param {number|string} options.menuTopOffset the offset from the top of the menu relative screen, default 0.
   * @param {Object} options.menuStyle the menu style
   * @param {Object} options.menuStyle.menu the menu style
   * @param {Object} options.menuStyle.triangle the triangle style
   * @param {Object} options.menuStyle.item the sub menu style
   * @param {Object} options.menuStyle.icon the sub menu icon style
   * @param {boolean} options.disableTapHighlight disable highlight when tap
   * @param {Object} options.cursor cursor config
   * @param {string} options.cursor.color cursor color
   * @param {boolean} options.cursor.same whether the cursor is in the same direction
   * @param {Object} options.mask mask config
   * @param {string} options.mask.color mask color
   * @param {Object} options.highlight highlight config
   * @param {string} options.highlight.color highlight color
   * @param {number} options.scrollSpeedLevel The speed of scrolling when touching bottom, default 4
   * @param {number|string} options.scrollOffsetBottom triggering scrolling, distance from the bottom, default 100
   * @param {Object} options.markdownOptions Customize options about the mapping relations between HTML and Markdown
   */
  constructor(options) {
    this.options = Object.assign({}, defaultOptions, options)
    this.$selectStatus = SelectStatus.NONE
    this.windowHeight = null
    this.container = null
    this.scrollContainer = null
    this.excludeElements = []
    this.includeElements = []
    this.highlight = null
    this.movingCursor = null
    this.touchEvent = null
    this.scrollInterval = null
    this.cursor = {
      start: null,
      end: null,
    }

    this.mask = null
    this.menu = null
    this.scrollOffsetBottom = null
    this.scrollSpeedLevel = null
    this.containerScroll = null
    this.isMobile = isMobile()
    this.selectStatusChangeHandler = () => {}
    this.menuOnClick = () => {}
    this.highlightLineClick = () => {}
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
      const cursorOffset = this.isMobile ? this.movingCursor.height / 2 : 0
      const top = this.mask.top - cursorOffset
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
   * @param {Object} options options
   * @param {Object} options.includeElements included elements
   * @param {Object} options.excludeElements not included elements, Higher priority
   * @returns {EasyMarker}
   * @memberof EasyMarker
   */
  static create(
    containerElement,
    scrollContainerElement,
    options = [],
  ) {
    const easyMarker = new this()
    easyMarker.create(
      containerElement,
      scrollContainerElement,
      options,
    )
    return easyMarker
  }

  /**
   * Initialization
   *
   * @param {HTMLElement} containerElement container element
   * @param {HTMLElement} [scrollContainerElement] scroll container element
   * @param {Object} options options
   * @param {Object} options.includeElements included elements
   * @param {Object} options.excludeElements not included elements, Higher priority
   * @memberof EasyMarker
   */
  create(containerElement, scrollContainerElement, options = []) {
    this.container = containerElement
    this.adjustTextStyle()
    this.container.oncontextmenu = (event) => {
      event.returnValue = false
    }

    this.windowHeight = document.documentElement.clientHeight
    if (options.constructor === Object) {
      this.excludeElements = options.excludeElements ? [...options.excludeElements] : []
      this.includeElements = options.includeElements ? [...options.includeElements] : [containerElement]
    } else {
      // deprecated
      // Compatible with older versions,options equivalent to excludeElements
      this.excludeElements = [...options]
      this.includeElements = [containerElement]
    }
    this.scrollContainer = scrollContainerElement || document.body
    this.container.addEventListener('contextmenu', preventDefaultCb)
    if (this.scrollContainer === document.body) {
      this.scrollContainer.onscroll = this.handleScroll.bind(this)
    } else {
      this.containerScroll = () => {
        this.handleScroll()
      }
      this.scrollContainer.addEventListener('scroll', this.containerScroll)
    }
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
        Object.assign({ mode: this.mode }, this.options.cursor || {})
      )
    } else {
      this.cursor.start = new CursorElement(
        this.container,
        CursorType.START,
        Object.assign({ mode: this.mode }, this.options.cursor || {})
      )
    }
    this.cursor.end = new CursorElement(
      this.container,
      CursorType.END,
      this.options.cursor || {},
    )
    this.movingCursor = this.cursor.end

    this.mask = new Mask(this.container, Object.assign({ mode: this.mode }, this.options.mask || {}))
    this.highlight = new Highlight(
      this.container,
      Object.assign({ mode: this.mode }, this.options.highlight || {}),
    )
    this.menu = new Menu(this.container, {
      menuItems: this.options.menuItems,
      topOffset: this.options.menuTopOffset,
      style: this.options.menuStyle,
      mode: this.mode,
    })
    this.menu.easyMarker = this
    this.highlight.easyMarker = this
    this.markdown = new Markdown(this.container, this.options.markdownOptions)
    this.scrollOffsetBottom = anyToPx(this.options.scrollOffsetBottom)
    this.scrollSpeedLevel = this.options.scrollSpeedLevel
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
    this.highlightLineClick = cb
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
   * menu item click handler
   *
   * @param {EasyMarker~menuClickHandler} cb
   * @memberof EasyMarker
   */
  onMenuClick(cb) {
    // this.menu.handler = cb
    this.menuOnClick = cb
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
    if (this.containerScroll !== null) {
      this.scrollContainer.removeEventListener('scroll', this.containerScroll)
      this.containerScroll = null
    }
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
    // TODO base的destroy去触发各自的destroy
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
   *
   * @private
   * @param {HTMLElement} element
   * @memberof EasyMarker
   */
  isContains(element) {
    // exclude > include
    return (
      this.includeElements.findIndex(el => el.contains(element)) !== -1 &&
      this.excludeElements.findIndex(el => el.contains(element)) === -1
    )
  }

  /**
   * Long press event
   *
   * @private
   * @param {TouchEvent} e
   * @memberof EasyMarker
   */
  handleLongTap() { // eslint-disable-line class-methods-use-this
  }

  /**
   * Tap event
   *
   * @private
   * @param {TouchEvent} e
   * @memberof EasyMarker
   */
  handleTap() { // eslint-disable-line class-methods-use-this
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
    // 拖着cursor走的逻辑
    if (this.selectStatus === SelectStatus.SELECTING) {
      const cursorOffset = this.isMobile ? this.movingCursor.height / 2 : 0
      const offset = this.movingCursor.offset || {
        x: 0,
        y: -cursorOffset,
      }
      const touch = getTouch(e)
      const targetY = e.clientY || touch.clientY
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
    }
  }

  /**
   * handleScroll
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
    const cursorOffset = this.isMobile ? this.movingCursor.height / 2 : 0
    const offset = {
      x: 0,
      y: -cursorOffset,
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

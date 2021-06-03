import BaseEasyMarker from './base_easy_marker'
import { SelectStatus, EasyMarkerMode, DeviceType } from './lib/types'
import Region from './lib/region'

class RegionEasyMarker extends BaseEasyMarker {
  constructor(options) {
    super(options)
    this.selectRegion = {
      start: null,
      end: null,
    }
    this.region = new Region(options.regions || [])
    this.mode = EasyMarkerMode.REGION
    this.touchStartTime = 0
  }
  get start() {
    return this.selectRegion.start
  }

  get end() {
    return this.selectRegion.end
  }
  /**
   * Update Regions
   *
   * @memberof EasyMarker
   * @returns {string}
   */
  setRegions(regions) {
    this.region.setRegions(regions)
  }

  /**
   * Get the selected text
   *
   * @memberof EasyMarker
   * @returns {string}
   */
  getSelectText() {
    const text = this.region.getText(this.selectRegion.start, this.selectRegion.end) || ''
    return text
  }

  // eslint-disable-next-line class-methods-use-this
  getSelectMarkdown() {
    return RegionEasyMarker.getSelectMarkdown()
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
        const position = this.getTouchRelativePosition(e)
        this.selectRegion.start = this.region.getRegionByPoint(position, true)
        if (this.selectRegion.start) {
          const { height: lineHeight } = this.region.getLineInfoByRegion(this.selectRegion.start)
          this.cursor.start.height = lineHeight
          this.cursor.start.position = { x: this.selectRegion.start.left, y: this.selectRegion.start.top }
        }
      }
    }
  }
  handleTouchMoveThrottle(e) {
    if (this.deviceType === DeviceType.PC) {
      if (this.selectStatus === SelectStatus.NONE && this.selectRegion.start && !this.selectRegion.end) {
        if (Date.now() - this.touchStartTime < 100) return
        const position = this.getTouchRelativePosition(e)
        this.selectRegion.end = this.region.getRegionByPoint(position)
        if (this.selectRegion.end) {
          const { height: lineHeight } = this.region.getLineInfoByRegion(this.selectRegion.end)
          this.cursor.end.height = lineHeight
          this.cursor.end.position = {
            x: this.selectRegion.end.left + this.selectRegion.end.width,
            y: this.selectRegion.end.top,
          }
          this.selectStatus = SelectStatus.SELECTING
        }
      }
    }
    super.handleTouchMoveThrottle(e)
  }

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

  /**
   * copy listener
   *
   * @private
   * @memberof EasyMarker
   */
  copyListener(e) {
    if (this.selectStatus === SelectStatus.FINISH) {
      this.menu.copyListener(
        {
          start: this.selectRegion.start,
          end: this.selectRegion.end,
          content: this.getSelectText(),
          markdown: this.getSelectMarkdown(),
        },
        e
      )
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
        start: this.selectRegion.start,
        end: this.selectRegion.end,
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
        !this.options.disableSelect &&
        this.isContains(e.target) &&
        this.deviceType === DeviceType.MOBILE
      ) {
        const position = this.getTouchRelativePosition(e)
        this.selectThisSentence(position)
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
        const position = this.getTouchRelativePosition(e)
        this.selectThisSentence(position)
      }
    }
  }
  selectThisSentence(position) {
    const { start, end } = this.region.getSentenceByPosition(position)
    this.selectRegion = {
      start,
      end,
    }
    this.cursor.start.height = this.region.getLineInfoByRegion(this.selectRegion.start).height
    this.cursor.start.position = { x: this.selectRegion.start.left, y: this.selectRegion.start.top }
    // { height: lineHeight } = this.region.getLineInfoByRegion(this.selectRegion.end)
    this.cursor.end.height = this.region.getLineInfoByRegion(this.selectRegion.end).height
    this.cursor.end.position = {
      x: this.selectRegion.end.left + this.selectRegion.end.width,
      y: this.selectRegion.end.top,
    }
    this.cursor.start.show()
    this.cursor.end.show()

    this.renderMask()
    this.selectStatus = SelectStatus.FINISH
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
    const relativeX = x - this.screenRelativeOffset.x
    const relativeY = y - this.screenRelativeOffset.y
    // const relativePosition = this.getTouchRelativePosition({ x, y })
    const clickRegion = this.region.getRegionByPoint({ x: relativeX, y: relativeY })
    if (!clickRegion) return
    const unmovingCursor = this.movingCursor === this.cursor.start ? this.cursor.end : this.cursor.start
    if (unmovingCursor.position.x === relativeX && unmovingCursor.position.y === relativeY) {
      return
    }

    this.swapCursor(clickRegion, { x: relativeX, y: relativeY })
    const { height: lineHeight } = this.region.getLineInfoByRegion(clickRegion)
    if (this.movingCursor === this.cursor.start) {
      this.movingCursor.height = lineHeight
      this.movingCursor.position = {
        x: clickRegion.left,
        y: clickRegion.top,
      }
    } else {
      this.movingCursor.height = lineHeight
      this.movingCursor.position = {
        x: clickRegion.left + clickRegion.width,
        y: clickRegion.top,
      }
    }

    this.cursor.start.show()
    this.cursor.end.show()
    this.renderMask()
  }

  /**
   * Swap the start and end cursors
   *
   * @private
   * @param {any} clickRegion
   * @param {any} currentPosition
   * @memberof EasyMarker
   */
  swapCursor(clickRegion) {
    if (this.movingCursor === this.cursor.start) {
      if (clickRegion.originalIndex > this.selectRegion.end.originalIndex) {
        this.cursor.start.position = this.cursor.end.position
        this.movingCursor = this.cursor.end
        this.selectRegion.start = this.region.getNextRegion(this.selectRegion.end)
        this.selectRegion.end = clickRegion
      } else {
        this.selectRegion.start = clickRegion
      }
    } else {
      // eslint-disable-next-line no-lonely-if
      if (clickRegion.originalIndex < this.selectRegion.start.originalIndex) {
        this.cursor.end.position = this.cursor.start.position
        this.movingCursor = this.cursor.start
        this.selectRegion.end = this.region.getPreviousRegion(this.selectRegion.start)
        this.selectRegion.start = clickRegion
      } else {
        this.selectRegion.end = clickRegion
      }
    }
  }

  renderMask() {
    this.mask.render(this.selectRegion.start, this.selectRegion.end)
  }

  setSelection(selection) {
    this.selectRegion.start = selection.start
    this.selectRegion.end = selection.end
  }

  reset() {
    super.reset()
    this.selectRegion = {
      start: null,
      end: null,
    }
  }

  destroy() {
    super.destroy()
    this.selectRegion = {
      start: null,
      end: null,
    }
    this.region.destroy()
    this.region = null
    this.mode = EasyMarkerMode.REGION
    this.touchStartTime = 0
  }

  static getSelectMarkdown() {
    return 'Markdown is not supported in current mode.'
  }
}
export default RegionEasyMarker

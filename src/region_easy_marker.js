import BaseEasyMarker from './base_easy_marker'
// import {
// getClickWordsPosition,
// getTouchPosition,
// matchSubString,
// screenRelativeToContainerRelative,
// getTouch,
// } from './lib/helpers'
import { SelectStatus, EasyMarkerMode } from './lib/types'
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
  }
  // TODO: update Region

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

  /**
   * touchstart event handler
   *
   * @private
   * @param {TouchEvent} e
   * @memberof EasyMarker
   */
  handleTouchStart(e) {
    super.handleTouchStart(e)
    if (this.selectStatus === SelectStatus.NONE) {
      const position = this.getTouchRelativePosition(e)
      this.selectRegion.start = this.region.getRegionByPoint(position)
      if (this.selectRegion.start) {
        const { height: lineHeight } = this.region.getLineInfoByRegion(this.selectRegion.start)
        this.cursor.start.height = lineHeight
        this.cursor.start.position = { x: this.selectRegion.start.left, y: this.selectRegion.start.top }
      }
    }
  }
  handleTouchMoveThrottle(e) {
    super.handleTouchMoveThrottle(e)
    if (this.selectStatus === SelectStatus.NONE && this.selectRegion.start) {
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

  handleTouchEnd(e) {
    super.handleTouchEnd(e)
    if (this.selectStatus === SelectStatus.SELECTING) {
      this.selectStatus = SelectStatus.FINISH
    } else {
      this.selectStatus = SelectStatus.NONE
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
        markdown: RegionEasyMarker.getSelectMarkdown(),
      })
      const position = this.getTouchRelativePosition(e)
      const startCursorRegion = this.cursor.start.inRegion(position)
      const endCursorRegion = this.cursor.end.inRegion(position)
      if (startCursorRegion.inRegion || endCursorRegion.inRegion) return
      this.reset()
    } else if (this.selectStatus === SelectStatus.NONE) {
      // TODO 点击highlight
      // const inHighlightLine = this.highlight.handleTap(e)
      // TODO 等同于长按 pc或许可以忽略
      // if (
      //   !inHighlightLine &&
      //   !this.options.disableTapHighlight &&
      //   this.isContains(e.target)
      // ) {
      //   const { x, y } = getTouchPosition(e)
      //   this.selectWords(e.target, x, y)
      // }
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
    const relativeX = x - this.screenRelativeOffset.x
    const relativeY = y - this.screenRelativeOffset.y
    // const relativePosition = this.getTouchRelativePosition({ x, y })
    const clickRegion = this.region.getRegionByPoint({ x: relativeX, y: relativeY })
    if (!clickRegion) return
    const unmovingCursor =
      this.movingCursor === this.cursor.start
        ? this.cursor.end
        : this.cursor.start
    if (
      unmovingCursor.position.x === relativeX &&
      unmovingCursor.position.y === relativeY
    ) { return }

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
  swapCursor(clickRegion, currentPosition) {
    const { x, y } = currentPosition
    if (this.movingCursor === this.cursor.start) {
      const endPosition = this.cursor.end.position
      if (y > endPosition.y || (y === endPosition.y && x >= endPosition.x)) {
        this.cursor.start.position = this.cursor.end.position
        this.movingCursor = this.cursor.end
        this.selectRegion.start = this.region.getNextRegion(this.selectRegion.end)
        this.selectRegion.end = clickRegion
      } else {
        this.selectRegion.start = clickRegion
      }
    } else {
      const startPosition = this.cursor.start.position
      if (
        y < startPosition.y ||
        (y === startPosition.y && x <= startPosition.x)
      ) {
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
    const rects = this.region.getRects(this.selectRegion.start, this.selectRegion.end)
    this.mask.renderRectsLine(rects)
  }
  reset() {
    super.reset()
    this.selectRegion = {
      start: null,
      end: null,
    }
  }
  // TODO: 需确认这个relative在pc中是否不需要
  adjustTextStyle() {
    const { children } = this.container
    for (let i = 0; i < children.length; i++) {
      children[i].style.zIndex = '5'
      // children[i].style.position = 'relative'
    }
  }

  static getSelectMarkdown() {
    return 'Markdown is not supported in current mode.'
  }
}
export default RegionEasyMarker

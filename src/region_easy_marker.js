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
        this.selectStatus = SelectStatus.SELECTING
      }
    }
    // 在none状态 按下同时记录开始点 move更新点 end的时候 如果没有end点又恢复none状态 有的话用finish状态
  }
  handleTouchMoveThrottle(e) {
    super.handleTouchMoveThrottle(e)
    if (this.selectStatus === SelectStatus.SELECTING) {
      // 这个走的应该是直接划的逻辑 不是拖动cursor的逻辑
      // 还是需要走cursor的逻辑呀 因为存在交换cursor的问题 拖start 和 end 的逻辑应该不同
      const position = this.getTouchRelativePosition(e)
      this.selectRegion.end = this.region.getRegionByPoint(position)
      if (this.selectRegion.end) {
        const { height: lineHeight } = this.region.getLineInfoByRegion(this.selectRegion.end)
        this.cursor.end.height = lineHeight
        this.cursor.end.position = {
          x: this.selectRegion.end.left + this.selectRegion.end.width,
          y: this.selectRegion.end.top,
        }
        this.cursor.start.show()
        this.cursor.end.show()

        this.renderMask()
      }
    }
  }

  handleTouchEnd(e) {
    super.handleTouchEnd(e)
    if (this.selectStatus === SelectStatus.SELECTING) {
      if (this.selectRegion.end) {
        this.selectStatus = SelectStatus.FINISH
      } else {
        this.selectStatus = SelectStatus.NONE
        this.reset()
      }
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
  // eslint-disable-next-line class-methods-use-this
  moveCursor(element, x, y) {
    console.log('moveCursor', element, x, y)
  //   const clickRegion = getClickPosition(
  //     element,
  //     x,
  //     y,
  //     this.movingCursor === this.cursor.start,
  //   )
  //   if (clickRegion === null) return
  //   const relativeX = clickRegion.x - this.screenRelativeOffset.x
  //   const relativeY = clickRegion.y - this.screenRelativeOffset.y
  //   const unmovingCursor =
  //     this.movingCursor === this.cursor.start
  //       ? this.cursor.end
  //       : this.cursor.start
  //   if (
  //     unmovingCursor.position.x === relativeX &&
  //     unmovingCursor.position.y === relativeY
  //   ) { return }

  //   this.swapCursor(clickRegion, { x: relativeX, y: relativeY })

  //   this.movingCursor.height = clickRegion.height
  //   this.movingCursor.position = { x: relativeX, y: relativeY }
  //   this.renderMask()
  }
  renderMask() {
    console.log('render mask', this.selectRegion)
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

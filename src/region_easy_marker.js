import BaseEasyMarker from './base_easy_marker'
import TextNode from './lib/text_node'
import {
  getClickWordsPosition,
  getTouchPosition,
  matchSubString,
  screenRelativeToContainerRelative,
} from './lib/helpers'
import { SelectStatus, EasyMarkerMode } from './lib/types'
import Region from './lib/region'

class NodeEasyMarker extends BaseEasyMarker {
  constructor(options) {
    super(options)
    // this.textNode = {
    //   start: null,
    //   end: null,
    // }
    // this.markdown = null
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
}
export default NodeEasyMarker

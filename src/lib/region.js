import { BSearchUpperBound } from './helpers'

export default class Region {
  constructor(list) {
    this.originalRegionList = list
    this.lineRectRegionList = []
    // region demo
    // {
    //   text: '', required
    //   width: '', required
    //   height: '', required
    //   left: '', required
    //   top: '', required
    //   offset: 0,  没用
    //   phase: 0,  没用
    // }

    this.initRectRegion()
  }
  // 预处理数据
  initRectRegion() {
    const lineRectRegion = {
      top: 0,
      bottom: 0,
      left: 0,
      height: 0,
      width: 0,
      regions: [],
    }
    let lineIndex = 0
    let columnIndex = 0
    this.originalRegionList.forEach((region, index) => {
      const {
        top, height, left,
      } = region

      if (lineRectRegion.regions.length === 0) {
        columnIndex = 0
        lineRectRegion.top = top
        lineRectRegion.bottom = top + height
        lineRectRegion.left = left
        lineRectRegion.height = height
        lineRectRegion.regions.push(Object.assign({ originalIndex: index, lineIndex, columnIndex }, region))
      } else if (
        Region.isSameLine({ top: lineRectRegion.top, height: lineRectRegion.bottom - lineRectRegion.top }, region)
      ) {
        columnIndex++
        lineRectRegion.regions.push(Object.assign({ originalIndex: index, lineIndex, columnIndex }, region))
        lineRectRegion.top = Math.min(lineRectRegion.top, top)
        lineRectRegion.bottom = Math.max(lineRectRegion.bottom, top + height)
        lineRectRegion.height = Math.max(lineRectRegion.height, lineRectRegion.bottom - lineRectRegion.top)
      } else {
        lineIndex++
        columnIndex = 0
        const lastItem = lineRectRegion.regions[lineRectRegion.regions.length - 1]
        const lastWidth = lastItem.width
        const lastLeft = lastItem.left
        lineRectRegion.width = (lastLeft + lastWidth) - lineRectRegion.left
        this.lineRectRegionList.push(Object.assign({}, lineRectRegion))
        lineRectRegion.top = top
        lineRectRegion.bottom = top + height
        lineRectRegion.left = left
        lineRectRegion.height = height
        lineRectRegion.regions = []
        lineRectRegion.regions.push(Object.assign({ originalIndex: index, lineIndex, columnIndex }, region))
      }
      if (index === this.originalRegionList.length - 1) {
        const lastItem = lineRectRegion.regions[lineRectRegion.regions.length - 1]
        const lastWidth = lastItem.width
        const lastLeft = lastItem.left
        lineRectRegion.width = (lastLeft + lastWidth) - lineRectRegion.left
        this.lineRectRegionList.push(Object.assign({}, lineRectRegion))
      }
    })
  }

  setRegions(list) {
    this.originalRegionList = list
    this.lineRectRegionList = []
    this.initRectRegion()
  }

  // 获取选择text
  getText(startRegion, endRegion) {
    const startIndex = startRegion.originalIndex
    const endIndex = endRegion.originalIndex
    const resultRegions = this.originalRegionList.slice(startIndex, endIndex + 1)
    let text = ''
    resultRegions.forEach((item) => {
      text += item.text
    })
    return text
  }
  // 获取选择rects
  getRects(startRegion, endRegion) {
    const startLineIndex = startRegion.lineIndex
    const endLineIndex = endRegion.lineIndex
    const startColumnIndex = startRegion.columnIndex
    const endColumnIndex = endRegion.columnIndex

    const resultLineRegionList = this.lineRectRegionList.slice(startLineIndex, endLineIndex + 1)
    const rects = []
    resultLineRegionList.forEach((lineRectRegion, index) => {
      if (index === 0) {
        const region = lineRectRegion.regions[startColumnIndex]
        rects.push(new DOMRect(
          region.left, lineRectRegion.top,
          lineRectRegion.width - region.left, lineRectRegion.height
        ))
      } else if (index === resultLineRegionList.length - 1) {
        const region = lineRectRegion.regions[endColumnIndex]
        rects.push(new DOMRect(
          lineRectRegion.left, lineRectRegion.top,
          region.left + region.width, lineRectRegion.height
        ))
      } else {
        rects.push(new DOMRect(lineRectRegion.left, lineRectRegion.top, lineRectRegion.width, lineRectRegion.height))
      }
    })
    return rects
  }
  // 获取选择text和rects

  /**
   * get Region By Point
   *
   * @public
   * @param {object} point
   * @param {number} point.x
   * @param {number} point.y
   * @returns {(Region | null)}
   */
  getRegionByPoint(point) {
    const pointPosition = {
      top: point.y,
      left: point.x,
    }
    const lineRegions = BSearchUpperBound(this.lineRectRegionList, pointPosition, 'top')
    if (lineRegions === -1) return null

    const touchLine = this.lineRectRegionList[lineRegions]
    const regionIndex = BSearchUpperBound(touchLine.regions, pointPosition, 'left')
    if (regionIndex === -1) return null
    return touchLine.regions[regionIndex]
  }

  getLineInfoByRegion(region) {
    const regionIndex = region.lineIndex
    const {
      top,
      bottom,
      left,
      height,
      width,
    } = this.lineRectRegionList[regionIndex]
    return {
      top,
      bottom,
      left,
      height,
      width,
    }
  }
  getPreviousRegion(region) {
    const { lineIndex, columnIndex } = region
    let previousRegion
    if (columnIndex === 0) {
      const lineRectRegion = this.lineRectRegionList[lineIndex - 1]
      if (lineRectRegion) {
        previousRegion = lineRectRegion.regions[lineRectRegion.length - 1]
      }
    } else {
      previousRegion = this.lineRectRegionList[lineIndex].regions[columnIndex - 1]
    }
    return previousRegion || null
  }
  getNextRegion(region) {
    const { lineIndex, columnIndex } = region
    let nextRegion
    const lineRectRegion = this.lineRectRegionList[lineIndex]
    if (lineRectRegion) {
      if (columnIndex === lineRectRegion.length - 1) {
        const nextLineRectRegion = this.lineRectRegionList[lineIndex + 1]
        if (nextLineRectRegion) {
          [nextRegion] = nextLineRectRegion.regions
        }
      } else {
        nextRegion = this.lineRectRegionList[lineIndex].regions[columnIndex + 1]
      }
    }
    return nextRegion || null
  }
  // 包含下边界和右边界不包括左边界和上边界
  static pointInRect(targetPoint, leftTopPoint, rightBottomPoint) {
    if (targetPoint.x > leftTopPoint.x
      && targetPoint.x <= rightBottomPoint.x
      && targetPoint.y > leftTopPoint.y
      && targetPoint.y <= rightBottomPoint.y) {
      return true
    }
    return false
  }

  static isSameLine(region1, region2) {
    return (region1.top - (region2.top + region2.height)) * (region2.top - (region1.top + region1.height)) > 0
  }
}

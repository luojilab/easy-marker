import { BSearchUpperBound } from './helpers'

export default class Region {
  constructor(list) {
    this.originalRegionList = list
    this.regions = []
    // {
    //   text: '', required
    //   width: '', required
    //   height: '', required
    //   left: '', required
    //   top: '', required
    //   page: '', required
    // }

    this.initRectRegion()
  }
  initRectRegion() {
    this.regions = Region.getLineRectRegionList(this.originalRegionList)
  }

  static getLineRectRegionList(originalRegionList) {
    const pageRegionList = []
    const pageRegion = {
      page: 0,
      top: 0,
      right: 0,
      left: 0,
      width: 0,
      height: 0,
      regions: [],
    }
    const lineRectRegion = {
      top: 0,
      bottom: 0,
      left: 0,
      width: 0,
      height: 0,
      regions: [],
    }
    let lineIndex = 0
    let columnIndex = 0
    let pageIndex = 0
    originalRegionList.forEach((region, index) => {
      const {
        top, height, left, page, width,
      } = region

      if (lineRectRegion.regions.length === 0) {
        // 第一个字
        pageRegion.page = region.page
        pageRegion.top = top
        pageRegion.right = left + width
        pageRegion.left = left
        pageRegion.width = width

        lineRectRegion.top = top
        lineRectRegion.bottom = top + height
        lineRectRegion.left = left
        lineRectRegion.height = height
        lineRectRegion.page = page

        lineRectRegion.regions.push(Object.assign({
          originalIndex: index, lineIndex, columnIndex, pageIndex,
        }, region))
      } else if (
        pageRegion.page === region.page &&
        Region.isSameLine({ top: lineRectRegion.top, height: lineRectRegion.bottom - lineRectRegion.top }, region)
      ) {
        // 同页 且 同行
        columnIndex++
        lineRectRegion.regions.push(Object.assign({
          originalIndex: index, lineIndex, columnIndex, pageIndex,
        }, region))
        lineRectRegion.top = Math.min(lineRectRegion.top, top)
        lineRectRegion.bottom = Math.max(lineRectRegion.bottom, top + height)
        lineRectRegion.height = Math.max(lineRectRegion.height, lineRectRegion.bottom - lineRectRegion.top)
      } else if (pageRegion.page === region.page) {
        // 同页不同行
        lineIndex++
        columnIndex = 0
        const lastItem = lineRectRegion.regions[lineRectRegion.regions.length - 1]
        const lastWidth = lastItem.width
        const lastLeft = lastItem.left
        lineRectRegion.width = (lastLeft + lastWidth) - lineRectRegion.left

        pageRegion.regions.push(Object.assign({}, lineRectRegion))
        pageRegion.top = Math.min(pageRegion.top, lineRectRegion.top)
        pageRegion.left = Math.min(pageRegion.left, lineRectRegion.left)
        pageRegion.right = Math.max(pageRegion.right, lineRectRegion.left + lineRectRegion.width)
        pageRegion.width = Math.max(pageRegion.width, pageRegion.right - lineRectRegion.left)

        lineRectRegion.top = top
        lineRectRegion.bottom = top + height
        lineRectRegion.left = left
        lineRectRegion.height = height
        lineRectRegion.page = page
        lineRectRegion.regions = []
        lineRectRegion.regions.push(Object.assign({
          originalIndex: index, lineIndex, columnIndex, pageIndex,
        }, region))
      } else {
        // 不同页
        const lastItem = lineRectRegion.regions[lineRectRegion.regions.length - 1]
        const lastWidth = lastItem.width
        const lastLeft = lastItem.left
        lineRectRegion.width = (lastLeft + lastWidth) - lineRectRegion.left
        pageRegion.regions.push(Object.assign({}, lineRectRegion))

        const lastLineItem = pageRegion.regions[pageRegion.regions.length - 1]
        const lastLineTop = lastLineItem.top
        const lastLineHeight = lastLineItem.height
        pageRegion.height = (lastLineTop + lastLineHeight) - pageRegion.top
        pageRegionList.push(Object.assign({}, pageRegion))

        pageIndex++
        lineIndex = 0
        columnIndex = 0

        pageRegion.page = region.page
        pageRegion.top = top
        pageRegion.right = left + width
        pageRegion.left = left
        pageRegion.width = width
        pageRegion.regions = []

        lineRectRegion.top = top
        lineRectRegion.bottom = top + height
        lineRectRegion.left = left
        lineRectRegion.height = height
        lineRectRegion.page = page
        lineRectRegion.regions = []

        lineRectRegion.regions.push(Object.assign({
          originalIndex: index, lineIndex, columnIndex, pageIndex,
        }, region))
      }
      if (index === originalRegionList.length - 1) {
        const lastItem = lineRectRegion.regions[lineRectRegion.regions.length - 1]
        const lastWidth = lastItem.width
        const lastLeft = lastItem.left
        lineRectRegion.width = (lastLeft + lastWidth) - lineRectRegion.left
        pageRegion.regions.push(Object.assign({}, lineRectRegion))

        const lastLineItem = pageRegion.regions[pageRegion.regions.length - 1]
        const lastLineTop = lastLineItem.top
        const lastLineHeight = lastLineItem.height
        pageRegion.height = (lastLineTop + lastLineHeight) - pageRegion.top
        pageRegionList.push(Object.assign({}, pageRegion))
      }
    })
    return pageRegionList
  }

  setRegions(list) {
    this.originalRegionList = list
    this.regions = []
    this.initRectRegion()
  }

  getSentenceByPosition(point) {
    let startRegion
    let endRegion
    const currentRegion = this.getRegionByPoint(point)
    const separators = [
      '\u3002\u201D',
      '\uFF1F\u201D',
      '\uFF01\u201D',
      '\u3002',
      '\uFF1F',
      '\uFF01',
    ]
    const separatorRegStr = separators.reduce((acc, separator) => {
      if (separator === '') return acc
      if (acc === '') return `\\${separator}`
      return `${acc}|\\${separator}`
    }, '')
    const separator = new RegExp(`(${separatorRegStr})`)
    let tempEndRegion = currentRegion
    while (!endRegion) {
      const nextRegion = this.getNextRegion(tempEndRegion)
      if (nextRegion === null) {
        endRegion = tempEndRegion
      } else if (separator.test(nextRegion.text)) {
        endRegion = nextRegion
      } else {
        tempEndRegion = nextRegion
      }
    }
    let tempStartRegion = currentRegion
    while (!startRegion) {
      const nextRegion = this.getPreviousRegion(tempStartRegion)
      if (nextRegion === null) {
        startRegion = tempStartRegion
      } else if (separator.test(nextRegion.text)) {
        startRegion = tempStartRegion
      } else {
        tempStartRegion = nextRegion
      }
    }
    return { start: startRegion, end: endRegion }
  }

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

  getRects(startRegion, endRegion) {
    const startPageIndex = startRegion.pageIndex
    const endPageIndex = endRegion.pageIndex
    const startLineIndex = startRegion.lineIndex
    const endLineIndex = endRegion.lineIndex
    const startColumnIndex = startRegion.columnIndex
    const endColumnIndex = endRegion.columnIndex
    const rects = []
    if (startLineIndex === endLineIndex && startPageIndex === endPageIndex) {
      const lineRectRegion = this.regions[startPageIndex].regions[startLineIndex]
      rects.push(new DOMRect(
        startRegion.left, lineRectRegion.top,
        (endRegion.left + endRegion.width) - startRegion.left, lineRectRegion.height
      ))
      return rects
    }

    if (startPageIndex === endPageIndex) {
      const regions = this.regions[startPageIndex].regions.slice(startLineIndex, endLineIndex + 1)
      rects.push(...Region.getRectsByRegions(regions, startColumnIndex, endColumnIndex))
    } else {
      for (let i = startPageIndex; i <= endPageIndex; i++) {
        if (i === startPageIndex) {
          const regions = this.regions[i].regions.slice(startLineIndex)
          rects.push(...Region.getRectsByRegions(regions, startColumnIndex, null))
        } else if (i === endPageIndex) {
          const regions = this.regions[i].regions.slice(0, endLineIndex + 1)
          rects.push(...Region.getRectsByRegions(regions, null, endColumnIndex))
        } else {
          const { regions } = this.regions[i]
          rects.push(...Region.getRectsByRegions(regions, null, null))
        }
      }
    }
    return rects
  }
  static getRectsByRegions(LineRegions, startColumnIndex, endColumnIndex) {
    const rects = []
    LineRegions.forEach((lineRectRegion, index) => {
      if (index === 0 && startColumnIndex !== null) {
        const region = lineRectRegion.regions[startColumnIndex]
        rects.push(new DOMRect(
          region.left, lineRectRegion.top,
          lineRectRegion.width - region.left + lineRectRegion.left, lineRectRegion.height
        ))
      } else if (index === LineRegions.length - 1 && endColumnIndex !== null) {
        const region = lineRectRegion.regions[endColumnIndex]
        rects.push(new DOMRect(
          lineRectRegion.left, lineRectRegion.top,
          region.left + region.width - lineRectRegion.left, lineRectRegion.height
        ))
      } else {
        rects.push(new DOMRect(lineRectRegion.left, lineRectRegion.top, lineRectRegion.width, lineRectRegion.height))
      }
    })
    return rects
  }
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
    const pageRegions = BSearchUpperBound(this.regions, pointPosition, 'left')
    if (pageRegions === -1) return null
    const lineRectRegionList = this.regions[pageRegions].regions
    const lineRegions = BSearchUpperBound(lineRectRegionList, pointPosition, 'top')
    if (lineRegions === -1) return null

    const touchLine = lineRectRegionList[lineRegions]
    const regionIndex = BSearchUpperBound(touchLine.regions, pointPosition, 'left')
    if (regionIndex === -1) return null
    return touchLine.regions[regionIndex]
  }

  getLineInfoByRegion(region) {
    const { pageIndex, lineIndex } = region
    const {
      top,
      left,
      height,
      width,
    } = this.regions[pageIndex].regions[lineIndex]

    return {
      top,
      left,
      height,
      width,
    }
  }

  getPreviousRegion(region) {
    const { lineIndex, columnIndex, pageIndex } = region
    let previousRegion
    if (columnIndex === 0) {
      if (lineIndex !== 0) {
        const lineRectRegion = this.regions[pageIndex].regions[lineIndex - 1]
        if (lineRectRegion) {
          previousRegion = lineRectRegion.regions[lineRectRegion.regions.length - 1]
        }
      } else if (pageIndex !== 0) {
        const lineRectRegion = this.regions[pageIndex - 1].regions[this.regions[pageIndex - 1].region.length - 1]
        if (lineRectRegion) {
          previousRegion = lineRectRegion.regions[lineRectRegion.regions.length - 1]
        }
      }
    } else {
      previousRegion = this.regions[pageIndex].regions[lineIndex].regions[columnIndex - 1]
    }
    return previousRegion || null
  }

  getNextRegion(region) {
    const { lineIndex, columnIndex, pageIndex } = region
    let nextRegion
    const lineRectRegion = this.regions[pageIndex].regions[lineIndex]
    if (lineRectRegion) {
      if (columnIndex === lineRectRegion.regions.length - 1) {
        const nextLineRectRegion = this.regions[pageIndex].regions[lineIndex + 1]
        if (nextLineRectRegion) {
          [nextRegion] = nextLineRectRegion.regions
        } else if (this.regions[pageIndex + 1]) {
          [nextRegion] = this.regions[pageIndex + 1].regions[0].regions
        }
      } else {
        nextRegion = lineRectRegion.regions[columnIndex + 1]
      }
    }
    return nextRegion || null
  }

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

  destroy() {
    this.originalRegionList = []
    this.regions = []
  }
}

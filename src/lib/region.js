export default class Region {
  constructor(regionList) {
    this.regionList = regionList
    console.log(111, this.regionList)
    this.lineRegionList = []
    // region demo
    // {
    //   text: '',
    //   width: '',
    //   height: '',
    //   left: '',
    //   top: '',
    //   offset: 0,
    //   phase: 0,
    // }

    this.regionsSliceByline()
  }
  // 预处理数据
  regionsSliceByline() {
    const lineRegion = {
      top: 0,
      bottom: 0,
      regions: [],
    }
    this.regionList.forEach((region, index) => {
      const { top, height } = region

      if (lineRegion.regions.length === 0) {
        lineRegion.top = top
        lineRegion.bottom = top + height
        lineRegion.regions.push(Object.assign({}, region))
      } else if (Region.isSameLine({ top: lineRegion.top, height: lineRegion.bottom - lineRegion.top }, region)) {
        lineRegion.regions.push(Object.assign({}, region))
        lineRegion.top = Math.min(lineRegion.top, top)
        lineRegion.bottom = Math.max(lineRegion.bottom, top + height)
      } else {
        this.lineRegionList.push(Object.assign({}, lineRegion))
        lineRegion.top = top
        lineRegion.bottom = top + height
        lineRegion.regions = []
        lineRegion.regions.push(Object.assign({}, region))
      }
      if (index === this.regionList.length - 1) {
        this.lineRegionList.push(Object.assign({}, lineRegion))
      }
    })
    console.log(223, this.lineRegionList)
  }
  // 获取选择text
  // 获取选择rects
  // 获取选择text和rects

  // 通过位置确定触摸元素
  // getRegionByPoint(point) {
  //   const lineRegions = this.getLineByPosition(point)
  //   console.log(lineRegions, this.regionList)
  // }
  // 确定行 只比较y 确定minX maxX
  // static getLineByPoint(point, regionList) {
  //   const midIndex = Math.ceil((regionList.length - 1) / 2)
  //   const midItem = regionList[midIndex]
  //   const nextItem = regionList[midIndex + 1]
  //   // 找行的最后一项
  // }

  // 已确定行再确定列

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

  // static getPositionByRegion(region) {
  //   const {x,y,width,height} = region
  //   return {x}
  // }
}

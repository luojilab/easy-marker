import BaseElement from './base'
import { anyToPx } from '../lib/helpers'
import TextNode from '../lib/text_node'
import { EasyMarkerMode, MenuType } from '../lib/types'

/**
 *
 *
 * @export
 * @extends {BaseElement}
 */
export default class Menu extends BaseElement {
  constructor(container, options = {}) {
    super()
    this.container = container
    this.handler = null
    this.mode = options.mode
    this.option = {
      items: options.menuItems,
      isMultiColumnLayout: options.isMultiColumnLayout,
      topOffset: anyToPx(options.topOffset),
      style: {
        menu: {
          fontSize: '0.4rem',
          backgroundColor: '#262626',
          fontColor: '#fff',
          borderRadius: '0.1rem',
          color: '#fff',
          border: '0px',
          display: 'inline-block',
          padding: '0 0.2rem',
          margin: 'auto',
        },
        triangle: {
          marginLeft: 'auto',
          marginRight: 'auto',
          borderTop: '0.2rem solid #262626',
          borderRight: '0.2rem solid transparent',
          borderLeft: '0.2rem solid transparent',
          width: '0',
          height: '0',
          marginTop: '-1px',
        },
        item: {
          lineHeight: '1.24rem',
          padding: '0 0.3rem',
          color: '#fff',
          display: 'inline-block',
        },
        icon: {
          display: 'block',
        },
      },
    }

    if (options.style) {
      Object.assign(this.option.style.menu, options.style.menu)
      Object.assign(this.option.style.triangle, options.style.triangle)
      Object.assign(this.option.style.item, options.style.item)
      Object.assign(this.option.style.icon, options.style.icon)
    }

    this.easyMarker = null
    this.menuElement = null
    this.itemMap = new Map()
    this.positionRange = {
      top: 0,
      bottom: 0,
      left: 0,
    }
    this.windowWidth = document.documentElement.clientWidth
    this.ticking = false
    this.height = 0
    this.width = 0
    this.type = MenuType.SELECT
    this.options = {}
    this.createElement()
    this.mount()
    this.hide()
  }

  get screenRelativeOffset() {
    const { top, left } = this.container.getBoundingClientRect()
    return {
      x: left,
      y: top,
    }
  }

  createElement() {
    const wrapper = document.createElement('div')
    wrapper.style.position = 'absolute'
    wrapper.style.width = 'max-content'
    wrapper.style.textAlign = 'center'
    wrapper.style.lineHeight = '0'
    wrapper.style.zIndex = '30'
    wrapper.style.transform = 'translate3d(-50%, -100%, 0)'
    wrapper.style.webkitTransform = 'translate3d(-50%, -100%, 0)'
    wrapper.style.transition = 'transform 0.2s ease, opacity 0.2s ease'

    const menu = document.createElement('div')
    menu.classList.add('em-menu')
    Object.assign(menu.style, this.option.style.menu)

    const bottomTriangle = document.createElement('div')
    bottomTriangle.classList.add('em-menu-triangle')
    Object.assign(bottomTriangle.style, this.option.style.triangle)

    wrapper.appendChild(menu)
    wrapper.appendChild(bottomTriangle)
    this.option.items.forEach((item) => {
      const menuItem = this.createMenuItemElement(item)
      this.itemMap.set(menuItem, item)
      menu.appendChild(menuItem)
    })
    this.menuElement = menu
    this.element = wrapper
    const style = document.createElement('style')
    style.type = 'text/css'
    style.rel = 'stylesheet'
    // eslint-disable-next-line max-len
    const styleText =
      '.em-menu-wrapper-select .em-menu-item-highlight{display: none !important} .em-menu-wrapper-highlight .em-menu-item-select{display: none !important}'
    style.appendChild(document.createTextNode(styleText))
    const head = document.getElementsByTagName('head')[0]
    head.appendChild(style)
  }

  createMenuItemElement({
    text, iconName, style: itemStyle, iconStyle, type,
  }) {
    // eslint-disable-line class-methods-use-this
    const menuItem = document.createElement('span')
    menuItem.classList.add('em-menu-item')
    if (type !== undefined) {
      menuItem.classList.add(`em-menu-item-${type}`)
    }
    Object.assign(menuItem.style, this.option.style.item, itemStyle)
    if (iconName) {
      const iconItem = document.createElement('span')
      Object.assign(iconItem.style, this.option.style.icon, iconStyle)
      iconItem.className = 'em-menu-item-icon '.concat(iconName)
      const textNode = document.createTextNode(text)
      menuItem.appendChild(iconItem)
      menuItem.appendChild(textNode)
    } else {
      const textNode = document.createTextNode(text)
      menuItem.appendChild(textNode)
    }

    return menuItem
  }

  setPosition(start, end) {
    const mergeRects = {}
    if (this.mode === EasyMarkerMode.REGION) {
      let rects
      if (start.pageIndex !== end.pageIndex) {
        // menu 跟随最后一页走
        const startRegion = this.easyMarker.region.regions[end.pageIndex].regions[0].regions[0]
        rects = this.easyMarker.region.getRects(startRegion, end)
      } else {
        rects = this.easyMarker.region.getRects(start, end)
      }
      // const rects = this.easyMarker.region.getRects(start, end)
      rects.forEach((rect, index) => {
        if (index === 0) {
          mergeRects.left = rect.left
          mergeRects.top = rect.top
          mergeRects.right = rect.right
          mergeRects.bottom = rect.bottom
        } else {
          mergeRects.left = Math.min(rect.left, mergeRects.left)
          mergeRects.top = Math.min(rect.top, mergeRects.top)
          mergeRects.right = Math.max(rect.right, mergeRects.right)
          mergeRects.bottom = Math.max(rect.bottom, mergeRects.bottom)
        }
      })
    } else {
      const { rects } = TextNode.getSelectNodeRectAndText(start.node, end.node, start.offset, end.offset)
      rects
        .filter(item => item.left <= this.windowWidth && item.left >= 0)
        .forEach((rect, index) => {
          if (index === 0) {
            mergeRects.left = rect.left - this.screenRelativeOffset.x
            mergeRects.top = rect.top - this.screenRelativeOffset.y
            mergeRects.right = rect.right - this.screenRelativeOffset.x
            mergeRects.bottom = rect.bottom - this.screenRelativeOffset.y
          } else if (index === rects.length - 1) {
            mergeRects.bottom = rect.bottom - this.screenRelativeOffset.y
          } else {
            mergeRects.left = Math.min(rect.left - this.screenRelativeOffset.x, mergeRects.left)
            // mergeRects.top = Math.min(rect.top - this.screenRelativeOffset.y, mergeRects.top)
            mergeRects.right = Math.max(rect.right - this.screenRelativeOffset.x, mergeRects.right)
            // mergeRects.bottom = Math.max(rect.bottom - this.screenRelativeOffset.y, mergeRects.bottom)
          }
        })
    }

    this.positionRange.top = mergeRects.top
    this.positionRange.bottom = mergeRects.bottom
    this.positionRange.left = (mergeRects.left + mergeRects.right) / 2
  }

  hide() {
    this.style.visibility = 'hidden'
    this.style.opacity = '0'
    this.reset()
  }

  reset() {
    this.options = {}
  }

  get isShow() {
    return this.style.visibility === 'visible'
  }

  show() {
    if (this.type === MenuType.HIGHLIGHT) {
      this.element.classList.remove('em-menu-wrapper-select')
      this.element.classList.add('em-menu-wrapper-highlight')
    } else if (this.type === MenuType.SELECT) {
      this.element.classList.remove('em-menu-wrapper-highlight')
      this.element.classList.add('em-menu-wrapper-select')
    }
    let relativeTop = 0
    if (!this.height || !this.width) {
      this.height = Number((window.getComputedStyle(this.menuElement).height || '').replace('px', ''))
      this.width = Number((window.getComputedStyle(this.menuElement).width || '').replace('px', ''))
    }
    const { top: containerTop, right: containerRight, left: containerLeft } = this.container.getBoundingClientRect()
    if (containerTop < 0 && this.positionRange.bottom < -containerTop) {
      relativeTop = this.positionRange.bottom
      this.style.position = 'absolute'
    } else if (this.positionRange.top - this.height - this.option.topOffset > -containerTop) {
      relativeTop = this.positionRange.top
      this.style.position = 'absolute'
    } else {
      // relativeTop = this.option.topOffset + menuHeight - containerTop
      this.style.position = 'fixed'
      relativeTop = this.option.topOffset + this.height
    }

    // this.style.display = 'block'
    this.style.visibility = 'visible'
    this.style.top = `${relativeTop}px`
    if (this.positionRange.left + containerLeft + this.width / 2 > this.windowWidth) {
      let right
      if (this.style.position === 'fixed' && !this.option.isMultiColumnLayout) {
        right = containerRight - this.positionRange.left - this.width / 2
        right = containerLeft < 0 ? -this.width / 2 : right
      } else {
        right = containerRight - this.positionRange.left - containerLeft - this.width / 2
      }
      this.style.right = `${right}px`
      this.style.left = ''
    } else if (this.positionRange.left + containerLeft - this.width / 2 < 0) {
      let left
      if (this.style.position === 'fixed' && !this.option.isMultiColumnLayout) {
        left = this.width / 2 + this.positionRange.left + containerLeft
        left = left < 0 ? this.width / 2 : left
      } else {
        left = this.width / 2 + this.positionRange.left
      }
      this.style.left = `${left}px`
      this.style.right = ''
    } else {
      let left
      if (this.style.position === 'fixed' && !this.option.isMultiColumnLayout) {
        left = this.positionRange.left + containerLeft
        left = left < 0 ? this.width / 2 : left
      } else {
        // eslint-disable-next-line prefer-destructuring
        left = this.positionRange.left
      }
      this.style.left = `${left}px`
      this.style.right = ''
    }
    this.style.opacity = '1'
  }
  copyListener(options, e) {
    let copyItem
    this.itemMap.forEach((item) => {
      if (item.id === 'copy' || item.text === '复制') {
        copyItem = item
      }
    })
    if (!copyItem) return
    const selection = this.getSelection(options)
    if (copyItem.id && this.easyMarker.menuOnClick) {
      this.easyMarker.menuOnClick(copyItem.id, selection, Object.assign({}, this.options, { e }))
    } else {
      copyItem.handler.call(this.easyMarker, selection, Object.assign({}, this.options, { e }))
    }
  }

  inRegion(e) {
    const tapTarget = this.getTapTarget(e.target)
    if (!this.itemMap.has(tapTarget)) return false
    return true
  }

  handleTap(e, options) {
    const tapTarget = this.getTapTarget(e.target)
    if (!this.itemMap.has(tapTarget)) return false

    const selection = this.getSelection(options)

    const item = this.itemMap.get(tapTarget)
    if (item.id && this.easyMarker.menuOnClick) {
      this.easyMarker.menuOnClick(item.id, selection, this.options)
    } else {
      item.handler.call(this.easyMarker, selection, this.options)
    }
    return true
  }

  getSelection(options) {
    let selection
    if (this.mode === EasyMarkerMode.NODE) {
      const {
        start, end, content, markdown,
      } = options
      selection = {
        anchorNode: start.node,
        anchorOffset: start.offset,
        focusNode: end.node,
        focusOffset: end.offset,
        toString() {
          return content
        },
        toMarkdown() {
          return markdown
        },
      }
    } else {
      const {
        start, end, content, markdown,
      } = options
      selection = {
        start,
        end,
        toString() {
          return content
        },
        toMarkdown() {
          return markdown
        },
      }
    }
    return selection
  }

  getTapTarget(target) {
    if (
      this.itemMap.has(target)
      // || (target.classList && target.classList.contains('em-menu'))
    ) {
      return target
    }
    if (target.parentNode) {
      return this.getTapTarget(target.parentNode)
    }
    return null
  }

  handleScroll() {
    if (!this.ticking) {
      window.requestAnimationFrame(() => {
        this.show()
        this.ticking = false
      })
      this.ticking = true
    }
  }
}

import BaseElement from './base'
import { anyToPx } from '../lib/helpers'

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
    this.option = {
      items: options.menuItems,
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
    this.createElement()
    this.mount()
    this.hide()
  }

  createElement() {
    const wrapper = document.createElement('div')
    wrapper.style.position = 'absolute'
    wrapper.style.width = '100%'
    wrapper.style.textAlign = 'center'
    wrapper.style.lineHeight = '0'
    wrapper.style.zIndex = '10'
    wrapper.style.transform = 'translateY(-100%)'
    wrapper.style.webkitTransform = 'translateY(-100%)'
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
      const menuItem = this.createMenuItemElement(item.text, item.iconName, item.style, item.iconStyle)
      this.itemMap.set(menuItem, item)
      menu.appendChild(menuItem)
    })
    this.menuElement = menu
    this.element = wrapper
  }

  createMenuItemElement(text, iconName, itemStyle, iconStyle) {
    // eslint-disable-line class-methods-use-this
    const menuItem = document.createElement('span')
    menuItem.classList.add('em-menu-item')
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

  setPosition(top, bottom, left) {
    this.positionRange.top = top
    this.positionRange.bottom = bottom
    this.positionRange.left = left
  }

  hide() {
    this.style.visibility = 'hidden'
    this.style.opacity = '0'
  }

  show() {
    let relativeTop = 0
    if (!this.height) {
      this.height = Number((window.getComputedStyle(this.menuElement).height || '').replace('px', ''))
    }
    const { top: containerTop } = this.container.getBoundingClientRect()
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
    this.style.left = `${Math.floor(this.positionRange.left / this.windowWidth) * this.windowWidth}px`
    this.style.opacity = '1'
  }

  handleTap(e, {
    start,
    end,
    content,
    markdown,
  }) {
    const tapTarget = this.getTapTarget(e.target)
    if (!this.itemMap.has(tapTarget)) return false
    const selection = {
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
    const item = this.itemMap.get(tapTarget)
    if (item.id && this.easyMarker.menuOnClick) {
      this.easyMarker.menuOnClick(item.id, selection)
    } else {
      item.handler.call(this.easyMarker, selection)
    }
    return true
  }

  getTapTarget(target) {
    if (this.itemMap.has(target) || (target.classList && target.classList.contains('em-menu'))) {
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

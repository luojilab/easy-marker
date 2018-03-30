import BaseElement from './base'
import { anyToPx } from '../helpers'

/**
 *
 *
 * @export
 * @extends {BaseElement}
 */
export default class Menu extends BaseElement {
  constructor(container, options) {
    super()
    this.container = container
    this.option = {
      items: options.menuItems,
      topOffset: anyToPx(options.topOffset),
      style: {
        fontSize: '0.4rem',
        backgroundColor: '#262626',
        fontColor: '#fff',
      },
    }
    this.easyMarker = null
    this.menuElement = null
    this.itemMap = new Map()
    this.positionRange = {
      top: 0,
      bottom: 0,
    }
    this.ticking = false
    this.height = anyToPx('1.24rem')
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
    wrapper.style.left = '0'
    wrapper.style.zIndex = '10'
    wrapper.style.transform = 'translateY(-100%)'
    wrapper.style.transition = 'transform 0.2s ease, opacity 0.2s ease'

    const menu = document.createElement('div')
    // menu.style.transition = 'transform 0.2s ease, opacity 0.2s ease'
    menu.style.fontSize = this.option.style.fontSize
    menu.style.background = this.option.style.backgroundColor
    menu.style.lineHeight = '0.73rem'
    menu.style.display = 'inline-block'
    menu.style.borderRadius = '0.1rem'
    menu.style.color = '#fff'
    menu.style.border = '0px'
    // menu.style.boxShadow = '0rem 0.1rem 0.6rem rgba(0, 0, 0, 0.3)'
    menu.style.padding = '0 0.2rem'
    menu.style.margin = 'auto'
    const bottomTriangle = document.createElement('div')
    bottomTriangle.style.marginLeft = 'auto'
    bottomTriangle.style.marginRight = 'auto'
    bottomTriangle.style.borderTop = `0.2rem solid ${this.option.style.backgroundColor}`
    bottomTriangle.style.borderRight = '0.2rem solid transparent'
    bottomTriangle.style.borderLeft = '0.2rem solid transparent'
    bottomTriangle.style.width = '0'
    bottomTriangle.style.height = '0'
    bottomTriangle.style.marginTop = '-1px'
    wrapper.appendChild(menu)
    wrapper.appendChild(bottomTriangle)
    this.option.items.forEach((item) => {
      const menuItem = this.createMenuItemElement(item.text)
      this.itemMap.set(menuItem, item)
      menu.appendChild(menuItem)
    })
    this.menuElement = menu
    this.element = wrapper
  }

  createMenuItemElement(text) { // eslint-disable-line class-methods-use-this
    const menuItem = document.createElement('span')
    menuItem.style.padding = '0.3rem'
    menuItem.style.color = this.option.style.fontColor
    menuItem.style.display = 'inline-block'
    const textNode = document.createTextNode(text)
    menuItem.appendChild(textNode)
    return menuItem
  }

  setPosition(top, bottom) {
    this.positionRange.top = top
    this.positionRange.bottom = bottom
  }

  hide() {
    this.style.transform = 'scale(0, 0), translateY(50%)'
    this.style.webkitTransform = 'scale(0, 0), translateY(50%)'
    // this.style.display = 'none'
    this.style.visibility = 'hidden'
    this.style.opacity = '0'
  }

  show() {
    let relativeTop = 0
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
    this.style.transform = 'scale(1, 1), translateY(0)'
    this.style.webkitTransform = 'scale(1, 1), translateY(0)'
    this.style.opacity = '1'
  }

  handleTap(e, { start, end, content }) {
    if (!this.itemMap.has(e.target)) return false
    const selection = {
      anchorNode: start.node,
      anchorOffset: start.offset,
      focusNode: end.node,
      focusOffset: end.offset,
      toString() {
        return content
      },
    }
    this.itemMap.get(e.target).handler.call(this.easyMarker, selection)
    return true
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

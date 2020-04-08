/**
 * Base element class
 *
 * @export
 * @class BaseElement
 */
export default class BaseElement {
  constructor() {
    this.element = null
    this.container = document.body
  }

  /**
   * Create element interface
   *
   * @memberof BaseElement
   */
  createElement() { // eslint-disable-line class-methods-use-this
  }

  /**
   * Mount the element under the container
   *
   * @memberof BaseElement
   */
  mount() {
    this.container.appendChild(this.element)
  }

  /**
   * get Element Style
   *
   * @memberof BaseElement
   */
  get style() {
    return this.element.style
  }


  show() {
    this.style.display = 'block'
  }

  hide() {
    this.style.display = 'none'
  }

  get isShow() {
    return this.style.display === 'none'
  }

  /**
   * Remove Element
   *
   * @memberof BaseElement
   */
  destroy() {
    if (this.element) {
      this.element.parentElement.removeChild(this.element)
    }
  }
}

// import { getDistance } from '../helpers'

export const CursorType = {
  START: 'start',
  END: 'end',
}

const defaultOptions = {
  color: '#ff6b00',
}

/**
 * Cursor class
 *
 * @export
 * @class Cursor
 * @extends {BaseElement}
 */
export default class CustomizeCursor {
  /**
   * Creates an instance of Cursor.
   * @param {any} container
   * @param {any} type
   * @param {any} options
   * @memberof Cursor
   */
  constructor(container, type, options) {
    this.container = container
    this.type = type
    this.options = Object.assign({}, defaultOptions, options)
    this.$position = { x: 0, y: 0 }
    this.$height = 0
    this.rightTriangle = null
    this.leftTriangle = null
    this.bottomElement = null
    this.createElement()
    this.mount()
  }
  // required
  set position(val) {
    const { x, y } = val
    this.$position = { x, y }

    this.moveTo(x, y)
  }
  // required
  get position() {
    return this.$position
  }
  // required
  get height() {
    return this.$height
  }
  // required
  set height(val) {
    if (val !== this.$height) {
      this.$height = val
      this.setCursorSize()
    }
  }

  get offset() {
    return {
      x: -this.width / 2,
      y: -this.width * 3,
    }
  }

  get style() {
    return this.element.style
  }


  get width() {
    return this.height / 2
  }

  // required
  show() {
    this.style.display = 'block'
  }

  // required
  hide() {
    this.style.display = 'none'
  }

  // required
  destroy() {
    if (this.element) {
      this.element.parentElement.removeChild(this.element)
    }
  }

  mount() {
    this.container.appendChild(this.element)
  }

  moveTo(x, y) {
    this.style.top = `${y + this.height}px`
    if (this.type === CursorType.START) {
      this.style.left = `${x - this.width}px`
    } else {
      this.style.left = `${x}px`
    }
  }

  createElement() {
    this.element = document.createElement('div')
    this.style.userSelect = 'none'
    this.style.webkitUserSelect = 'none'
    this.style.zIndex = '2'
    this.style.transition = 'top 0.1s, left 0.1s'
    this.style.display = 'none'
    this.style.position = 'absolute'

    if (this.type === CursorType.START) {
      this.leftTriangle = document.createElement('div')
      this.leftTriangle.style.width = '0'
      this.leftTriangle.style.height = '0'
      this.leftTriangle.style.margin = 'auto'
      this.element.appendChild(this.leftTriangle)
    } else {
      this.rightTriangle = document.createElement('div')

      this.rightTriangle.style.width = '0'
      this.rightTriangle.style.height = '0'
      this.rightTriangle.style.margin = 'auto'
      this.element.appendChild(this.rightTriangle)
    }

    this.bottomElement = document.createElement('div')
    this.bottomElement.style.margin = 'auto'
    this.bottomElement.style.background = 'gray'

    this.element.appendChild(this.bottomElement)
  }

  setCursorSize() {
    const pointDiameter = `${this.width}px`

    this.style.width = pointDiameter

    if (this.leftTriangle) {
      this.leftTriangle.style.borderBottom = `${this.width}px solid gray`
      this.leftTriangle.style.borderLeft = `${this.width}px solid transparent`
    }

    if (this.rightTriangle) {
      this.rightTriangle.style.borderBottom = `${this.width}px solid gray`
      this.rightTriangle.style.borderRight = `${this.width}px solid transparent`
    }

    this.bottomElement.style.height = `${this.width * 1.5}px`
    this.bottomElement.style.width = `${this.width}px`
  }

  /**
   * Check if it is in the region of the cursor
   *
   * @param {Object} position
   * @param {number} position.x
   * @param {number} position.y
   * @memberof Cursor
   */
  // required
  inRegion(position = {}) {
    const maxDistance = this.height
    let distance = Number.MAX_SAFE_INTEGER
    if (position.y > this.position.y && position.y < this.position.y + (this.width * 4.5)) {
      distance = Math.abs(position.x - this.position.x)
    }

    if (position.y <= this.position.y) {
      distance = CustomizeCursor.getDistance(position, this.position)
    }
    if (position.y >= this.position.y + (this.width * 5.5)) {
      distance = CustomizeCursor.getDistance(position, { x: this.position.x, y: this.position.y + this.width * 4.5 })
    }
    return { inRegion: distance <= maxDistance, distance }
  }

  /**
  * Returns the distance between two points
  *
  * @export
  * @param {any} start
  * @param {any} end
  * @returns
  */
  static getDistance(start, end) {
    return Math.sqrt((start.x - end.x) ** 2 + (start.y - end.y) ** 2)
  }
}

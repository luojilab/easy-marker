import { getDistance, getTouchPosition, getDeviceType, getTouch } from './helpers'
import { DeviceType } from './types'

export const EventType = {
  TOUCH_START: 'touchstart',
  TOUCH_MOVE: 'touchmove',
  TOUCH_MOVE_THROTTLE: 'touchmovethrottle',
  TOUCH_END: 'touchend',
  TAP: 'tap',
  LONG_TAP: 'longtap',
}

/**
 * Touch Event class
 *
 * @export
 * @class TouchEvent
 */
export default class TouchEvent {
  constructor(element, options) {
    this.disabled = false
    this.options = {
      longTapTime: 600,
      tapTime: 500,
      slideDistance: 20,
      throttleTime: 50,
    }
    // this.element = getDeviceType() === DeviceType.MOBILE ? element : window
    this.element = element || window
    this.options = Object.assign(this.options, options)
    this.touchStartCallbacks = []
    this.touchMoveCallbacks = []
    this.touchMoveThrottleCallbacks = []
    this.touchEndCallbacks = []
    this.tapCallbacks = []
    this.longTapCallbacks = []
    this.hook = () => true

    this.touchStartPosition = { x: 0, y: 0 }
    this.longTapTimerHandler = null
    this.touchMoveTimerHandler = null
    this.touchStartTime = Date.now()
    this.lastMoveTime = Date.now()
    this.onTouchStart = this.onTouchStart.bind(this)
    this.onTouchMove = this.onTouchMove.bind(this)
    this.onTouchEnd = this.onTouchEnd.bind(this)
    this.startEventName = getDeviceType() === DeviceType.MOBILE ? 'touchstart' : 'mousedown'
    this.moveEventName = getDeviceType() === DeviceType.MOBILE ? 'touchmove' : 'mousemove'
    this.endEventName = getDeviceType() === DeviceType.MOBILE ? 'touchend' : 'mouseup'
    this.cancelEventName = getDeviceType() === DeviceType.MOBILE ? 'touchcancel' : 'mouseleave'
    this.element.addEventListener(this.startEventName, this.onTouchStart)
    this.element.addEventListener(this.moveEventName, this.onTouchMove, {
      passive: false,
    })
    this.element.addEventListener(this.endEventName, this.onTouchEnd)
    this.element.addEventListener(this.cancelEventName, this.onTouchEnd)
  }

  disable() {
    this.disabled = true
  }
  enable() {
    this.disabled = false
  }
  /**
   * Register event
   *
   * @param {string} eventType
   * @param {Function} callback
   * @memberof TouchEvent
   */
  registerEvent(eventType, callback) {
    if (typeof callback !== 'function') return

    switch (eventType) {
      case EventType.TOUCH_START:
        this.touchStartCallbacks.push(callback)
        break
      case EventType.TOUCH_MOVE:
        this.touchMoveCallbacks.push(callback)
        break
      case EventType.TOUCH_MOVE_THROTTLE:
        this.touchMoveThrottleCallbacks.push(callback)
        break
      case EventType.TOUCH_END:
        this.touchEndCallbacks.push(callback)
        break
      case EventType.TAP:
        this.tapCallbacks.push(callback)
        break
      case EventType.LONG_TAP:
        this.longTapCallbacks.push(callback)
        break
      default:
        break
    }
  }

  registerHook(callback) {
    this.hook = callback
  }

  onTouchStart(e) {
    if (this.disabled) return
    if (e.touches && e.touches.length > 1) return
    if (!this.hook('touchstart', e)) return
    this.touchStartCallbacks.forEach(callback => callback(e))

    this.longTapTimerHandler = setTimeout(() => {
      this.onLongTap(e)
    }, this.options.longTapTime)

    this.touchStartPosition = getTouchPosition(e)
    this.touchStartTime = Date.now()
  }

  onTouchMove(e) {
    if (this.disabled) return
    if (e.touches && e.touches.length > 1) return
    if (!this.hook('touchmove', e)) return

    this.touchMoveCallbacks.forEach(callback => callback(e))

    clearTimeout(this.touchMoveTimerHandler)
    this.touchMoveTimerHandler = setTimeout(() => {
      this.onTouchMoveThrottle(e)
    }, this.options.throttleTime)
    if (Date.now() - this.lastMoveTime > this.options.throttleTime) {
      this.lastMoveTime = Date.now()
      this.onTouchMoveThrottle(e)
    }

    const currentPosition = getTouchPosition(e)
    const moveDistance = getDistance(currentPosition, this.touchStartPosition)
    if (moveDistance > this.options.slideDistance) {
      clearTimeout(this.longTapTimerHandler)
      this.longTapTimerHandler = null
    }
  }

  onTouchEnd(e) {
    if (this.disabled) return
    if (e.touches && e.touches.length > 1) return
    if (!this.hook('touchmove', e)) return

    this.touchEndCallbacks.forEach(callback => callback(e))

    clearTimeout(this.longTapTimerHandler)
    this.longTapTimerHandler = null
    if (Date.now() - this.touchStartTime < this.options.tapTime) {
      const currentPosition = getTouchPosition(e)
      const moveDistance = getDistance(currentPosition, this.touchStartPosition)
      if (moveDistance < this.options.slideDistance) {
        e.preventDefault()
        const clickEvent = this.constructor.createMouseEvent('click', e)
        this.onTap(e)
        e.target.dispatchEvent(clickEvent)
      }
    }
  }

  onTouchMoveThrottle(e) {
    this.touchMoveThrottleCallbacks.forEach(callback => callback(e))
  }

  onTap(e) {
    if (this.disabled) return
    if (!this.hook('tap', e)) return

    this.tapCallbacks.forEach(callback => callback(e))
  }

  onLongTap(e) {
    if (this.disabled) return
    this.longTapCallbacks.forEach(callback => callback(e))
  }

  destroy() {
    this.element.removeEventListener(this.startEventName, this.onTouchStart)
    this.element.removeEventListener(this.moveEventName, this.onTouchMove)
    this.element.removeEventListener(this.endEventName, this.onTouchEnd)
    this.element.removeEventListener(this.cancelEventName, this.onTouchEnd)
  }

  static createMouseEvent(type, e) {
    const touch = getTouch(e)
    const event = new MouseEvent(type)
    event.initMouseEvent(
      type,
      true,
      true,
      window,
      1,
      touch.screenX,
      touch.screenY,
      touch.clientX,
      touch.clientY,
      false,
      false,
      false,
      false,
      0,
      null
    )
    event.forwardedTouchEvent = true
    return event
  }
}

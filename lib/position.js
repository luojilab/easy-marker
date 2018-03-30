/**
 * Position class
 *
 * @export
 * @class Position
 */
export default class Position {
  constructor() {
    this.y = 0
    this.x = 0
    this.width = 0
    this.height = 0
  }

  /**
   * Return position set whether or not
   *
   * @readonly
   * @memberof Position
   */
  get isSet() {
    return this.y !== 0 || this.x !== 0 || this.width !== 0 || this.height !== 0
  }


  /**
   * Set the position
   *
   * @param {any} position
   * @memberof Position
   */
  setAll(position) {
    this.x = position.x
    this.y = position.y
    this.width = position.width
    this.height = position.height
  }

  /**
   * Check if the current position is equal to the specified position
   *
   * @param {any} position
   * @returns {bool}
   * @memberof Position
   */
  equal(position) {
    return this.x === position.x
      && this.y === position.y
      && this.width === position.width
      && this.height === position.height
  }
}

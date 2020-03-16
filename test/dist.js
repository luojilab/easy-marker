var test = (function () {
  'use strict';

  /**
   * Base element class
   *
   * @export
   * @class BaseElement
   */
  class BaseElement {
    constructor() {
      this.element = null;
      this.container = document.body;
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
      this.container.appendChild(this.element);
    }

    get style() {
      return this.element.style
    }


    show() {
      this.style.display = 'block';
    }

    hide() {
      this.style.display = 'none';
    }

    get isShow() {
      return this.style.display === 'none'
    }

    destroy() {
      if (this.element) {
        this.element.parentElement.removeChild(this.element);
      }
    }
  }

  /**
   * Get the location of the clicked word
   *
   * @export
   * @param {HTMLElement} pElement
   * @param {number} x
   * @param {number}  y
   * @param {Array<string>} separators
   * @returns
   */
  function getClickWordsPosition(pElement, x, y, separators = ['']) {
    if (!pElement || (pElement && !pElement.childNodes)) return null
    let lineHeight = Number(window.getComputedStyle(pElement).lineHeight.replace('px', ''));
    for (let i = 0; i < pElement.childNodes.length; i++) {
      const node = pElement.childNodes[i];

      if (node.nodeName === '#text') {
        const words = split(node.textContent, separators);
        let currentTextIndex = 0;
        const range = document.createRange();

        for (let index = 0; index < words.length; index++) {
          const wordsLength = words[index].length;
          range.setStart(node, currentTextIndex);
          range.setEnd(node, currentTextIndex + wordsLength);
          const textRects = range.getClientRects();

          for (let j = 0; j < textRects.length; j++) {
            const rect = textRects[j];
            lineHeight = lineHeight || rect.height;
            const margin = (lineHeight - rect.height) / 2;
            if (rect.left < x && rect.right > x && rect.top - margin < y && rect.bottom + margin > y) {
              const rects = [];

              for (let k = 0; k < textRects.length; k++) {
                const textRect = textRects[k];
                rects.push(Object.assign({}, textRect, {
                  top: textRect.top - margin,
                  height: lineHeight,
                  bottom: textRect.bottom + margin,
                  left: textRect.left,
                  right: textRect.right,
                  width: textRect.width,
                }));
              }
              return {
                node,
                rects,
                textRects,
                index: currentTextIndex,
                wordsLength,
              }
            }
          }
          currentTextIndex += wordsLength;
        }
      } else if (node.nodeName === '#comment') {
        continue // eslint-disable-line no-continue
      } else {
        const result = getClickWordsPosition(node, x, y, separators);
        if (result) return result
      }
    }
    return null
  }

  /**
   * Get the location of the click
   *
   * @export
   * @param {HTMLElement| Node} pElement
   * @param {number} x
   * @param {number} y
   * @param {boolean} isStart
   */
  function getClickPosition(pElement, x, y, isStart) {
    if (!pElement || (!pElement && pElement.childNodes)) return null
    let lineHeight = Number(window.getComputedStyle(pElement).lineHeight.replace('px', ''));
    for (let i = 0; i < pElement.childNodes.length; i++) {
      const node = pElement.childNodes[i];
      let position = null;

      if (node.nodeName === '#text') {
        const words = [...node.textContent];
        const range = document.createRange();
        for (let index = 0; index < words.length; index++) {
          range.setStart(node, index);
          range.setEnd(node, index + 1);
          let preRect;
          let nextRect;
          const rects = range.getClientRects();
          let rect;
          if (rects.length > 1) {
            rect = rects[1]; // eslint-disable-line prefer-destructuring
          } else if (rects.length === 1) {
            rect = rects[0]; // eslint-disable-line prefer-destructuring
          } else {
            continue // eslint-disable-line no-continue
          }
          lineHeight = lineHeight || rect.height;
          const margin = (lineHeight - rect.height) / 2;
          if (rect.top - margin <= y && rect.bottom + margin >= y) {
            position = {
              x: rect.left,
              y: rect.top - margin,
              height: lineHeight,
              index,
              node,
            };

            try {
              range.setStart(node, index + 1);
              range.setEnd(node, index + 2);
              const nextRects = range.getClientRects();

              if (nextRects.length > 1) {
                nextRect = nextRects[1]; // eslint-disable-line prefer-destructuring
              } else if (nextRects.length === 1) {
                nextRect = nextRects[0]; // eslint-disable-line prefer-destructuring
              } else {
                nextRect = null;
              }
            } catch (error) {
              nextRect = null;
            }

            const isLineStart = preRect === undefined || (preRect && preRect.bottom <= rect.top);
            const isLineEnd = nextRect === null || (nextRect && nextRect.top >= rect.bottom);

            if (x < rect.right) {
              const isLeft = x < (rect.left + rect.right) / 2;
              if ((isLineStart && !isStart) || (!isLeft && !(isLineEnd && isStart))) {
                position.x += rect.width;
                position.index += 1;
              }
              return position
            }

            if (
              isLineEnd &&
              pElement.childNodes[i + 1] === undefined &&
              (!pElement.nextSibling || (pElement.nextSibling && pElement.nextSibling.nodeName !== '#text'))
            ) {
              if (!isStart) {
                position.x += rect.width;
                position.index += 1;
              }
              return position
            }
          }
          preRect = rect;
        }
      } else if (node.nodeName === '#comment') {
        continue // eslint-disable-line no-continue
      } else {
        const result = getClickPosition(node, x, y, isStart);
        if (result) return result
      }
    }
    return null
  }

  /**
   * Get the relative position of the touch
   *
   * @export
   * @param {TouchEvent} e
   * @param {Object} offset Offset of the clicked location
   * @returns
   */
  function getTouchPosition(e, offset = { x: 0, y: 0 }) {
    return {
      x: (e.clientX || e.changedTouches[0].clientX) + offset.x,
      y: (e.clientY || e.changedTouches[0].clientY) + offset.y,
    }
  }

  /**
   * Returns the distance between two points
   *
   * @export
   * @param {any} start
   * @param {any} end
   * @returns
   */
  function getDistance(start, end) {
    return Math.sqrt((start.x - end.x) ** 2 + (start.y - end.y) ** 2)
  }

  /**
   *
   *
   * @export
   * @param {any} pixelUnit
   * @returns
   */
  function anyToPx(pixelUnit) {
    if (typeof pixelUnit === 'number') return pixelUnit
    if (typeof pixelUnit === 'string') {
      if (pixelUnit.indexOf('px') > -1) return Number(pixelUnit.replace('px', ''))
      if (pixelUnit.indexOf('rem') > -1) {
        const baseFontSize = Number((document.documentElement.style.fontSize || '24px').replace('px', ''));
        return Number(pixelUnit.replace('rem', '')) * baseFontSize
      }
      return Number(pixelUnit)
    }
    return 0
  }

  /**
   * Get the text node areas
   *
   * @export
   * @param {any} node
   * @param {any} start
   * @param {any} end
   * @returns
   */
  function getNodeRects(node, start, end) {
    const range = document.createRange();
    const startIndex = start === undefined ? 0 : start;
    const endIndex = end === undefined ? node.textContent.length : end;
    try {
      range.setStart(node, startIndex);
      range.setEnd(node, endIndex);
      return domCollectionToArray(range.getClientRects())
    } catch (error) {
      console.error('EasyMarkerError:', error); // eslint-disable-line no-console
      return []
    }
  }

  /**
   * Converts the location relative to the screen to the location relative to the parent container
   *
   * @export
   * @param {Object} position
   * @param {any} containerPosition
   * @param {any} scrollTop
   */
  function screenRelativeToContainerRelative(position, offset) {
    if (!position.isSet) return position

    position.y -= offset.y;
    position.x -= offset.x;

    return position
  }

  /**
   * Split the string, the result contains the separator
   * E.g:
   *    separators:[',','!']
   *    'hello, world! => ['hello,', ' world!']
   * @export
   * @param {string} string
   * @param {Array<string>} [separators=['']]
   */
  function split(string, separators = ['']) {
    const separatorRegStr = separators.reduce((acc, separator) => {
      if (separator === '') return acc
      if (acc === '') return `\\${separator}`
      return `${acc}|\\${separator}`
    }, '');
    const separator = new RegExp(`(${separatorRegStr})`);
    const splitStrings = string.split(separator);
    const resultStrings = [];
    for (let i = 0; i < splitStrings.length; i += 2) {
      const mergedStr = splitStrings[i] + (splitStrings[i + 1] || '');
      if (mergedStr.length > 0) {
        resultStrings.push(mergedStr);
      }
    }
    return resultStrings
  }

  /**
   * Check whether in the rectangle
   *
   * @export
   * @param {number} x
   * @param {number} y
   * @param {ClientRect} rect
   * @returns {boolean}
   */
  function inRectangle(x, y, rect, margin) {
    return rect.top - margin <= y && rect.bottom + margin >= y && rect.left <= x && rect.right >= x
  }

  function copyRect(rect) {
    return {
      bottom: rect.bottom,
      height: rect.height,
      left: rect.left,
      right: rect.right,
      top: rect.top,
      width: rect.width,
    }
  }
  function domCollectionToArray(collection) {
    const array = [];
    for (let i = 0; i < collection.length; i++) {
      array.push(collection[i]);
    }
    return array
  }

  function matchSubString(originStr = '', subStr = '') {
    let matchSubstr = '';
    const formatSubStr = subStr.replace(/\s+/g, '');
    for (let i = 0, j = 0; i < originStr.length; i++) {
      if (j >= formatSubStr.length) {
        return matchSubstr
      }
      if (originStr[i] === formatSubStr[j]) {
        matchSubstr += originStr[i];
        j++;
      } else if (originStr[i].match(/\n|\r|\s/)) {
        if (matchSubstr !== '') {
          matchSubstr += originStr[i];
        }
      } else {
        j = 0;
        matchSubstr = '';
      }
    }
    return matchSubstr
  }

  const CursorType = {
    START: 'start',
    END: 'end',
  };

  const defaultOptions = {
    color: '#ff6b00',
  };

  /**
   * Cursor class
   *
   * @export
   * @class Cursor
   * @extends {BaseElement}
   */
  class Cursor extends BaseElement {
    /**
     * Creates an instance of Cursor.
     * @param {any} container
     * @param {any} type
     * @param {any} options
     * @memberof Cursor
     */
    constructor(container, type, options) {
      super();
      this.container = container;
      this.type = type;
      this.options = Object.assign({}, defaultOptions, options);
      this.$position = { x: 0, y: 0 };
      this.$height = 0;
      this.touchCallbackStack = [];
      this.topPoint = null;
      this.lineElement = null;
      this.bottomPoint = null;
      this.createElement();
      this.mount();
    }

    set position(val) {
      const { x, y } = val;
      this.$position = { x, y };

      this.moveTo(x, y);
    }

    get position() {
      return this.$position
    }

    get height() {
      return this.$height
    }

    set height(val) {
      if (val !== this.$height) {
        this.$height = val;
        this.setCursorSize(val);
      }
    }

    get width() {
      return this.height / 4
    }
    /**
     * Move to the specified location
     *
     * @param {number} x px
     * @param {number} y px
     * @memberof Cursor
     */
    moveTo(x, y) {
      this.style.top = `${y - this.width}px`;
      this.style.left = `${x - (this.width / 2)}px`;
    }

    /**
     * Create the element
     *
     * @override
     * @memberof Cursor
     */
    createElement() {
      this.element = document.createElement('div');
      this.style.userSelect = 'none';
      this.style.webkitUserSelect = 'none';
      this.style.zIndex = '2';
      this.style.transition = 'top 0.1s, left 0.1s';
      this.style.display = 'none';
      this.style.position = 'absolute';

      this.topPoint = document.createElement('div');
      this.topPoint.style.borderRadius = '50%';
      this.topPoint.style.margin = 'auto';

      this.lineElement = document.createElement('div');
      this.lineElement.style.margin = 'auto';
      this.lineElement.style.backgroundColor = this.options.color;

      this.bottomPoint = document.createElement('div');
      this.bottomPoint.style.borderRadius = '50%';
      this.bottomPoint.style.margin = 'auto';

      if (this.type === CursorType.START) {
        this.topPoint.style.backgroundColor = this.options.color;
      } else {
        this.bottomPoint.style.backgroundColor = this.options.color;
      }

      this.element.appendChild(this.topPoint);
      this.element.appendChild(this.lineElement);
      this.element.appendChild(this.bottomPoint);
    }

    /**
     * Set the size of the cursor
     *
     * @param {number} size
     * @memberof Cursor
     */
    setCursorSize(size) {
      const pointDiameter = `${this.width}px`;

      this.style.width = pointDiameter;

      this.topPoint.style.height = pointDiameter;
      this.topPoint.style.width = pointDiameter;
      this.bottomPoint.style.height = pointDiameter;
      this.bottomPoint.style.width = pointDiameter;

      this.lineElement.style.height = `${size}px`;
      this.lineElement.style.width = `${size / 15}px`;
    }

    /**
     * Check if it is in the region of the cursor
     *
     * @param {Object} position
     * @param {number} position.x
     * @param {number} position.y
     * @memberof Cursor
     */
    inRegion(position = {}) {
      const maxDistance = this.height;
      let distance = Number.MAX_SAFE_INTEGER;
      if (position.y > this.position.y && position.y < this.position.y + this.height) {
        distance = Math.abs(position.x - this.position.x);
      }
      if (position.y >= this.position.y + this.with) {
        distance = getDistance(position, { x: this.position.x, y: this.position.y + this.height });
      }
      if (position.y <= this.position.y) {
        distance = getDistance(position, this.position);
      }
      return { inRegion: distance <= maxDistance, distance }
    }
  }

  /**
   *
   *
   * @export
   * @extends {BaseElement}
   */
  class Menu extends BaseElement {
    constructor(container, options = {}) {
      super();
      this.container = container;
      this.handler = null;
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
      };

      if (options.style) {
        Object.assign(this.option.style.menu, options.style.menu);
        Object.assign(this.option.style.triangle, options.style.triangle);
        Object.assign(this.option.style.item, options.style.item);
        Object.assign(this.option.style.icon, options.style.icon);
      }

      this.easyMarker = null;
      this.menuElement = null;
      this.itemMap = new Map();
      this.positionRange = {
        top: 0,
        bottom: 0,
        left: 0,
      };
      this.windowWidth = document.documentElement.clientWidth;
      this.ticking = false;
      this.height = 0;
      this.createElement();
      this.mount();
      this.hide();
    }

    createElement() {
      const wrapper = document.createElement('div');
      wrapper.style.position = 'absolute';
      wrapper.style.width = '100%';
      wrapper.style.textAlign = 'center';
      wrapper.style.lineHeight = '0';
      wrapper.style.zIndex = '10';
      wrapper.style.transform = 'translateY(-100%)';
      wrapper.style.webkitTransform = 'translateY(-100%)';
      wrapper.style.transition = 'transform 0.2s ease, opacity 0.2s ease';

      const menu = document.createElement('div');
      menu.classList.add('em-menu');
      Object.assign(menu.style, this.option.style.menu);

      const bottomTriangle = document.createElement('div');
      bottomTriangle.classList.add('em-menu-triangle');
      Object.assign(bottomTriangle.style, this.option.style.triangle);

      wrapper.appendChild(menu);
      wrapper.appendChild(bottomTriangle);
      this.option.items.forEach((item) => {
        const menuItem = this.createMenuItemElement(item.text, item.iconName, item.style, item.iconStyle);
        this.itemMap.set(menuItem, item);
        menu.appendChild(menuItem);
      });
      this.menuElement = menu;
      this.element = wrapper;
    }

    createMenuItemElement(text, iconName, itemStyle, iconStyle) {
      // eslint-disable-line class-methods-use-this
      const menuItem = document.createElement('span');
      menuItem.classList.add('em-menu-item');
      Object.assign(menuItem.style, this.option.style.item, itemStyle);
      if (iconName) {
        const iconItem = document.createElement('span');
        Object.assign(iconItem.style, this.option.style.icon, iconStyle);
        iconItem.className = 'em-menu-item-icon '.concat(iconName);
        const textNode = document.createTextNode(text);
        menuItem.appendChild(iconItem);
        menuItem.appendChild(textNode);
      } else {
        const textNode = document.createTextNode(text);
        menuItem.appendChild(textNode);
      }

      return menuItem
    }

    setPosition(top, bottom, left) {
      this.positionRange.top = top;
      this.positionRange.bottom = bottom;
      this.positionRange.left = left;
    }

    hide() {
      this.style.visibility = 'hidden';
      this.style.opacity = '0';
    }

    show() {
      let relativeTop = 0;
      if (!this.height) {
        this.height = Number((window.getComputedStyle(this.menuElement).height || '').replace('px', ''));
      }
      const { top: containerTop } = this.container.getBoundingClientRect();
      if (containerTop < 0 && this.positionRange.bottom < -containerTop) {
        relativeTop = this.positionRange.bottom;
        this.style.position = 'absolute';
      } else if (this.positionRange.top - this.height - this.option.topOffset > -containerTop) {
        relativeTop = this.positionRange.top;
        this.style.position = 'absolute';
      } else {
        // relativeTop = this.option.topOffset + menuHeight - containerTop
        this.style.position = 'fixed';
        relativeTop = this.option.topOffset + this.height;
      }

      // this.style.display = 'block'
      this.style.visibility = 'visible';
      this.style.top = `${relativeTop}px`;
      this.style.left = `${Math.floor(this.positionRange.left / this.windowWidth) * this.windowWidth}px`;
      this.style.opacity = '1';
    }

    handleTap(e, {
      start,
      end,
      content,
      markdown,
    }) {
      const tapTarget = this.getTapTarget(e.target);
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
      };
      const item = this.itemMap.get(tapTarget);
      if (item.id && this.easyMarker.menuOnClick) {
        this.easyMarker.menuOnClick(item.id, selection);
      } else {
        item.handler.call(this.easyMarker, selection);
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
          this.show();
          this.ticking = false;
        });
        this.ticking = true;
      }
    }
  }

  /**
   * Position class
   *
   * @export
   * @class Position
   */
  class Position {
    constructor() {
      this.y = 0;
      this.x = 0;
      this.width = 0;
      this.height = 0;
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
      this.x = position.x;
      this.y = position.y;
      this.width = position.width;
      this.height = position.height;
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

  class Mask extends BaseElement {
    constructor(container, option) {
      super();
      const defaultOptions = {
        color: '#FEFFCA',
        opacity: 0.5,
        animateDuration: 100,
      };
      this.container = container;
      this.option = Object.assign(defaultOptions, option);
      this.paths = [];
      this.position = {
        header: new Position(),
        body: new Position(),
        footer: new Position(),
      };
      this.animating = false;
      this.animateStartTime = 0;
      this.animateEndTime = 0;
      this.animatePercent = 0;
      this.polygonElement = null;
      this.createElement();
      this.mount();
    }

    get top() {
      return this.position.header.y
    }

    get left() {
      return this.position.header.x
    }

    get height() {
      return this.position.header.height + this.position.body.height + this.position.footer.height
    }

    createElement() {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      // svg.style.zIndex = this.option.zIndex
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.position = 'absolute';
      svg.style.top = '0';
      svg.style.left = '0';
      svg.style.overflow = 'visible';

      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.style.fill = this.option.color;
      polygon.style.strokeWidth = 0;
      polygon.style.strokeOpacity = this.option.opacity;
      polygon.style.opacity = this.option.opacity;
      polygon.style.transition = 'opacity 0.2s ease';

      svg.appendChild(polygon);
      this.element = svg;
      this.polygonElement = polygon;
    }

    render(headerPosition, bodyPosition, footerPosition) {
      const { header, body, footer } = this.position;
      if (
        this.paths.length !== 0 &&
        header.equal(headerPosition) &&
        body.equal(bodyPosition) &&
        footer.equal(footerPosition)
      ) {
        return
      }
      this.polygonElement.style.opacity = this.option.opacity;
      const fromPosition = this.position;
      this.position.header.setAll(headerPosition);
      this.position.body.setAll(bodyPosition);
      this.position.footer.setAll(footerPosition);

      this.animateStartTime = Date.now();
      this.animateEndTime = this.animateStartTime + this.option.animateDuration;
      this.animatePercent = 0;
      if (!this.animating) {
        this.animating = true;
        this.animated(fromPosition);
      }
    }

    animated(from) {
      const realPercent = (Date.now() - this.animateStartTime) / (this.animateEndTime - this.animateStartTime);
      let nextPercent = 0;

      if (realPercent >= 1) {
        nextPercent = 1;
        this.animatePercent = 1;
      } else {
        const nextAnimationPercent = 1000 / 60 / this.option.animateDuration + (realPercent - this.animatePercent) * 1.3;
        this.animatePercent += nextAnimationPercent;
        nextPercent = nextAnimationPercent > 1 ? 1 : nextAnimationPercent / (1 - realPercent);
      }

      const nextHeaderPosition = this.constructor.getAnimateFrame(from.header, this.position.header, nextPercent);
      const nextBodyPosition = this.constructor.getAnimateFrame(from.body, this.position.body, nextPercent);
      const nextFooterPosition = this.constructor.getAnimateFrame(from.footer, this.position.footer, nextPercent);
      const nextPosition = {
        header: nextHeaderPosition,
        body: nextBodyPosition,
        footer: nextFooterPosition,
      };
      this.paths = this.constructor.getPaths(nextPosition);
      const points = this.paths.map(([x, y]) => `${x},${y}`).join(' ');
      this.polygonElement.setAttribute('points', points);
      if (realPercent >= 1) {
        this.animating = false;
        return
      }
      window.requestAnimationFrame(() => this.animated(nextPosition));
    }

    reset() {
      this.paths = [];
      this.polygonElement.style.opacity = '0';
      this.polygonElement.setAttribute('points', '');
    }

    static getAnimateFrame(from, to, percent) {
      const framePosition = new Position();
      framePosition.x = from.x + (to.x - from.x) * percent;
      framePosition.y = from.y + (to.y - from.y) * percent;
      framePosition.height = from.height + (to.height - from.height) * percent;
      framePosition.width = from.width + (to.width - from.width) * percent;
      return framePosition
    }

    static getPaths(position) {
      const { header, body, footer } = position;
      const paths = [];
      if (header.isSet) {
        paths.push([header.x, header.y]);
        paths.push([header.x + header.width, header.y]);
        paths.push([header.x + header.width, header.y + header.height]);
      }
      if (body.isSet) {
        paths.push([body.x + body.width, body.y]);
        paths.push([body.x + body.width, body.y + body.height]);
      }
      if (footer.isSet) {
        paths.push([footer.x + footer.width, footer.y]);
        paths.push([footer.x + footer.width, footer.y + footer.height]);
        paths.push([footer.x, footer.y + footer.height]);
        paths.push([footer.x, footer.y]);
      }
      if (body.isSet) {
        paths.push([body.x, body.y + body.height]);
        paths.push([body.x, body.y]);
      }
      if (header.isSet) {
        paths.push([header.x, header.y + header.height]);
      }

      return paths
    }
  }

  /**
   * Text node
   *
   * @export
   * @class TextNode
   */
  class TextNode {
    constructor(node, offset) {
      this.node = node;
      this.offset = offset;
    }

    /**
     * Get the selected text
     *
     * @static
     * @param {any} startTextNode
     * @param {any} endTextNode
     * @memberof TextNode
     */
    static getSelectText(startTextNode, endTextNode) {
      try {
        const { text } = this.getSelectNodeRectAndText(
          startTextNode.node,
          endTextNode.node,
          startTextNode.offset,
          endTextNode.offset
        );
        return text
      } catch (error) {
        console.error('EasyMarkerError:', error); // eslint-disable-line no-console
        return ''
      }
    }

    /**
     * Get the selected area
     *
     * @static
     * @param {any} startTextNode
     * @param {any} endTextNode
     * @returns
     * @memberof TextNode
     */
    static getSelectRects(startTextNode, endTextNode) {
      const headerLine = new Position();
      const bodyLine = new Position();
      const footerLine = new Position();

      if (!startTextNode || !endTextNode) {
        return {
          header: headerLine,
          body: bodyLine,
          footer: footerLine,
        }
      }

      if (startTextNode.node.nodeName !== '#text' || endTextNode.node.nodeName !== '#text') {
        // eslint-disable-next-line no-console
        console.error('The parameters for getting the selection rect should be a TextNode', {
          startTextNode,
          endTextNode,
        });
        return {
          header: headerLine,
          body: bodyLine,
          footer: footerLine,
        }
      }
      let rects;
      try {
        ({ rects } = this.getSelectNodeRectAndText(
          startTextNode.node,
          endTextNode.node,
          startTextNode.offset,
          endTextNode.offset
        ));
      } catch (error) {
        console.error('EasyMarkerError:', error); // eslint-disable-line no-console
        rects = [];
      }

      const lineMergedRects = [];
      rects.forEach((rect) => {
        if (lineMergedRects.length > 0) {
          const lastLineMergedRect = lineMergedRects[lineMergedRects.length - 1];
          const safetyBoundary = lastLineMergedRect.height / 2;
          if (Math.abs(lastLineMergedRect.top - rect.top) < safetyBoundary
          && Math.abs(lastLineMergedRect.bottom - rect.bottom) < safetyBoundary) {
            lastLineMergedRect.width += rect.width;
            lastLineMergedRect.height = lastLineMergedRect.height - rect.height > 0
              ? lastLineMergedRect.height : rect.height;
            lastLineMergedRect.top = lastLineMergedRect.top - rect.top < 0
              ? lastLineMergedRect.top : rect.top;
            lastLineMergedRect.bottom = lastLineMergedRect.bottom - rect.bottom > 0
              ? lastLineMergedRect.bottom : rect.bottom;
          } else {
            lineMergedRects.push(copyRect(rect));
          }
        } else {
          lineMergedRects.push(copyRect(rect));
        }
      });

      let startLineHeight = 0;
      const leftArr = [];
      const rightArr = [];
      if (lineMergedRects.length > 0) {
        const headRect = lineMergedRects.shift();
        startLineHeight =
          Number(window.getComputedStyle(startTextNode.node.parentElement).lineHeight.replace('px', '')) ||
          headRect.height;
        headerLine.x = headRect.left;
        headerLine.width = headRect.width;
        headerLine.y = headRect.top - (startLineHeight - headRect.height) / 2;
        headerLine.height = startLineHeight;
        leftArr.push(headerLine.x);
        rightArr.push(headRect.right);
      }

      let endLineHight = 0;
      if (lineMergedRects.length > 0) {
        const footRect = lineMergedRects.pop();
        endLineHight =
          Number(window.getComputedStyle(endTextNode.node.parentElement).lineHeight.replace('px', '')) || footRect.height;
        footerLine.x = footRect.left;
        footerLine.width = footRect.width;
        footerLine.y = footRect.top - (endLineHight - footRect.height) / 2;
        footerLine.height = endLineHight;

        leftArr.push(footerLine.x);
        rightArr.push(footRect.right);
      }

      if (lineMergedRects.length > 0) {
        let maxRight = 0;
        lineMergedRects.forEach((lineRect) => {
          if (bodyLine.x && bodyLine.width) {
            if (lineRect.left < bodyLine.x) {
              bodyLine.x = lineRect.left;
            }

            if (lineRect.width > bodyLine.width) {
              bodyLine.width = lineRect.width;
            }
            if (maxRight < lineRect.right) {
              maxRight = lineRect.right;
            }
          } else {
            bodyLine.x = lineRect.left;
            bodyLine.width = lineRect.width;
            maxRight = lineRect.right;
          }
        });
        leftArr.push(bodyLine.x);
        rightArr.push(maxRight);
      }
      const minLeft = Math.min(...leftArr);
      if (minLeft !== Infinity) {
        bodyLine.x = minLeft;
      }
      const maxRight = Math.max(...rightArr);
      if (maxRight !== -Infinity) {
        bodyLine.width = maxRight - bodyLine.x;
      }

      bodyLine.y = headerLine.y + startLineHeight;
      if (footerLine.isSet) {
        bodyLine.height = footerLine.y - bodyLine.y;
      } else {
        footerLine.x = headerLine.x;
        footerLine.y = headerLine.y + startLineHeight;
      }

      return {
        header: headerLine,
        body: bodyLine,
        footer: footerLine,
      }
    }

    static getSelectNodeRectAndText(startNode, endNode, startIndex, endIndex) {
      const result = {
        rects: [],
        text: '',
      };
      if (startNode.childNodes.length > 0 && startNode.nodeName !== 'SCRIPT' && startNode.nodeName !== 'STYLE') {
        const childNode = startNode.childNodes[0];
        const { text, rects } = this.getSelectNodeRectAndText(childNode, endNode, 0, endIndex);
        result.rects.push(...rects);
        result.text += text;
        return result
      }

      if (startNode.nodeName === '#text') {
        const textEndIndex = startNode === endNode ? endIndex : startNode.textContent.length;
        result.rects.push(...getNodeRects(startNode, startIndex, textEndIndex));
        result.text += startNode.textContent.substring(startIndex, textEndIndex);
      }

      if (startNode.nodeName === 'IMG') {
        result.rects.push(startNode.getBoundingClientRect());
      }

      if (startNode === endNode) {
        return result
      }

      const nextNode = startNode.nextSibling;
      if (nextNode) {
        const { text, rects } = this.getSelectNodeRectAndText(nextNode, endNode, 0, endIndex);
        result.rects.push(...rects);
        result.text += text;
      } else {
        let currentNode = startNode.parentNode;
        while (currentNode && currentNode.nextSibling === null) {
          currentNode = currentNode.parentNode;
        }
        if (currentNode) {
          const { text, rects } = this.getSelectNodeRectAndText(currentNode.nextSibling, endNode, 0, endIndex);
          result.rects.push(...rects);
          result.text += text;
        } else {
          throw new Error('Invalid end node')
        }
      }
      return result
    }
  }

  /**
   * Highlight
   *
   * @export
   * @class Highlight
   * @extends {BaseElement}
   */
  class Highlight extends BaseElement {
    constructor(container, option) {
      super();
      const defaultOptions = {
        color: '#FEFFCA',
        opacity: 1,
        type: 'highlight',
        // margin: '0.1rem',
      };
      this.container = container;
      this.option = Object.assign(defaultOptions, option);
      this.type = this.option.type;
      this.option.margin = anyToPx(this.option.margin);
      this.lineMap = new Map();
      // this.onClick = () => { }
      this.createElement();
      this.mount();
      this.id = 0;
      this.easyMarker = null;
    }

    getID() {
      return this.id++
    }

    /**
     *
     *
     * @param {Selection} selection
     * @param {any} id
     * @param {any} meta
     * @param {Object} offset
     * @param {number} offset.x
     * @param {number} offset.y
     * @memberof Highlight
     */
    highlight(selection, id, meta = {}, offset) {
      const lineID = id === undefined || id === null ? this.getID() : id;
      const startTextNode = new TextNode(selection.anchorNode, selection.anchorOffset);
      const endTextNode = new TextNode(selection.focusNode, selection.focusOffset);
      let lineHeight = Number(window.getComputedStyle(selection.anchorNode.parentElement).lineHeight.replace('px', ''));
      let rects;
      let text;
      try {
        ({ rects, text } = TextNode.getSelectNodeRectAndText(
          startTextNode.node,
          endTextNode.node,
          startTextNode.offset,
          endTextNode.offset
        ));
      } catch (error) {
        console.error('EasyMarkerError:', error); // eslint-disable-line no-console
        rects = [];
        text = '';
      }

      const relativeRects = [];
      const points = rects.map((rect) => {
        const relativeRect = {
          top: rect.top - offset.y,
          bottom: rect.bottom - offset.y,
          height: rect.height,
          width: rect.width,
          left: rect.left - offset.x,
          right: rect.right - offset.x,
        };
        relativeRects.push(relativeRect);
        lineHeight = lineHeight || rect.height;
        const margin = this.option.margin || (lineHeight - rect.height) / 4;
        return this.constructor.rectToPointArray(rect, offset, margin)
      });
      let markdown;
      if (this.easyMarker && this.easyMarker.markdown) {
        ({ markdown } = this.easyMarker.markdown.getSelectMarkdown(
          startTextNode.node,
          endTextNode.node,
          startTextNode.offset,
          endTextNode.offset
        ));
      } else {
        markdown = '';
      }

      const selectionContent = Object.assign({
        toString() {
          return text
        },
        toMarkdown() {
          return markdown
        },
      }, selection);

      this.lineMap.set(lineID, {
        selection: selectionContent, points, relativeRects, meta, lineHeight,
      });

      return lineID
    }

    render() {
      this.removeAllRectangle();
      this.lineMap.forEach((line) => {
        line.points.forEach((points) => {
          if (this.type === 'underline') {
            this.element.appendChild(this.createLine(points));
          } else {
            this.element.appendChild(this.createRectangle(points));
          }
        });
      });
    }

    /**
     *
     *
     * @param {Object[]} lines
     * @param {Selection} lines[].selection
     * @param {any} [lines[].id]
     * @param {any} [lines[].meta]
     * @memberof Highlight
     */
    highlightLines(lines, offset) {
      this.lineMap.clear();
      const ids = lines.map(({ selection, id, meta }) => this.highlight(selection, id, meta, offset));
      this.render();
      return ids
    }

    /**
     *
     *
     * @param {Selection} selection
     * @param {*} id
     * @param {*} meta
     * @param {Object} offset
     * @memberof Highlight
     */
    highlightLine(selection, id, meta, offset) {
      const lineID = this.highlight(selection, id, meta, offset);
      this.render();
      return lineID
    }

    /**
     *
     *
     * @param {any} id
     * @returns {boolean}
     * @memberof Highlight
     */
    cancelHighlightLine(id) {
      this.lineMap.delete(id);
      this.render();
    }

    createElement() {
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.style.zIndex = '1';
      svg.style.width = '100%';
      svg.style.height = '100%';
      svg.style.position = 'absolute';
      svg.style.top = '0';
      svg.style.left = '0';
      svg.style.overflow = 'visible';
      this.element = svg;
    }

    createLine(pointList) {
      const x1 = pointList[2][0];
      const y1 = pointList[2][1];
      const x2 = pointList[3][0];
      const y2 = pointList[3][1];
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.style.stroke = this.option.color;
      line.setAttribute('x1', x1);
      line.setAttribute('y1', y1);
      line.setAttribute('x2', x2);
      line.setAttribute('y2', y2);
      return line
    }

    createRectangle(pointList) {
      const points = pointList.reduce((acc, [x, y]) => (acc === '' ? `${x},${y}` : `${acc} ${x},${y}`), '');
      const polygon = document.createElementNS('http://www.w3.org/2000/svg', 'polygon');
      polygon.style.fill = this.option.color;
      polygon.style.strokeWidth = 0;
      polygon.style.strokeOpacity = this.option.opacity;
      polygon.style.opacity = this.option.opacity;
      polygon.setAttribute('points', points);
      return polygon
    }

    handleTap(e) {
      const { x, y } = getTouchPosition(e);
      const { top, left } = this.container.getBoundingClientRect();
      let clickLine;
      this.lineMap.forEach((line, id) => {
        for (let i = 0; i < line.relativeRects.length; i++) {
          const rect = line.relativeRects[i];
          const margin = (line.lineHeight - rect.height) / 2;
          if (inRectangle(x - left, y - top, rect, margin)) {
            clickLine = { id, line };
            break
          }
        }
      });
      if (clickLine && this.easyMarker && this.easyMarker.highlightLineClick) {
        this.easyMarker.highlightLineClick(clickLine.id, clickLine.line.meta, clickLine.line.selection);
        return true
      }
      return false
    }

    removeAllRectangle() {
      while (this.element.firstChild) {
        this.element.removeChild(this.element.firstChild);
      }
    }
    /**
     *
     *
     * @static
     * @param {ClientRect} rect
     * @param {Object} offset
     * @param {number} offset.x
     * @param {number} offset.y
     * @memberof Highlight
     */
    static rectToPointArray(rect, offset, margin) {
      const points = [];
      if (rect.width === 0) return points

      points.push([rect.left - margin, rect.top - margin]);
      points.push([rect.right + margin, rect.top - margin]);
      points.push([rect.right + margin, rect.bottom + margin]);
      points.push([rect.left - margin, rect.bottom + margin]);

      points.forEach((point) => {
        point[0] -= offset.x;
        point[1] -= offset.y;
      });
      return points
    }
  }

  const defaultOptions$1 = Object.freeze({
    H1: text => `\n# ${text}\n\n`,
    H2: text => `\n## ${text}\n\n`,
    H3: text => `\n### ${text}\n\n`,
    H4: text => `\n#### ${text}\n\n`,
    H5: text => `\n##### ${text}\n\n`,
    H6: text => `\n###### ${text}\n\n`,
    P: text => `${text}\n\n`,
    FIGCAPTION: text => `${text}\n\n`,
    STRONG: text => `**${text}**`,
    B: text => `**${text}**`,
    EM: text => `*${text}*`,
    I: text => `*${text}*`,
    S: text => `~~${text}~~`,
    INS: text => `++${text}++`,
    IMG: option => `![${option.alt}](${option.src}?size=${option.width}x${option.height})\n`,
    UL: (text, option) => {
      if (option.listLevel > 1) {
        return `\n${text}`
      }
      return `\n${text}\n\n`
    },
    OL: (text, option) => {
      if (option.listLevel > 1) {
        return `\n${text}`
      }
      return `\n${text}\n\n`
    },
    LI: (text, option) => {
      let spaceString = '';
      for (let i = 1; i < option.itemLevel; i++) { spaceString += '    '; }
      let endString = '\n';
      if (option.hasChild || option.isLastOne) {
        endString = '';
      }
      if (option.type === 'UL') { return `${spaceString}- ${text}${endString}` }
      return `${spaceString}${option.index}. ${text}${endString}`
    },
  });

  /**
   * Markdown
   *
   * @export
   * @class Markdown
   */
  class Markdown {
    constructor(container, options = {}) {
      this.container = container;
      this.wrapMarkdown = Markdown.wrapMarkdown;
      this.options = Object.assign({}, defaultOptions$1, options);
    }

    /**
     * Get the selected markdown
     *
     * @param {Node} startNode
     * @param {Node} endNode
     * @param {Number} startIndex
     * @param {number} endIndex
     * @param {Stack} markdownStack
     */
    getSelectMarkdown(startNode, endNode, startIndex, endIndex, markdownStack) {
      const result = {
        markdown: '',
      };
      let popText = '';
      if (markdownStack === undefined) markdownStack = [];
      if (startNode.childNodes.length > 0 && startNode.nodeName !== 'SCRIPT' && startNode.nodeName !== 'STYLE') {
        const childNode = startNode.childNodes[0];
        const { markdown } = this.getSelectMarkdown(childNode, endNode, 0, endIndex, markdownStack);
        result.markdown = markdown;
        return result
      }

      if (startNode.nodeName === '#text') {
        let node = startNode;
        const tempMarkdownStack = [];
        const textEndIndex = startNode === endNode ? endIndex : startNode.textContent.length;
        const currentText = startNode.textContent.substring(startIndex, textEndIndex).replace(/(^\s*)|(\s*$)/g, '');
        if (markdownStack.length !== 0 && node.parentNode === markdownStack[markdownStack.length - 1].node) {
          popText = currentText;
        }
        let isContainer = false;
        while (!isContainer
          && (markdownStack.length === 0 || node.parentNode !== markdownStack[markdownStack.length - 1].node)) {
          if (node === this.container) isContainer = true;
          let text = '';
          if (node.nodeName === '#text') {
            text = currentText;
          }
          node = node.parentNode;
          tempMarkdownStack.push({
            node,
            text,
          });
        }
        while (tempMarkdownStack.length !== 0) {
          markdownStack.push(tempMarkdownStack.pop());
        }
      }

      if (startNode.nodeName === 'IMG') {
        if (markdownStack.length > 0) {
          markdownStack[markdownStack.length - 1].text += this.wrapMarkdown(startNode, this.options);
        } else {
          result.markdown += this.wrapMarkdown(startNode, this.options);
        }
      }

      if (startNode === endNode) {
        if (markdownStack.length !== 0) {
          const popMarkdown = markdownStack.pop();
          popMarkdown.text += popText;
          result.markdown = this.wrapMarkdown(popMarkdown.node, this.options, popMarkdown.text);
          if (markdownStack.length !== 0) { markdownStack[markdownStack.length - 1].text += result.markdown; }
        }
        while (markdownStack.length !== 0) {
          const popMarkdown = markdownStack.pop();
          result.markdown = this.wrapMarkdown(popMarkdown.node, this.options, popMarkdown.text);
          if (markdownStack.length !== 0) { markdownStack[markdownStack.length - 1].text += result.markdown; }
        }
        return result
      }
      const nextNode = startNode.nextSibling;
      if (nextNode) {
        const { markdown } = this.getSelectMarkdown(nextNode, endNode, 0, endIndex, markdownStack);
        if (markdownStack.length > 0) {
          markdownStack[markdownStack.length - 1].text += markdown;
        } else {
          result.markdown += markdown;
        }
      } else {
        let currentNode = startNode.parentNode;
        let popMarkdown = markdownStack.pop();
        popMarkdown.text += popText;
        result.markdown += this.wrapMarkdown(popMarkdown.node, this.options, popMarkdown.text);
        if (markdownStack.length !== 0) { markdownStack[markdownStack.length - 1].text += result.markdown; }
        while (currentNode && currentNode.nextSibling === null) {
          currentNode = currentNode.parentNode;
          popMarkdown = markdownStack.pop();
          popMarkdown.text += popText;
          result.markdown = this.wrapMarkdown(popMarkdown.node, this.options, popMarkdown.text);
          if (markdownStack.length !== 0) { markdownStack[markdownStack.length - 1].text += result.markdown; }
        }
        if (currentNode) {
          const { markdown } = this.getSelectMarkdown(currentNode.nextSibling, endNode, 0, endIndex, markdownStack);
          if (markdownStack.length !== 0) {
            markdownStack[markdownStack.length - 1].text += markdown;
          } else {
            result.markdown = markdown;
          }
        } else {
          throw new Error('Invalid end node')
        }
      }
      return result
    }

    static wrapMarkdown(node, options, text) {
      if (node.nodeName === 'IMG') {
        const imgOption = {
          alt: node.alt,
          src: node.src,
          width: node.width,
          height: node.height,
        };
        return options[node.nodeName] ? options[node.nodeName](imgOption) : ''
      } else if (node.nodeName === 'LI') {
        let itemLevel = 1;
        let tempNode = node.parentNode;
        while (tempNode.parentNode) {
          tempNode = tempNode.parentNode;
          if (tempNode.nodeName === node.parentNode.nodeName) itemLevel++;
        }
        let hasChild = false;
        if (domCollectionToArray(node.childNodes)
          .some(childNode => childNode.nodeName === 'UL' || childNode.nodeName === 'OL')) {
          hasChild = true;
        }
        let isLastOne = false;
        if (!node.nextElementSibling) {
          isLastOne = true;
        }
        const option = {
          type: node.parentNode.nodeName,
          isLastOne,
          itemLevel,
          hasChild,
          index: [].indexOf.call(node.parentNode.children, node) + 1,
        };
        return options[node.nodeName] ? options[node.nodeName](text, option) : text
      } else if (node.nodeName === 'UL' || node.nodeName === 'OL') {
        let listLevel = 1;
        let tempNode = node.parentNode;
        while (tempNode.parentNode) {
          tempNode = tempNode.parentNode;
          if (tempNode.nodeName === node.nodeName) listLevel++;
        }
        return options[node.nodeName] ? options[node.nodeName](text, { listLevel }) : text
      }
      return options[node.nodeName] ? options[node.nodeName](text) : text
    }
  }

  const EventType = {
    TOUCH_START: 'touchstart',
    TOUCH_MOVE: 'touchmove',
    TOUCH_MOVE_THROTTLE: 'touchmovethrottle',
    TOUCH_END: 'touchend',
    TAP: 'tap',
    LONG_TAP: 'longtap',
  };

  /**
   * Touch Event class
   *
   * @export
   * @class TouchEvent
   */
  class TouchEvent {
    constructor(element, options) {
      this.options = {
        longTapTime: 600,
        tapTime: 500,
        slideDistance: 20,
        throttleTime: 50,
      };
      this.element = element;
      this.options = Object.assign(this.options, options);
      this.touchStartCallbacks = [];
      this.touchMoveCallbacks = [];
      this.touchMoveThrottleCallbacks = [];
      this.touchEndCallbacks = [];
      this.tapCallbacks = [];
      this.longTapCallbacks = [];
      this.hook = () => true;

      this.touchStartPosition = { x: 0, y: 0 };
      this.longTapTimerHandler = null;
      this.touchMoveTimerHandler = null;
      this.touchStartTime = Date.now();
      this.lastMoveTime = Date.now();
      this.onTouchStart = this.onTouchStart.bind(this);
      this.onTouchMove = this.onTouchMove.bind(this);
      this.onTouchEnd = this.onTouchEnd.bind(this);
      this.element.addEventListener('touchstart', this.onTouchStart);
      this.element.addEventListener('touchmove', this.onTouchMove);
      this.element.addEventListener('touchend', this.onTouchEnd);
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
          this.touchStartCallbacks.push(callback);
          break
        case EventType.TOUCH_MOVE:
          this.touchMoveCallbacks.push(callback);
          break
        case EventType.TOUCH_MOVE_THROTTLE:
          this.touchMoveThrottleCallbacks.push(callback);
          break
        case EventType.TOUCH_END:
          this.touchEndCallbacks.push(callback);
          break
        case EventType.TAP:
          this.tapCallbacks.push(callback);
          break
        case EventType.LONG_TAP:
          this.longTapCallbacks.push(callback);
          break
        default:
          break
      }
    }

    registerHook(callback) {
      this.hook = callback;
    }

    onTouchStart(e) {
      if (!this.hook('touchstart', e)) return
      this.touchStartCallbacks.forEach(callback => callback(e));

      this.longTapTimerHandler = setTimeout(() => {
        this.onLongTap(e);
      }, this.options.longTapTime);

      this.touchStartPosition = getTouchPosition(e);
      this.touchStartTime = Date.now();
    }

    onTouchMove(e) {
      if (!this.hook('touchmove', e)) return

      this.touchMoveCallbacks.forEach(callback => callback(e));

      clearTimeout(this.touchMoveTimerHandler);
      this.touchMoveTimerHandler = setTimeout(() => {
        this.onTouchMoveThrottle(e);
      }, this.options.throttleTime);
      if (Date.now() - this.lastMoveTime > this.options.throttleTime) {
        this.lastMoveTime = Date.now();
        this.onTouchMoveThrottle(e);
      }

      const currentPosition = getTouchPosition(e);
      const moveDistance = getDistance(currentPosition, this.touchStartPosition);
      if (moveDistance > this.options.slideDistance) {
        clearTimeout(this.longTapTimerHandler);
        this.longTapTimerHandler = null;
      }
    }

    onTouchEnd(e) {
      if (!this.hook('touchmove', e)) return

      this.touchEndCallbacks.forEach(callback => callback(e));

      clearTimeout(this.longTapTimerHandler);
      this.longTapTimerHandler = null;
      if (Date.now() - this.touchStartTime < this.options.tapTime) {
        const currentPosition = getTouchPosition(e);
        const moveDistance = getDistance(currentPosition, this.touchStartPosition);
        if (moveDistance < this.options.slideDistance) {
          e.preventDefault();
          const clickEvent = this.constructor.createMouseEvent('click', e);
          this.onTap(e);
          e.target.dispatchEvent(clickEvent);
        }
      }
    }

    onTouchMoveThrottle(e) {
      this.touchMoveThrottleCallbacks.forEach(callback => callback(e));
    }

    onTap(e) {
      if (!this.hook('tap', e)) return

      this.tapCallbacks.forEach(callback => callback(e));
    }

    onLongTap(e) {
      this.longTapCallbacks.forEach(callback => callback(e));
    }

    destroy() {
      this.element.removeEventListener('touchstart', this.onTouchStart);
      this.element.removeEventListener('touchmove', this.onTouchMove);
      this.element.removeEventListener('touchend', this.onTouchEnd);
    }

    static createMouseEvent(type, e) {
      const touch = e.changedTouches[0];
      const event = new MouseEvent(type);
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
      );
      event.forwardedTouchEvent = true;
      return event
    }
  }

  const SelectStatus = {
    NONE: 'none',
    SELECTING: 'selecting',
    FINISH: 'finish',
  };

  const EasyMarkerMode = {
    NODE: 'node',
    REGION: 'region',
  };

  const defaultOptions$2 = {
    menuItems: [],
    menuTopOffset: 0,
    cursor: {
      same: false,
    },
    scrollOffsetBottom: 100,
    scrollSpeedLevel: 4,
    mode: EasyMarkerMode.Node,
  };

  const preventDefaultCb = e => e.preventDefault();
  /**
   * A simple article  marker library
   * @example
   * // A simple example
   * const em = new EasyMarker({
   *   menuTopOffset: '2rem',
   *   menuItems: [
   *     {
   *       text: '划线笔记',
   *       id: 1
   *     },
   *     {
   *       text: '分享',
   *       style: {
   *         backgroundColor: '#407ff2',
   *         paddingLeft: '0.5rem'
   *       },
   *       id: 2
   *     },
   *     {
   *       text: '复制',
   *       id: 3
   *     }
   *   ],
   *  )
   *
   *  em.create(document.querySelector('.article-body'),
   *    document.body,
   *    document.querySelectorAll('.article-body>:not(.text)')
   *
   * // a markdown example
   * const em = new EasyMarker({
   * menuTopOffset:'2rem',
   * scrollSpeedLevel: 6,
   * scrollOffsetBottom: '1.5rem',
   *   menuItems: [
   *     {
   *       text: '划线笔记',
   *       id: 1,
   *       iconName:'iconfont icon-mark'
   *     },
   *     {
   *       text: '分享',
   *       style: {
   *         backgroundColor: '#407ff2',
   *         paddingLeft: '0.5rem'
   *       },
   *       id: 2,
   *       iconName:'iconfont icon-share'
   *     },
   *     {
   *       text: '复制',
   *       id: 3,
   *       iconName:'iconfont icon-copy'
   *     }
   *   ],
   * // Not required
   *  markdownOptions: {
   *   H1: text => `\n# ${text}\n\n`,
   *   H2: text => `\n## ${text}\n\n`,
   *   H3: text => `\n### ${text}\n\n`,
   *   H4: text => `\n#### ${text}\n\n`,
   *   H5: text => `\n##### ${text}\n\n`,
   *   H6: text => `\n###### ${text}\n\n`,
   *   P: text => `${text}\n\n`,
   *   FIGCAPTION: text => `${text}\n\n`,
   *   STRONG: text => `**${text}**`,
   *   B: text => `**${text}**`,
   *   EM: text => `*${text}*`,
   *   I: text => `*${text}*`,
   *   S: text => `~~${text}~~`,
   *   INS: text => `++${text}++`,
   *   // IMG
   *   // option.alt: IMG alt
   *   // option.src: IMG src
   *   // option.width: IMG width
   *   // option.height: IMG height
   *   IMG: option => `![${option.alt}](${option.src}?size=${option.width}x${option.height})\n`,
   *   // UL
   *   // option.listLevel: List nesting level
   *   UL: (text, option) => {
   *     if (option.listLevel > 1) {
   *       return `\n${text}`
   *     }
   *     return `\n${text}\n`
   *   },
   *   // OL
   *   // option.listLevel: List nesting level
   *   OL: (text, option) => {
   *     if (option.listLevel > 1) {
   *       return `\n${text}`
   *     }
   *     return `\n${text}\n`
   *   },
   *   // LI
   *   // option.type: parentNode nodeName,
   *   // option.isLastOne: Whether the last item in the list
   *   // option.itemLevel: List nesting level
   *   // option.hasChild: Is the node has child node
   *   // option.index: The index in the list
   *   LI: (text, option) => {
   *     let spaceString = ''
   *     for (let i = 1; i < option.itemLevel; i++) { spaceString += '    ' }
   *     let endString = '\n'
   *     if (option.hasChild || option.isLastOne) {
   *       endString = ''
   *     }
   *     if (option.type === 'UL') { return `${spaceString}- ${text}${endString}` }
   *     return `${spaceString}${option.index}. ${text}${endString}`
   *   },
   *  }
   * })
   *
   * em.create(document.querySelector('.article-body'), document.body)
   * em.onMenuClick((id, data) => {
   *   console.log('You click the menu!');
   *   console.log(id, data);
   * });
   *
   * @export
   */
  class EasyMarker {
    /**
     * Creates an instance of EasyMarker.
     * @param {Object} options options
     * @param {Object[]} options.menuItems menu item option
     * @param {string} options.menuItems[].text menu text
     * @param {string[]} options.menuItems[].iconName menu icon class
     * @param {Object} options.menuItems[].style menu item style
     * @param {Object} options.menuItems[].iconStyle menu item icon style
     * @param {number|string} options.menuTopOffset the offset from the top of the menu relative screen, default 0.
     * @param {Object} options.menuStyle the menu style
     * @param {Object} options.menuStyle.menu the menu style
     * @param {Object} options.menuStyle.triangle the triangle style
     * @param {Object} options.menuStyle.item the sub menu style
     * @param {Object} options.menuStyle.icon the sub menu icon style
     * @param {boolean} options.disableTapHighlight disable highlight when tap
     * @param {Object} options.cursor cursor config
     * @param {string} options.cursor.color cursor color
     * @param {boolean} options.cursor.same whether the cursor is in the same direction
     * @param {Object} options.mask mask config
     * @param {string} options.mask.color mask color
     * @param {Object} options.highlight highlight config
     * @param {string} options.highlight.color highlight color
     * @param {number} options.scrollSpeedLevel The speed of scrolling when touching bottom, default 4
     * @param {number|string} options.scrollOffsetBottom triggering scrolling, distance from the bottom, default 100
     * @param {Object} options.markdownOptions Customize options about the mapping relations between HTML and Markdown
     */
    constructor(options) {
      this.options = Object.assign({}, defaultOptions$2, options);
      this.$selectStatus = SelectStatus.NONE;
      this.windowHeight = null;
      this.container = null;
      this.scrollContainer = null;
      this.excludeElements = [];
      this.highlight = null;
      this.movingCursor = null;
      this.touchEvent = null;
      this.scrollInterval = null;
      this.cursor = {
        start: null,
        end: null,
      };

      this.mask = null;
      this.menu = null;
      this.scrollOffsetBottom = null;
      this.scrollSpeedLevel = null;
      this.containerScroll = null;
      this.selectStatusChangeHandler = () => {};
      this.menuOnClick = () => {};
      this.highlightLineClick = () => {};
    }

    get selectStatus() {
      return this.$selectStatus
    }

    set selectStatus(val) {
      if (val !== this.$selectStatus) {
        this.selectStatusChangeHandler(val);
      }
      this.$selectStatus = val;
      if (val === SelectStatus.FINISH) {
        const top = this.mask.top - this.movingCursor.height / 2;
        const { left } = this.mask;
        this.menu.setPosition(top, this.mask.top + this.mask.height, left);
        this.menu.show();
      } else {
        this.menu.hide();
      }
    }

    /**
     * Initialization factory
     *
     * @static
     * @param {HTMLElement} containerElement container element
     * @param {HTMLElement} [scrollContainerElement] scroll container element
     * @param {Array<HTMLElement>} [excludeElements] not included elements
     * @returns {EasyMarker}
     * @memberof EasyMarker
     */
    static create(
      containerElement,
      scrollContainerElement,
      excludeElements = [],
    ) {
      const easyMarker = new this();
      easyMarker.create(
        containerElement,
        scrollContainerElement,
        excludeElements,
      );
      return easyMarker
    }

    /**
     * Initialization
     *
     * @param {HTMLElement} containerElement container element
     * @param {HTMLElement} [scrollContainerElement] scroll container element
     * @param {Array<HTMLElement>} [excludeElements] not included elements
     * @memberof EasyMarker
     */
    create(containerElement, scrollContainerElement, excludeElements = []) {
      this.container = containerElement;
      this.adjustTextStyle();
      this.container.oncontextmenu = (event) => {
        event.returnValue = false;
      };

      this.windowHeight = document.documentElement.clientHeight;
      this.excludeElements = [...excludeElements];
      this.scrollContainer = scrollContainerElement || document.body;
      this.container.addEventListener('contextmenu', preventDefaultCb);
      if (this.scrollContainer === document.body) {
        this.scrollContainer.onscroll = this.handleScroll.bind(this);
      } else {
        this.containerScroll = () => {
          this.handleScroll();
        };
        this.scrollContainer.addEventListener('scroll', this.containerScroll);
      }
      // this.position.setAll(getElementAbsolutePosition(this.container))

      this.container.style.userSelect = 'none';
      this.container.style.webkitUserSelect = 'none';
      this.container.style.position = 'relative';

      this.touchEvent = new TouchEvent(this.container);
      this.touchEvent.registerEvent(
        EventType.TOUCH_START,
        this.handleTouchStart.bind(this),
      );
      this.touchEvent.registerEvent(
        EventType.TOUCH_MOVE,
        this.handleTouchMove.bind(this),
      );
      this.touchEvent.registerEvent(
        EventType.TOUCH_MOVE_THROTTLE,
        this.handleTouchMoveThrottle.bind(this),
      );
      this.touchEvent.registerEvent(
        EventType.TOUCH_END,
        this.handleTouchEnd.bind(this),
      );
      this.touchEvent.registerEvent(EventType.TAP, this.handleTap.bind(this));
      this.touchEvent.registerEvent(
        EventType.LONG_TAP,
        this.handleLongTap.bind(this),
      );

      const CursorElement =
        this.options.cursor && this.options.cursor.Cursor
          ? this.options.cursor.Cursor
          : Cursor;

      if (this.options.cursor.same) {
        this.cursor.start = new CursorElement(
          this.container,
          CursorType.END,
          this.options.cursor || {},
        );
      } else {
        this.cursor.start = new CursorElement(
          this.container,
          CursorType.START,
          this.options.cursor || {},
        );
      }
      this.cursor.end = new CursorElement(
        this.container,
        CursorType.END,
        this.options.cursor || {},
      );
      this.movingCursor = this.cursor.end;

      this.mask = new Mask(this.container, this.options.mask || {});
      this.highlight = new Highlight(
        this.container,
        this.options.highlight || {},
      );
      this.menu = new Menu(this.container, {
        menuItems: this.options.menuItems,
        topOffset: this.options.menuTopOffset,
        style: this.options.menuStyle,
      });
      this.menu.easyMarker = this;
      this.highlight.easyMarker = this;
      this.markdown = new Markdown(this.container, this.options.markdownOptions);
      this.scrollOffsetBottom = anyToPx(this.options.scrollOffsetBottom);
      this.scrollSpeedLevel = this.options.scrollSpeedLevel;
    }

    /**
     * Highlight the lines between the specified nodes
     * @example
     * const id = 2;
     * const selection = {
     *   anchorNode: textNodeA,
     *   anchorOffset: 1,
     *   focusNode: textNodeB,
     *   focusOffset: 2
     * };
     * const meta = { someKey: 'someValue' };
     * em.highlightLine(selection, id, meta);
     * @param {Object} selection selection
     * @param {Node} selection.anchorNode start node
     * @param {number} selection.anchorOffset start node's text offset
     * @param {Node} selection.focusNode end node
     * @param {number} selection.focusOffset start node's text offset
     * @param {*} [id] line id
     * @param {*} [meta] meta information
     * @memberof EasyMarker
     */
    highlightLine(selection, id, meta) {
      this.highlight.highlightLine(
        selection,
        id,
        meta,
        this.screenRelativeOffset,
      );
    }

    /**
     * Highlight multiple lines
     * @example
     * const id = 2;
     * const selection = {
     *   anchorNode: textNodeA,
     *   anchorOffset: 1,
     *   focusNode: textNodeB,
     *   focusOffset: 2
     * };
     * const meta = { someKey: 'someValue' };
     * em.highlightLines([{selection, id, meta}]);
     * @param {Object[]} lines
     * @param {*} [lines[].id]
     * @param {*} [lines[].meta]
     * @param {Object} lines[].selection
     * @param {Node} lines[].selection.anchorNode
     * @param {number} lines[].selection.anchorOffset
     * @param {Node} lines[].selection.focusNode
     * @param {number} lines[].selection.focusOffset
     * @memberof EasyMarker
     */
    highlightLines(lines) {
      this.highlight.highlightLines(lines, this.screenRelativeOffset);
    }

    /**
     * Cancel highlight
     *
     * @param {*} id line ID
     * @returns {boolean}
     * @memberof EasyMarker
     */
    cancelHighlightLine(id) {
      this.highlight.cancelHighlightLine(id);
    }

    /**
     * Highlight line click handler
     *
     * @param {EasyMarker~highlightLineClickHandler} cb
     * @memberof EasyMarker
     */
    onHighlightLineClick(cb) {
      this.highlightLineClick = cb;
    }

    /**
     * Select status changing callback
     *
     * @param {Function} cb
     * @memberof EasyMarker
     */
    onSelectStatusChange(cb) {
      this.selectStatusChangeHandler = cb;
    }

    /**
     * menu item click handler
     *
     * @param {EasyMarker~menuClickHandler} cb
     * @memberof EasyMarker
     */
    onMenuClick(cb) {
      // this.menu.handler = cb
      this.menuOnClick = cb;
    }

    /**
     * Register event hook
     *
     * @param {*} cb
     * @memberof EasyMarker
     */
    registerEventHook(cb) {
      this.touchEvent.registerHook(cb);
    }
    /**
     * Destroy instance
     *
     * @memberof EasyMarker
     */
    destroy() {
      this.container.oncontextmenu = null;
      this.container.removeEventListener('contextmenu', preventDefaultCb);
      if (this.containerScroll !== null) {
        this.scrollContainer.removeEventListener('scroll', this.containerScroll);
        this.containerScroll = null;
      }
      this.scrollContainer.onscroll = null;

      this.touchEvent.destroy();
      this.cursor.start.destroy();
      this.cursor.end.destroy();
      this.mask.destroy();
      this.highlight.destroy();
      this.menu.destroy();

      this.$selectStatus = SelectStatus.NONE;
      this.container = null;
      this.scrollContainer = null;
      this.excludeElements = [];
      this.highlight = null;
      this.movingCursor = null;
      this.touchEvent = null;
      this.cursor = {
        start: null,
        end: null,
      };
      // TODO base的destroy去触发各自的destroy
      this.textNode = {
        start: null,
        end: null,
      };
      this.mask = null;
      this.menu = null;
    }

    reset() {
      this.selectStatus = SelectStatus.NONE;
      this.cursor.start.hide();
      this.cursor.end.hide();
      // TODO base的reset去触发各自的reset
      this.textNode = {
        start: null,
        end: null,
      };
      this.mask.reset();
    }

    // endregion

    // region private fields

    /**
     * Screen relative offset
     *
     * @readonly
     * @private
     * @memberof EasyMarker
     */
    get screenRelativeOffset() {
      const { top, left } = this.container.getBoundingClientRect();
      return {
        x: left,
        y: top,
      }
    }
    /**
     *
     * @private
     * @memberof EasyMarker
     */
    adjustTextStyle() {
      const { children } = this.container;
      for (let i = 0; i < children.length; i++) {
        children[i].style.zIndex = '5';
        children[i].style.position = 'relative';
      }
    }

    /**
     * Move the cursor to the specified location
     *
     * @private
     * @param {HTMLElement} element
     * @param {number} x Relative to the screen positioning x
     * @param {number} y Relative to the screen positioning Y
     * @memberof EasyMarker
     */
    moveCursor(element, x, y) {
      const clickPosition = getClickPosition(
        element,
        x,
        y,
        this.movingCursor === this.cursor.start,
      );
      if (clickPosition === null) return
      const relativeX = clickPosition.x - this.screenRelativeOffset.x;
      const relativeY = clickPosition.y - this.screenRelativeOffset.y;
      const unmovingCursor =
        this.movingCursor === this.cursor.start
          ? this.cursor.end
          : this.cursor.start;
      if (
        unmovingCursor.position.x === relativeX &&
        unmovingCursor.position.y === relativeY
      ) { return }

      this.swapCursor(clickPosition, { x: relativeX, y: relativeY });

      this.movingCursor.height = clickPosition.height;
      this.movingCursor.position = { x: relativeX, y: relativeY };
      this.renderMask();
    }

    /**
     *
     * @private
     * @param {HTMLElement} element
     * @memberof EasyMarker
     */
    isContains(element) {
      return (
        this.container.contains(element) &&
        this.excludeElements.findIndex(el => el.contains(element)) === -1
      )
    }

    /**
     * Long press event
     *
     * @private
     * @param {TouchEvent} e
     * @memberof EasyMarker
     */
    handleLongTap(e) {
      if (this.isContains(e.target)) {
        const { x, y } = getTouchPosition(e);
        this.selectWords(e.target, x, y);
      }
    }

    /**
     * touchstart event handler
     *
     * @private
     * @param {TouchEvent} e
     * @memberof EasyMarker
     */
    handleTouchStart(e) {
      if (this.selectStatus === SelectStatus.FINISH) {
        const position = this.getTouchRelativePosition(e);
        const startCursorRegion = this.cursor.start.inRegion(position);
        const endCursorRegion = this.cursor.end.inRegion(position);
        if (startCursorRegion.inRegion && endCursorRegion.inRegion) {
          this.selectStatus = SelectStatus.SELECTING;
          this.movingCursor =
            startCursorRegion.distance < endCursorRegion.distance
              ? this.cursor.start
              : this.cursor.end;
        } else if (endCursorRegion.inRegion) {
          this.selectStatus = SelectStatus.SELECTING;
          this.movingCursor = this.cursor.end;
        } else if (startCursorRegion.inRegion) {
          this.selectStatus = SelectStatus.SELECTING;
          this.movingCursor = this.cursor.start;
        }
      }
    }

    /**
     * touchmove event handler
     *
     * @private
     * @param {TouchEvent} e
     * @memberof EasyMarker
     */
    handleTouchMove(e) {
      if (this.selectStatus === SelectStatus.SELECTING) {
        e.preventDefault();
      }
    }

    /**
     * Throttle event of touchmove
     *
     * @private
     * @param {TouchEvent} e
     * @memberof EasyMarker
     */
    handleTouchMoveThrottle(e) {
      if (this.selectStatus === SelectStatus.SELECTING) {
        const offset = this.movingCursor.offset || {
          x: 0,
          y: -this.movingCursor.height / 2,
        };
        const targetY = e.clientY || e.changedTouches[0].clientY;
        if (targetY >= this.windowHeight - this.scrollOffsetBottom) {
          if (this.scrollInterval !== null) clearInterval(this.scrollInterval);
          const rate =
            ((targetY - this.windowHeight + this.scrollOffsetBottom) *
              this.scrollSpeedLevel) /
            this.scrollOffsetBottom;
          this.scrollInterval = setInterval(() => {
            this.scrollContainer.scrollTop += rate;
            document.documentElement.scrollTop += rate;
          }, 1);
        } else {
          clearInterval(this.scrollInterval);
        }
        const { x, y } = getTouchPosition(e, offset);
        const target = document.elementFromPoint(x, y);
        if (this.isContains(target)) {
          this.moveCursor(target, x, y);
        }
      }
    }

    /**
     * touchmove event handler
     *
     * @private
     * @param {TouchEvent} e
     * @memberof EasyMarker
     */
    handleTouchEnd() {
      if (this.selectStatus === SelectStatus.SELECTING) {
        if (this.scrollInterval) {
          clearInterval(this.scrollInterval);
          this.scrollInterval = null;
        }
        this.selectStatus = SelectStatus.FINISH;
      }
    }

    /**
     * handleScroll
     *
     * @private
     * @memberof EasyMarker
     */
    handleScroll() {
      if (this.selectStatus === SelectStatus.FINISH) {
        this.menu.handleScroll();
      }
    }

    getTouchRelativePosition(e) {
      const offset = {
        x: 0,
        y: -this.movingCursor.height / 2,
      };
      const position = getTouchPosition(e, offset);
      position.x -= this.screenRelativeOffset.x;
      position.y -= this.screenRelativeOffset.y;
      return position
    }

    // endregion
  }

  /**
   * Menu item click handler
   * @callback EasyMarker~menuClickHandler
   * @param {*} id menu ID
   * @param {Object} selection selection
   * @param {Node} selection.anchorNode start node
   * @param {number} selection.anchorOffset start node's text offset
   * @param {Node} selection.focusNode end node
   * @param {number} selection.focusOffset start node's text offset
   */

  /**
   * Menu item click handler
   * @callback EasyMarker~highlightLineClickHandler
   * @param {*} id line ID
   * @param {*} meta meta information
   * @param {Object} selection selection
   * @param {Node} selection.anchorNode start node
   * @param {number} selection.anchorOffset start node's text offset
   * @param {Node} selection.focusNode end node
   * @param {number} selection.focusOffset start node's text offset
   */

  class NodeEasyMarker extends EasyMarker {
    constructor(options) {
      super(options);
      this.textNode = {
        start: null,
        end: null,
      };
      this.markdown = null;
    }

    /**
     * Get the selected text
     *
     * @memberof EasyMarker
     * @returns {string}
     */
    getSelectText() {
      const text =
        TextNode.getSelectText(this.textNode.start, this.textNode.end) || '';
      return matchSubString(this.container.innerText, text) || text
    }

    getSelectMarkdown() {
      return (
        this.markdown.getSelectMarkdown(
          this.textNode.start.node,
          this.textNode.end.node,
          this.textNode.start.offset,
          this.textNode.end.offset,
        ).markdown || ''
      )
    }

    /**
     * Swap the start and end cursors
     *
     * @private
     * @param {any} clickPosition
     * @param {any} currentPosition
     * @memberof EasyMarker
     */
    swapCursor(clickPosition, currentPosition) {
      const { x, y } = currentPosition;
      if (this.movingCursor === this.cursor.start) {
        const endPosition = this.cursor.end.position;
        if (y > endPosition.y || (y === endPosition.y && x >= endPosition.x)) {
          this.cursor.start.position = this.cursor.end.position;
          this.movingCursor = this.cursor.end;
          this.textNode.start = new TextNode(
            this.textNode.end.node,
            this.textNode.end.offset,
          );
          this.textNode.end = new TextNode(
            clickPosition.node,
            clickPosition.index,
          );
        } else {
          this.textNode.start = new TextNode(
            clickPosition.node,
            clickPosition.index,
          );
        }
      } else {
        const startPosition = this.cursor.start.position;
        if (
          y < startPosition.y ||
          (y === startPosition.y && x <= startPosition.x)
        ) {
          this.cursor.end.position = this.cursor.start.position;
          this.movingCursor = this.cursor.start;
          this.textNode.end = new TextNode(
            this.textNode.start.node,
            this.textNode.start.offset,
          );
          this.textNode.start = new TextNode(
            clickPosition.node,
            clickPosition.index,
          );
        } else {
          this.textNode.end = new TextNode(
            clickPosition.node,
            clickPosition.index,
          );
        }
      }
    }

    /**
     * Start text selection
     *
     * @private
     * @param {any} element
     * @param {any} x
     * @param {any} y
     * @memberof EasyMarker
     */
    selectWords(element, x, y) {
      const separators = [
        '\u3002\u201D',
        '\uFF1F\u201D',
        '\uFF01\u201D',
        '\u3002',
        '\uFF1F',
        '\uFF01',
      ];
      const {
        rects, node, index, wordsLength,
      } =
        getClickWordsPosition(element, x, y, separators) || {};
      if (!rects || (rects && rects.length === 0)) return

      const startRect = rects[0];
      const endRect = rects[rects.length - 1];
      // start
      const startLeft = startRect.left - this.screenRelativeOffset.x;
      const startTop = startRect.top - this.screenRelativeOffset.y;
      this.textNode.start = new TextNode(node, index);
      this.cursor.start.height = startRect.height;
      this.cursor.start.position = { x: startLeft, y: startTop };

      // end
      const endLeft = endRect.left - this.screenRelativeOffset.x;
      const endTop = endRect.top - this.screenRelativeOffset.y;
      this.textNode.end = new TextNode(node, index + wordsLength);
      this.cursor.end.height = endRect.height;
      this.cursor.end.position = { x: endLeft + endRect.width, y: endTop };

      this.cursor.start.show();
      this.cursor.end.show();

      this.renderMask();
      this.selectStatus = SelectStatus.FINISH;
    }

    /**
     * Renders the selected mask layer
     * @private
     * @memberof EasyMarker
     */
    renderMask() {
      const { header, body, footer } = TextNode.getSelectRects(
        this.textNode.start,
        this.textNode.end,
      );
      const relativeHeader = screenRelativeToContainerRelative(
        header,
        this.screenRelativeOffset,
      );
      const relativeBody = screenRelativeToContainerRelative(
        body,
        this.screenRelativeOffset,
      );
      const relativeFooter = screenRelativeToContainerRelative(
        footer,
        this.screenRelativeOffset,
      );
      this.mask.render(relativeHeader, relativeBody, relativeFooter);
    }

    /**
     * Tap event
     *
     * @private
     * @param {TouchEvent} e
     * @memberof EasyMarker
     */
    handleTap(e) {
      if (this.selectStatus === SelectStatus.FINISH) {
        this.menu.handleTap(e, {
          start: this.textNode.start,
          end: this.textNode.end,
          content: this.getSelectText(),
          markdown: this.getSelectMarkdown(),
        });
        const position = this.getTouchRelativePosition(e);
        const startCursorRegion = this.cursor.start.inRegion(position);
        const endCursorRegion = this.cursor.end.inRegion(position);
        if (startCursorRegion.inRegion || endCursorRegion.inRegion) return
        this.reset();
      } else if (this.selectStatus === SelectStatus.NONE) {
        const inHighlightLine = this.highlight.handleTap(e);
        if (
          !inHighlightLine &&
          !this.options.disableTapHighlight &&
          this.isContains(e.target)
        ) {
          const { x, y } = getTouchPosition(e);
          this.selectWords(e.target, x, y);
        }
      }
    }
  }

  const em = new NodeEasyMarker({
    menuTopOffset: '2rem',
    scrollSpeedLevel: 6,
    scrollOffsetBottom: '1.5rem',
    mask: {
      color: '#407ff2',
    },
    cursor: {
      color: '#e1e1e1',
      // customClass: CustomizeCursor,
    },
    highlight: {
      // type: 'underline',
      color: '#407ff2',
    },
    menuStyle: {
      // menu: {
      //   backgroundColor: '#407ff2',
      // },
      // triangle: {
      //   borderTop: '0.2rem solid #407ff2',
      // },
      item: {
        color: 'gray',
      },
      icon: {
        width: '20px',
        height: '20px',
        background: 'red'
      }
    },
    menuItems: [
      {
        text: '划线笔记',
        iconName: 'iconfont icon-goback-android',
        // id: '302',
        style: {
          backgroundColor: 'yellow',
          paddingLeft: '1rem',
        },
        iconStyle: {
          background: 'green'
        },
        handler: function(data) {
          console.log('划线笔记', data);
          const {anchorNode,anchorOffset,focusNode,focusOffset} = data;
          this.highlightLine({anchorNode,anchorOffset,focusNode,focusOffset}, 1);
        },
      },
      {
        id: 111,
        text: '分享',
        iconName: 'iconfont icon-goback-ios',
        // style: {
        //   backgroundColor: 'green'
        // },
        handler: data => {
          console.log(data.toMarkdown());
        },
      },
      {
        id: 222,
        text: '复制',
        iconName: 'iconfont icon-goback-ios',
        style: {
          backgroundColor: '#407ff2',
          paddingLeft: '0.5rem',
        },
        handler: data => {
          console.log('复制', data.toString());
        },
      },
    ],
    markdownOptions: {
      P: text => `${text}\n\n`,
      H2: text => `\n## ${text}\n\n`,
    },
  });

  em.onHighlightLineClick((id, meta, selection) => {
    console.log('You click the highlight line!');
    console.log(id, meta, selection);
    console.log(333, selection.toString());
    console.log(444, selection.toMarkdown());
  });
  em.onMenuClick(function(id, data) {
    console.log('You click the menu!', this);
    console.log(id, data);
  });
  em.onSelectStatusChange((val)=>{
    console.log('onSelectStatusChange', val);
  });

  em.create(
    // document.querySelector('.lala'),
    document.querySelector('#article'),
    document.body,
    document.querySelectorAll('.message-v2'),
  );

  return em;

}());

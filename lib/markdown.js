import { domCollectionToArray } from './helpers'

const defaultOptions = Object.freeze({
  H1: {
    start: '\n# ',
    end: '\n\n',
  },
  H2: {
    start: '\n## ',
    end: '\n\n',
  },
  H3: {
    start: '\n### ',
    end: '\n\n',
  },
  H4: {
    start: '\n#### ',
    end: '\n\n',
  },
  H5: {
    start: '\n##### ',
    end: '\n\n',
  },
  H6: {
    start: '\n###### ',
    end: '\n\n',
  },
  P: {
    start: '',
    end: '\n\n',
  },
  FIGCAPTION: {
    start: '',
    end: '\n\n',
  },
  LI: {
    start: '',
    end: '\n',
  },
  UL: {
    start: '\n',
    end: '\n',
  },
  OL: {
    start: '\n',
    end: '\n',
  },
  STRONG: {
    start: '**',
    end: '**',
  },
  B: {
    start: '**',
    end: '**',
  },
  EM: {
    start: '*',
    end: '*',
  },
  I: {
    start: '*',
    end: '*',
  },
  S: {
    start: '~~',
    end: '~~',
  },
  INS: {
    start: '++',
    end: '++',
  },
  IMG: {},
})

/**
 * Markdown
 *
 * @export
 * @class Markdown
 */
export default class Markdown {
  constructor(container, option = {}) {
    this.container = container
    this.generalWrapMarkdown = option.generalWrapMarkdown || Markdown.wrapMarkdown
    if (option.isReplaceAll === true) {
      this.options = option.options
    } else {
      this.options = Object.assign({}, defaultOptions, option.options)
      Object.keys(this.options).forEach((key) => {
        if (this.options[key].wrapMarkdown === undefined) this.options[key].wrapMarkdown = this.generalWrapMarkdown
      })
    }
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
      text: '',
      markdown: '',
    }
    if (markdownStack === undefined) markdownStack = []
    if (startNode.childNodes.length > 0 && startNode.nodeName !== 'SCRIPT' && startNode.nodeName !== 'STYLE') {
      const childNode = startNode.childNodes[0]
      const { text, markdown } = this.getSelectMarkdown(childNode, endNode, 0, endIndex, markdownStack)
      result.markdown += markdown
      result.text += text
      return result
    }

    if (startNode.nodeName === '#text') {
      let node = startNode
      const tempMarkdownStack = []
      while (node.parentNode !== this.container && node.parentNode !== markdownStack[markdownStack.length - 1]) {
        node = node.parentNode

        result.markdown = this.options[node.nodeName]
          ? this.options[node.nodeName].wrapMarkdown(node, this.options, this.container, 'start') + result.markdown
          : result.markdown
        tempMarkdownStack.push(node)
      }
      while (tempMarkdownStack.length !== 0) {
        markdownStack.push(tempMarkdownStack.pop())
      }
      const textEndIndex = startNode === endNode ? endIndex : startNode.textContent.length
      result.text += startNode.textContent.substring(startIndex, textEndIndex)
      result.markdown += startNode.textContent.substring(startIndex, textEndIndex).replace(/(^\s*)|(\s*$)/g, '')
    }

    if (startNode.nodeName === 'IMG') {
      result.markdown += this.options.IMG.wrapMarkdown(startNode, this.options, this.container)
    }

    if (startNode === endNode) {
      while (markdownStack.length !== 0) {
        const popNode = markdownStack.pop()
        result.markdown += this.options[popNode.nodeName]
          ? this.options[popNode.nodeName].wrapMarkdown(popNode, this.options, this.container, 'end') : ''
      }
      return result
    }

    const nextNode = startNode.nextSibling
    if (nextNode) {
      const { text, markdown } = this.getSelectMarkdown(nextNode, endNode, 0, endIndex, markdownStack)
      result.text += text
      result.markdown += markdown
    } else {
      let currentNode = startNode.parentNode
      let popNode = markdownStack.pop()
      result.markdown += this.options[popNode.nodeName]
        ? this.options[popNode.nodeName].wrapMarkdown(popNode, this.options, this.container, 'end') : ''
      while (currentNode && currentNode.nextSibling === null) {
        currentNode = currentNode.parentNode
        popNode = markdownStack.pop()
        result.markdown += this.options[popNode.nodeName]
          ? this.options[popNode.nodeName].wrapMarkdown(popNode, this.options, this.container, 'end') : ''
      }
      if (currentNode) {
        const { text, markdown } = this.getSelectMarkdown(currentNode.nextSibling, endNode, 0, endIndex, markdownStack)
        result.text += text
        result.markdown += markdown
      } else {
        throw new Error('Invalid end node')
      }
    }
    return result
  }

  /**
   * Wrap markdown in text
   *
   * @param {Node} node parentNode of the text
   * @param {Object} options Mapping relations between HTML and Markdown
   * @param {Node} container the container Node
   * @param {String} positionType 'start' || 'end', wrap the text's head or foot
   */
  static wrapMarkdown(node, options, container, positionType) {
    if (node.nodeName === 'LI' && positionType === 'start') {
      let spaceString = ''
      let tempNode = node.parentNode
      while (tempNode !== container) {
        tempNode = tempNode.parentNode
        if (tempNode.nodeName === node.parentNode.nodeName) spaceString += '    '
      }
      if (node.parentNode.nodeName === 'OL') {
        return `${spaceString}${[].indexOf.call(node.parentNode.children, node) + 1}. `
      } else if (node.parentNode.nodeName === 'UL') {
        return `${spaceString}- `
      }
    } else if (node.nodeName === 'LI' && positionType === 'end') {
      if (domCollectionToArray(node.childNodes)
        .some(childNode => childNode.nodeName === 'UL' || childNode.nodeName === 'OL')) {
        return ''
      }
    } else if ((node.nodeName === 'UL' || node.nodeName === 'OL') && positionType === 'end') {
      let isChild = false
      let tempNode = node.parentNode
      while (tempNode !== container && isChild !== true) {
        if (tempNode.nodeName === node.nodeName) isChild = true
        tempNode = tempNode.parentNode
      }
      if (isChild) return ''
    } else if (node.nodeName === 'IMG') {
      return `![${node.alt}](${node.src}?size=${node.width}x${node.height})\n\n`
    }
    return options[node.nodeName]
      ? options[node.nodeName][positionType] : ''
  }
}

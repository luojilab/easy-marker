import { domCollectionToArray } from './helpers'

const defaultOptions = Object.freeze({
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
    return `\n${text}\n`
  },
  OL: (text, option) => {
    if (option.listLevel > 1) {
      return `\n${text}`
    }
    return `\n${text}\n`
  },
  LI: (text, option) => {
    let spaceString = ''
    for (let i = 1; i < option.itemLevel; i++) { spaceString += '    ' }
    let endString = '\n'
    if (option.hasChild || option.isLastOne) {
      endString = ''
    }
    if (option.type === 'UL') { return `${spaceString}- ${text}${endString}` }
    return `${spaceString}${option.index}. ${text}${endString}`
  },
})

/**
 * Markdown
 *
 * @export
 * @class Markdown
 */
export default class Markdown {
  constructor(container, options = {}) {
    this.container = container
    this.wrapMarkdown = Markdown.wrapMarkdown
    this.options = Object.assign({}, defaultOptions, options)
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
    }
    let popText = ''
    if (markdownStack === undefined) markdownStack = []
    if (startNode.childNodes.length > 0 && startNode.nodeName !== 'SCRIPT' && startNode.nodeName !== 'STYLE') {
      const childNode = startNode.childNodes[0]
      const { markdown } = this.getSelectMarkdown(childNode, endNode, 0, endIndex, markdownStack)
      result.markdown = markdown
      return result
    }

    if (startNode.nodeName === '#text') {
      let node = startNode
      const tempMarkdownStack = []
      const textEndIndex = startNode === endNode ? endIndex : startNode.textContent.length
      const currentText = startNode.textContent.substring(startIndex, textEndIndex).replace(/(^\s*)|(\s*$)/g, '')
      if (markdownStack.length !== 0 && node.parentNode === markdownStack[markdownStack.length - 1].node) {
        popText = currentText
      }
      let isContainer = false
      while (!isContainer
        && (markdownStack.length === 0 || node.parentNode !== markdownStack[markdownStack.length - 1].node)) {
        if (node === this.container) isContainer = true
        let text = ''
        if (node.nodeName === '#text') {
          text = currentText
        }
        node = node.parentNode
        tempMarkdownStack.push({
          node,
          text,
        })
      }
      while (tempMarkdownStack.length !== 0) {
        markdownStack.push(tempMarkdownStack.pop())
      }
    }

    if (startNode.nodeName === 'IMG') {
      if (markdownStack.length > 0) {
        markdownStack[markdownStack.length - 1].text += this.wrapMarkdown(startNode, this.options)
      } else {
        result.markdown += this.wrapMarkdown(startNode, this.options)
      }
    }

    if (startNode === endNode) {
      if (markdownStack.length !== 0) {
        const popMarkdown = markdownStack.pop()
        popMarkdown.text += popText
        result.markdown = this.wrapMarkdown(popMarkdown.node, this.options, popMarkdown.text)
        if (markdownStack.length !== 0) { markdownStack[markdownStack.length - 1].text += result.markdown }
      }
      while (markdownStack.length !== 0) {
        const popMarkdown = markdownStack.pop()
        result.markdown = this.wrapMarkdown(popMarkdown.node, this.options, popMarkdown.text)
        if (markdownStack.length !== 0) { markdownStack[markdownStack.length - 1].text += result.markdown }
      }
      return result
    }
    const nextNode = startNode.nextSibling
    if (nextNode) {
      const { markdown } = this.getSelectMarkdown(nextNode, endNode, 0, endIndex, markdownStack)
      if (markdownStack.length > 0) {
        markdownStack[markdownStack.length - 1].text += (result.markdown + markdown)
      } else {
        result.markdown += (result.markdown + markdown)
      }
    } else {
      let currentNode = startNode.parentNode
      let popMarkdown = markdownStack.pop()
      popMarkdown.text += popText
      result.markdown += this.wrapMarkdown(popMarkdown.node, this.options, popMarkdown.text)
      if (markdownStack.length !== 0) { markdownStack[markdownStack.length - 1].text += result.markdown }
      while (currentNode && currentNode.nextSibling === null) {
        currentNode = currentNode.parentNode
        popMarkdown = markdownStack.pop()
        popMarkdown.text += popText
        result.markdown = this.wrapMarkdown(popMarkdown.node, this.options, popMarkdown.text)
        if (markdownStack.length !== 0) { markdownStack[markdownStack.length - 1].text += result.markdown }
      }
      if (currentNode) {
        const { markdown } = this.getSelectMarkdown(currentNode.nextSibling, endNode, 0, endIndex, markdownStack)
        if (markdownStack.length !== 0) {
          markdownStack[markdownStack.length - 1].text += markdown
        } else {
          result.markdown = markdown
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
      }
      return options[node.nodeName] ? options[node.nodeName](imgOption) : ''
    } else if (node.nodeName === 'LI') {
      let itemLevel = 1
      let tempNode = node.parentNode
      while (tempNode.parentNode) {
        tempNode = tempNode.parentNode
        if (tempNode.nodeName === node.parentNode.nodeName) itemLevel++
      }
      let hasChild = false
      if (domCollectionToArray(node.childNodes)
        .some(childNode => childNode.nodeName === 'UL' || childNode.nodeName === 'OL')) {
        hasChild = true
      }
      let isLastOne = false
      if (!node.nextElementSibling) {
        isLastOne = true
      }
      const option = {
        type: node.parentNode.nodeName,
        isLastOne,
        itemLevel,
        hasChild,
        index: [].indexOf.call(node.parentNode.children, node) + 1,
      }
      return options[node.nodeName] ? options[node.nodeName](text, option) : text
    } else if (node.nodeName === 'UL' || node.nodeName === 'OL') {
      let listLevel = 1
      let tempNode = node.parentNode
      while (tempNode.parentNode) {
        tempNode = tempNode.parentNode
        if (tempNode.nodeName === node.parentNode.nodeName) listLevel++
      }
      return options[node.nodeName] ? options[node.nodeName](text, { listLevel }) : text
    }
    return options[node.nodeName] ? options[node.nodeName](text) : text
  }
}

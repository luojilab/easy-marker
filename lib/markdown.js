const markdownMap = Object.freeze({
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
    start: '- ',
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
})

export default class Markdown {
  static getSelectMarkdown(startNode, endNode, startIndex, endIndex, containerNode, markdownStack) {
    const result = {
      text: '',
      markdown: '',
    }
    if (markdownStack === undefined) markdownStack = []
    if (startNode.childNodes.length > 0 && startNode.nodeName !== 'SCRIPT' && startNode.nodeName !== 'STYLE') {
      const childNode = startNode.childNodes[0]
      const { text, markdown } = this.getSelectMarkdown(childNode, endNode, 0, endIndex, containerNode, markdownStack)
      result.markdown += markdown
      result.text += text
      return result
    }

    if (startNode.nodeName === '#text') {
      let node = startNode
      const tempMarkdownStack = []
      while (node.parentNode !== containerNode && node.parentNode !== markdownStack[markdownStack.length - 1]) {
        node = node.parentNode
        result.markdown = this.wrapMarkdown(node, 'start') + result.markdown
        tempMarkdownStack.push(node)
      }
      while (tempMarkdownStack.length !== 0) {
        markdownStack.push(tempMarkdownStack.pop())
      }
      const textEndIndex = startNode === endNode ? endIndex : startNode.textContent.length
      result.text += startNode.textContent.substring(startIndex, textEndIndex)
      result.markdown += startNode.textContent.substring(startIndex, textEndIndex)
    }

    if (startNode.nodeName === 'IMG') {
      // result.markdown += `![${startNode.alt}](${startNode.src} =${startNode.width}x${startNode.height})\n`
      result.markdown += `![${startNode.width}x${startNode.height}](${startNode.src})\n\n`
    }

    if (startNode === endNode) {
      while (markdownStack.length !== 0) {
        result.markdown += this.wrapMarkdown(markdownStack.pop(), 'end')
      }
      return result
    }

    const nextNode = startNode.nextSibling
    if (nextNode) {
      const { text, markdown } = this.getSelectMarkdown(nextNode, endNode, 0, endIndex, containerNode, markdownStack)
      result.text += text
      result.markdown += markdown
    } else {
      let currentNode = startNode.parentNode
      result.markdown += this.wrapMarkdown(markdownStack.pop(), 'end')
      while (currentNode && currentNode.nextSibling === null) {
        currentNode = currentNode.parentNode
        result.markdown += this.wrapMarkdown(markdownStack.pop(), 'end')
      }
      if (currentNode) {
        const { text, markdown } = this.getSelectMarkdown(currentNode.nextSibling, endNode, 0, endIndex, containerNode, markdownStack)
        result.text += text
        result.markdown += markdown
      } else {
        throw new Error('Invalid end node')
      }
    }
    return result
  }
  static wrapMarkdown(node, positionType) {
    if (node.nodeName === 'LI' && node.parentNode.nodeName === 'OL' && positionType === 'start') {
      return `${[].indexOf.call(node.parentNode.children, node)
        + 1}. `
    } else if (node.nodeName === 'LI') {
      return markdownMap[node.nodeName]
        ? markdownMap[node.nodeName][positionType] : ''
    }
    return markdownMap[node.nodeName]
      ? markdownMap[node.nodeName][positionType] : ''
  }
}

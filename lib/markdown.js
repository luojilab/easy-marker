const markdownMap = Object.freeze({
  H1: {
    start: '#',
    end: '\n',
  },
  H2: {
    start: '##',
    end: '\n',
  },
  H3: {
    start: '###',
    end: '\n',
  },
  H4: {
    start: '####',
    end: '\n',
  },
  H5: {
    start: '#####',
    end: '\n',
  },
  H6: {
    start: '######',
    end: '\n',
  },
  // ul> li, ol> li
  // Special treatment
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
  P: {
    start: '',
    end: '\n',
  },
  FIGCAPTION: {
    start: '',
    end: '\n',
  },
})

export default class Markdown {
  static getSelectMarkdown(startNode, endNode, startIndex, endIndex, markdownStack) {
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
      if (markdownStack[markdownStack.length - 1] !== startNode.parentNode) {
        result.markdown = markdownMap[startNode.parentNode.nodeName]
          ? `${markdownMap[startNode.parentNode.nodeName].start}${result.text}` : result.text
        markdownStack.push(startNode.parentNode)
      }
      const textEndIndex = startNode === endNode ? endIndex : startNode.textContent.length
      result.text += startNode.textContent.substring(startIndex, textEndIndex)
      result.markdown += startNode.textContent.substring(startIndex, textEndIndex)
    }

    if (startNode.nodeName === 'IMG') {
      result.markdown += `![${startNode.alt}](${startNode.src} =${startNode.width}x${startNode.height})\n`
    }

    if (startNode === endNode) {
      result.markdown = markdownMap[startNode.parentNode.nodeName]
        ? `${result.text}${markdownMap[startNode.parentNode.nodeName].end}` : result.text
      markdownStack.pop()
      return result
    }

    const nextNode = startNode.nextSibling
    if (nextNode) {
      const { text, markdown } = this.getSelectMarkdown(nextNode, endNode, 0, endIndex, markdownStack)
      result.text += text
      result.markdown += markdown
    } else {
      result.markdown = markdownMap[startNode.parentNode.nodeName]
        ? `${result.text}${markdownMap[startNode.parentNode.nodeName].end}` : result.text
      markdownStack.pop()
      let currentNode = startNode.parentNode
      while (currentNode && currentNode.nextSibling === null) {
        currentNode = currentNode.parentNode
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
}

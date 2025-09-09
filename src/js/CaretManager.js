export default class CaretManager {
  constructor(editableElement) {
    if (!editableElement || !editableElement.isContentEditable) {
      throw new Error('Element must be a contenteditable element.')
    }
    this.element = editableElement
  }

  saveCaretPosition() {
    this.savedOffset = this.#getCaretCharacterOffsetWithin(this.element)
  }

  restoreCaretPosition() {
    if (typeof this.savedOffset === 'number') {
      this.#setCaretCharacterOffsetWithin(this.element, this.savedOffset)
    }
  }

  // --- Private methods ---

  #isDescendant(parent, child) {
    let node = child
    while (node !== null) {
      if (node === parent) return true
      node = node.parentNode
    }
    return false
  }

  #getCaretCharacterOffsetWithin(element) {
    const selection = window.getSelection()
    let charCount = -1
    let node

    if (selection.focusNode && this.#isDescendant(element, selection.focusNode)) {
      charCount = selection.focusOffset
      node = selection.focusNode

      while (node && node !== element) {
        if (node.previousSibling) {
          node = node.previousSibling
          charCount += node.textContent.length
        } else {
          node = node.parentNode
        }
      }
    }
    return charCount
  }

  #setCaretCharacterOffsetWithin(element, offset) {
    if (offset < 0) return

    const range = document.createRange()
    const selection = window.getSelection()

    let currentOffset = 0
    let found = false

    function traverse(node) {
      if (found) return

      if (node.nodeType === Node.TEXT_NODE) {
        const nextOffset = currentOffset + node.length
        if (offset <= nextOffset) {
          range.setStart(node, offset - currentOffset)
          range.collapse(true)
          found = true
          return
        }
        currentOffset = nextOffset
      } else {
        for (let i = 0; i < node.childNodes.length; i++) {
          traverse(node.childNodes[i])
          if (found) return
        }
      }
    }

    traverse(element)
    selection.removeAllRanges()
    selection.addRange(range)
  }
}

export const MENTION_NAME_ATTRIBUTE = 'data-mention-name'

/** What the editable message box says: its text, each mention as @name, line breaks as \n. */
export function draftText(element: Element): string {
  return [...element.childNodes].map((node, index, siblings) => nodeText(node, index, siblings.length)).join('')
}

// Chrome writes Enter as <div> lines and Shift+Enter as <br>; the last <br> of a line only holds an empty line open
function nodeText(node: ChildNode, index: number, count: number): string {
  if (node instanceof Text) return node.data
  if (!(node instanceof Element)) return ''
  const mentioned = node.getAttribute(MENTION_NAME_ATTRIBUTE)
  if (mentioned !== null) return `@${mentioned}`
  switch (node.tagName) {
    case 'BR':
      return index === count - 1 ? '' : '\n'
    case 'DIV':
    case 'P':
      return `${index === 0 ? '' : '\n'}${draftText(node)}`
    default:
      return draftText(node)
  }
}

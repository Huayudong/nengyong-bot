import { describe, expect, it } from 'vitest'
import { draftText, MENTION_NAME_ATTRIBUTE } from './draftText'

function editorWith(html: string) {
  const editor = document.createElement('div')
  editor.innerHTML = html
  return editor
}

describe('draftText', () => {
  it('reads a mention as @name, whatever is drawn inside it', () => {
    const editor = editorWith(`问问 <span ${MENTION_NAME_ATTRIBUTE}="秘书Bot"><b>秘书Bot</b></span> 今天`)
    expect(draftText(editor)).toBe('问问 @秘书Bot 今天')
  })

  it('reads the line breaks Chrome writes and the newlines typed as text', () => {
    expect(draftText(editorWith('第一行<br>第二行'))).toBe('第一行\n第二行')
    expect(draftText(editorWith('第一行<div>第二行</div><div><br></div>'))).toBe('第一行\n第二行\n')
    expect(draftText(editorWith('第一行\n第二行'))).toBe('第一行\n第二行')
  })

  it('reads the placeholder <br> of an emptied box as nothing', () => {
    expect(draftText(editorWith('<br>'))).toBe('')
  })
})

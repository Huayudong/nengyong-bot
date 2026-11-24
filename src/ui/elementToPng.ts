import { strings } from '../../shared/strings'

/** Draws an element as it shows on the page into a PNG `scale` times its size, for sharing it as an image. */
export async function elementToPng(element: HTMLElement, scale: number): Promise<Blob> {
  const width = element.offsetWidth
  const height = element.offsetHeight
  const copy = element.cloneNode(true)
  if (!(copy instanceof Element)) throw new Error(strings().ui.drawImageFailed)
  inlineStyles(element, copy)
  const markup = new XMLSerializer().serializeToString(copy)
  // the viewBox scales the drawing, not a bitmap: text and outlines stay sharp at `scale`
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width * scale}" height="${height * scale}" viewBox="0 0 ${width} ${height}"><foreignObject width="${width}" height="${height}">${markup}</foreignObject></svg>`
  const image = new Image()
  await new Promise((resolve, reject) => {
    image.onload = resolve
    image.onerror = () => reject(new Error(strings().ui.drawImageFailed))
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  })
  const canvas = document.createElement('canvas')
  canvas.width = width * scale
  canvas.height = height * scale
  const context = canvas.getContext('2d')
  if (!context) throw new Error(strings().ui.drawImageFailed)
  context.drawImage(image, 0, 0)
  return new Promise((resolve, reject) =>
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error(strings().ui.drawImageFailed))), 'image/png'),
  )
}

// an SVG drawn as an image loads no stylesheet, so every element carries its computed style along
function inlineStyles(source: Element, target: Element) {
  const style = getComputedStyle(source)
  target.setAttribute('style', Array.from(style, (name) => `${name}:${style.getPropertyValue(name)}`).join(';'))
  Array.from(source.children).forEach((child, index) => {
    const twin = target.children[index]
    if (twin) inlineStyles(child, twin)
  })
}

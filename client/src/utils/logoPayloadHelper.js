
const DEFAULT_MAX_BYTES_PER_IMAGE = 250000 // ~250KB per image
const MAX_DIMENSION = 800
const JPEG_QUALITY = 0.75

function resizeDataUrl(dataUrl, maxBytes = DEFAULT_MAX_BYTES_PER_IMAGE) {
  if (!dataUrl || typeof dataUrl !== 'string' || !dataUrl.startsWith('data:image')) {
    return Promise.resolve(dataUrl)
  }
  const base64Length = dataUrl.length - (dataUrl.indexOf(',') + 1)
  const estimatedBytes = Math.ceil((base64Length * 3) / 4)
  if (estimatedBytes <= maxBytes) return Promise.resolve(dataUrl)

  return new Promise((resolve) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    img.onload = () => {
      try {
        let w = img.naturalWidth
        let h = img.naturalHeight
        if (w <= MAX_DIMENSION && h <= MAX_DIMENSION && estimatedBytes <= maxBytes) {
          resolve(dataUrl)
          return
        }
        const scale = Math.min(MAX_DIMENSION / w, MAX_DIMENSION / h, 1)
        w = Math.round(w * scale)
        h = Math.round(h * scale)
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          resolve(dataUrl)
          return
        }
        ctx.drawImage(img, 0, 0, w, h)
        let quality = JPEG_QUALITY
        let result = canvas.toDataURL('image/jpeg', quality)
        while (result.length > maxBytes * 1.4 && quality > 0.3) {
          quality = Math.max(0.3, quality - 0.15)
          result = canvas.toDataURL('image/jpeg', quality)
        }
        resolve(result)
      } catch (e) {
        resolve(dataUrl)
      }
    }
    img.onerror = () => resolve(dataUrl)
    img.src = dataUrl
  })
}

export async function capLogoPreviewsPayload(previews, maxBytesPerImage = DEFAULT_MAX_BYTES_PER_IMAGE) {
  if (!previews || typeof previews !== 'object') return {}
  const out = {}
  const entries = Object.entries(previews)
  for (const [k, v] of entries) {
    if (v === undefined || v === null || typeof v === 'function' || v instanceof File) continue
    if (typeof v === 'string' && v.startsWith('data:image')) {
      out[k] = await resizeDataUrl(v, maxBytesPerImage)
    } else if (typeof v === 'object' && v !== null && !Array.isArray(v)) {
      out[k] = await capLogoPreviewsPayload(v, maxBytesPerImage)
    } else {
      out[k] = v
    }
  }
  return out
}

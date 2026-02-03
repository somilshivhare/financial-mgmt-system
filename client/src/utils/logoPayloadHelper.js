/**
 * Cap logo preview payload size for Master Data save (avoids 413 in production).
 * Resizes base64 images over maxBytesPerImage via canvas so request stays under Nginx/Express limits.
 */

const DEFAULT_MAX_BYTES_PER_IMAGE = 250000 // ~250KB per image
const MAX_DIMENSION = 800
const JPEG_QUALITY = 0.75

/**
 * Resize a single data URL (base64) image to fit within maxBytes, using canvas.
 * @param {string} dataUrl - data URL (e.g. data:image/png;base64,...)
 * @param {number} maxBytes - max size in bytes
 * @returns {Promise<string>} - data URL (resized or original)
 */
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

/**
 * Recursively cap all data URL values in a previews object so payload stays small.
 * @param {object} previews - { key: dataUrl string or nested object }
 * @param {number} maxBytesPerImage - max bytes per image
 * @returns {Promise<object>} - same structure with resized data URLs
 */
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


const STORAGE_PREFIX = 'draft:'
const DEFAULT_DEBOUNCE_MS = 1500
const timers = new Map()

export function getCurrentUserId() {
  try {
    const raw = localStorage.getItem('user')
    if (!raw) return 'anonymous'
    const user = JSON.parse(raw)
    return user?.id ?? user?.userId ?? user?.email ?? 'anonymous'
  } catch {
    return 'anonymous'
  }
}

export function buildDraftKey(pathKey, entityId = null) {
  const userId = getCurrentUserId()
  const id = entityId === null || entityId === undefined || entityId === '' ? 'new' : String(entityId)
  return `${STORAGE_PREFIX}${pathKey}:${id}:${userId}`
}

export function getDraft(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    const data = JSON.parse(raw)
    const out = data?.values ?? data?.formData ?? data
    if (out == null || typeof out !== 'object' || Array.isArray(out)) return null
    return out
  } catch {
    return null
  }
}

export function getDraftPayload(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

export function setDraft(key, values, options = {}) {
  try {
    const payload = options.formData !== undefined
      ? { ...options, formData: values }
      : { values, savedAt: new Date().toISOString(), ...options }
    localStorage.setItem(key, JSON.stringify(payload))
  } catch (e) {
    console.warn('[formPersistenceStorage] setDraft failed:', e)
  }
}

export function scheduleDraftSave(key, values, debounceMs = DEFAULT_DEBOUNCE_MS) {
  pendingPayloads.set(key, values)
  if (timers.has(key)) {
    clearTimeout(timers.get(key))
  }
  const timer = setTimeout(() => {
    timers.delete(key)
    const payload = pendingPayloads.get(key)
    if (payload !== undefined) {
      setDraft(key, payload)
      pendingPayloads.delete(key)
    }
  }, debounceMs)
  timers.set(key, timer)
}

export function cancelScheduledSave(key) {
  pendingPayloads.delete(key)
  if (timers.has(key)) {
    clearTimeout(timers.get(key))
    timers.delete(key)
  }
}

const pendingPayloads = new Map()

export function flushPendingSaves() {
  pendingPayloads.forEach((values, key) => {
    setDraft(key, values)
  })
  pendingPayloads.clear()
  timers.forEach((t) => clearTimeout(t))
  timers.clear()
}

export function clearDraft(key) {
  cancelScheduledSave(key)
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.warn('[formPersistenceStorage] clearDraft failed:', e)
  }
}

export function mergeWithDefaults(defaultValues, stored) {
  const defaults = defaultValues && typeof defaultValues === 'object' && !Array.isArray(defaultValues)
    ? defaultValues
    : {}
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return { ...defaults }
  return { ...defaults, ...stored }
}

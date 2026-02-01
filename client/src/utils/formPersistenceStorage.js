/**
 * Centralized form persistence storage.
 * Single draft per page/entity per user. Survives refresh, tab close, and browser restart.
 * Keys: draft:{pathKey}:{entityId}:{userId}
 */

const STORAGE_PREFIX = 'draft:'
const DEFAULT_DEBOUNCE_MS = 1500
const timers = new Map()

/**
 * Get current user id from localStorage (for scoping drafts per user).
 * @returns {string} User id or 'anonymous'
 */
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

/**
 * Build a unique storage key for one draft per page/entity per user.
 * @param {string} pathKey - Route/page identifier (e.g. 'po-entry', 'invoice-entry')
 * @param {string|null} entityId - Entity id when editing, or 'new' for new entry
 * @returns {string}
 */
export function buildDraftKey(pathKey, entityId = null) {
  const userId = getCurrentUserId()
  const id = entityId === null || entityId === undefined || entityId === '' ? 'new' : String(entityId)
  return `${STORAGE_PREFIX}${pathKey}:${id}:${userId}`
}

/**
 * Read persisted draft from localStorage.
 * @param {string} key - Full storage key
 * @returns {object|null} Parsed data or null (always plain object or null, never array)
 */
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

/**
 * Read full persisted payload (including metadata like savedAt).
 * @param {string} key
 * @returns {{ values: object, savedAt?: string }|null}
 */
export function getDraftPayload(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

/**
 * Write draft to localStorage (sync). Prefer scheduleDraftSave for debounced writes.
 * @param {string} key
 * @param {object} values - Form values or payload
 * @param {{ formData?: object, savedAt?: string }} options - Optional wrapper
 */
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

/**
 * Debounced save: schedules a write after delay. Multiple calls with same key reset the timer.
 * @param {string} key
 * @param {object} values
 * @param {number} debounceMs
 */
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

/**
 * Cancel any pending debounced save for a key.
 * @param {string} key
 */
export function cancelScheduledSave(key) {
  pendingPayloads.delete(key)
  if (timers.has(key)) {
    clearTimeout(timers.get(key))
    timers.delete(key)
  }
}

const pendingPayloads = new Map()

/**
 * Flush all pending debounced saves (e.g. on beforeunload). Ensures last keystroke is persisted.
 */
export function flushPendingSaves() {
  pendingPayloads.forEach((values, key) => {
    setDraft(key, values)
  })
  pendingPayloads.clear()
  timers.forEach((t) => clearTimeout(t))
  timers.clear()
}

/**
 * Remove draft from localStorage (call after successful submit or explicit reset).
 * @param {string} key
 */
export function clearDraft(key) {
  cancelScheduledSave(key)
  try {
    localStorage.removeItem(key)
  } catch (e) {
    console.warn('[formPersistenceStorage] clearDraft failed:', e)
  }
}

/**
 * Merge default values with stored draft (stored wins for overlapping keys).
 * Always returns a plain object; never undefined or array.
 * @param {object} defaultValues
 * @param {object|null} stored
 * @returns {object}
 */
export function mergeWithDefaults(defaultValues, stored) {
  const defaults = defaultValues && typeof defaultValues === 'object' && !Array.isArray(defaultValues)
    ? defaultValues
    : {}
  if (!stored || typeof stored !== 'object' || Array.isArray(stored)) return { ...defaults }
  return { ...defaults, ...stored }
}

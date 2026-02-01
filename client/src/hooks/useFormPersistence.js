import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams } from 'react-router-dom'
import { buildDraftKey, getDraft, mergeWithDefaults, scheduleDraftSave, clearDraft as clearStorageDraft, cancelScheduledSave } from '../utils/formPersistenceStorage'

/**
 * Universal Form Persistence Hook
 * Provides consistent save/load functionality for all forms with optional localStorage
 * for instant recovery on refresh, tab close, or navigation.
 *
 * @param {Object} config - Configuration object
 * @param {Function} config.saveFn - Function to save data (returns Promise)
 * @param {Function} config.loadFn - Function to load data (returns Promise)
 * @param {string} config.entityType - Type of entity (e.g., 'company-profile', 'po', 'invoice')
 * @param {string} config.entityId - Optional entity ID for updates
 * @param {string} config.storagePathKey - Optional route key for localStorage (e.g. 'po-entry', 'invoice-entry'). Enables instant restore and debounced auto-save to localStorage.
 * @param {Object} config.defaultValues - Default form values
 * @param {number} config.autoSaveDelay - Auto-save delay in ms (default: 2000)
 * @param {number} config.localStorageDebounceMs - Debounce for localStorage writes (default: 1500)
 * @param {boolean|function(values): boolean} config.enableAutoSave - Enable auto-save on field change (default: true). If function, called with current values.
 * @returns {Object} - { values, setValues, loading, saving, error, save, load, reset, clearLocalDraft }
 */
export function useFormPersistence({
  saveFn,
  loadFn,
  entityType,
  entityId = null,
  storagePathKey = null,
  defaultValues = {},
  autoSaveDelay = 2000,
  localStorageDebounceMs = 1500,
  enableAutoSave = true,
}) {
  const params = useParams()
  const resolvedEntityId = entityId ?? params?.id ?? null
  const storageKey = storagePathKey ? buildDraftKey(storagePathKey, resolvedEntityId) : null

  const [values, setValues] = useState(() => {
    if (!storageKey) return defaultValues
    const stored = getDraft(storageKey)
    return mergeWithDefaults(defaultValues, stored)
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [lastSaved, setLastSaved] = useState(null)
  
  const autoSaveTimerRef = useRef(null)
  const isInitialLoadRef = useRef(true)
  const loadingInProgressRef = useRef(false)
  const loadFnRef = useRef(loadFn)
  const hasLoadedRef = useRef(false)
  const saveFnRef = useRef(saveFn)
  const valuesRef = useRef(values)
  const defaultValuesRef = useRef(defaultValues)
  const lastEntityIdRef = useRef(resolvedEntityId)
  const resolvedEntityIdRef = useRef(resolvedEntityId)
  
  // Update defaultValues ref when it changes
  useEffect(() => {
    defaultValuesRef.current = defaultValues
  }, [defaultValues])
  
  // Update refs when props change (but don't trigger reload)
  useEffect(() => {
    loadFnRef.current = loadFn
  }, [loadFn])
  
  // Update refs when values change
  useEffect(() => {
    saveFnRef.current = saveFn
    valuesRef.current = values
    resolvedEntityIdRef.current = resolvedEntityId
  }, [saveFn, values, resolvedEntityId])

  // Manual save function - define BEFORE auto-save effect to avoid initialization error
  const save = useCallback(async (showLoading = true) => {
    const currentSaveFn = saveFnRef.current
    const currentValues = valuesRef.current
    const currentEntityId = resolvedEntityIdRef.current
    
    if (!currentSaveFn) {
      console.warn(`[useFormPersistence] No save function provided for ${entityType}`)
      return null
    }

    try {
      if (showLoading) {
        setSaving(true)
      }
      setError(null)

      const result = await currentSaveFn(currentValues, currentEntityId)
      
      if (result) {
        setLastSaved(new Date().toISOString())
        
        // Update values if save function returns updated data
        if (result.values || result.data) {
          setValues(prev => ({
            ...prev,
            ...(result.values || result.data),
          }))
        }
        
        return result
      }
      
      return null
    } catch (err) {
      console.error(`[useFormPersistence] Failed to save ${entityType}:`, err)
      setError(err.message || 'Failed to save data')
      throw err
    } finally {
      if (showLoading) {
        setSaving(false)
      }
    }
  }, [entityType]) // Only entityType as dependency - use refs for others

  // Load data on mount - only once per entityId change
  useEffect(() => {
    // If a previous load was in progress (e.g. Strict Mode unmount), clear it so this mount can load
    if (loadingInProgressRef.current) {
      loadingInProgressRef.current = false
      setLoading(false)
    }

    // Skip if we've already loaded for this entityId
    if (hasLoadedRef.current && lastEntityIdRef.current === resolvedEntityId) {
      setLoading(false)
      return
    }
    
    // Skip if no loadFn provided
    if (!loadFnRef.current) {
      setLoading(false)
      isInitialLoadRef.current = false
      hasLoadedRef.current = true
      return
    }
    
    // Update last entityId
    const currentEntityId = resolvedEntityId
    const entityIdChanged = lastEntityIdRef.current !== currentEntityId
    lastEntityIdRef.current = currentEntityId
    
    // Reset hasLoaded if entityId changed
    if (entityIdChanged) {
      hasLoadedRef.current = false
      isInitialLoadRef.current = true
    }
    
    // Skip if we've already loaded and entityId hasn't changed
    if (hasLoadedRef.current && !entityIdChanged) {
      return
    }
    
    let mounted = true
    
    const loadData = async () => {
      const currentLoadFn = loadFnRef.current
      
      if (!currentLoadFn || loadingInProgressRef.current) {
        if (!currentLoadFn) {
          setLoading(false)
          isInitialLoadRef.current = false
          hasLoadedRef.current = true
        }
        return
      }

      loadingInProgressRef.current = true
      
      try {
        setLoading(true)
        setError(null)
        
        const data = await currentLoadFn(currentEntityId)
        
        if (mounted && data) {
          // Merge loaded data with defaults (loaded data takes precedence)
          setValues(prev => ({
            ...defaultValuesRef.current,
            ...prev,
            ...data,
          }))
          setLastSaved(new Date().toISOString())
          hasLoadedRef.current = true
        } else if (mounted) {
          // No data found, use defaults
          setValues(defaultValuesRef.current)
          hasLoadedRef.current = true
        }
      } catch (err) {
        console.error(`[useFormPersistence] Failed to load ${entityType}:`, err)
        if (mounted) {
          setError(err.message || 'Failed to load data')
          // Keep default values on error
          setValues(defaultValuesRef.current)
          hasLoadedRef.current = true // Mark as loaded even on error to prevent retry loops
        }
      } finally {
        if (mounted) {
          setLoading(false)
          isInitialLoadRef.current = false
          loadingInProgressRef.current = false
        }
      }
    }

    // Only load if we haven't loaded yet or entityId changed
    if (isInitialLoadRef.current || entityIdChanged) {
      loadData()
    }
    
    return () => {
      mounted = false
    }
  }, [resolvedEntityId]) // Only reload if entityId changes - defaultValues accessed via ref

  // Auto-save on field change (debounced)
  const autoSaveEnabled = typeof enableAutoSave === 'function' ? enableAutoSave(values) : !!enableAutoSave

  useEffect(() => {
    if (!autoSaveEnabled || !saveFnRef.current || isInitialLoadRef.current || loading || saving) {
      return
    }

    // Don't auto-save if values haven't actually changed (prevent save on initial load)
    if (Object.keys(values).length === 0) {
      return
    }

    // Clear existing timer
    if (autoSaveTimerRef.current) {
      clearTimeout(autoSaveTimerRef.current)
    }

    // Set new timer
    autoSaveTimerRef.current = setTimeout(() => {
      // Double-check we're not in initial load and have actual data
      if (!isInitialLoadRef.current && !loading && !saving && Object.keys(values).length > 0 && saveFnRef.current) {
        save(false).catch(err => {
          // Silently fail for auto-save - don't show errors to user
          console.warn(`[useFormPersistence] Auto-save failed for ${entityType}:`, err)
        })
      }
    }, autoSaveDelay)

    return () => {
      if (autoSaveTimerRef.current) {
        clearTimeout(autoSaveTimerRef.current)
      }
    }
  }, [values, autoSaveEnabled, autoSaveDelay, loading, saving, save]) // Include save but it's stable now

  // Persist values to localStorage (debounced) for instant recovery on refresh/tab close
  useEffect(() => {
    if (!storageKey || isInitialLoadRef.current || loading) return
    if (Object.keys(values).length === 0) return
    scheduleDraftSave(storageKey, values, localStorageDebounceMs)
    return () => cancelScheduledSave(storageKey)
  }, [values, storageKey, localStorageDebounceMs, loading])

  // Manual load function
  const load = useCallback(async () => {
    const currentLoadFn = loadFnRef.current
    
    if (!currentLoadFn) {
      console.warn(`[useFormPersistence] No load function provided for ${entityType}`)
      return null
    }

    try {
      setLoading(true)
      setError(null)
      
      const data = await currentLoadFn(resolvedEntityIdRef.current)
      
      if (data) {
        setValues(prev => ({
          ...defaultValuesRef.current,
          ...prev,
          ...data,
        }))
        setLastSaved(new Date().toISOString())
        hasLoadedRef.current = true
        return data
      }
      
      return null
    } catch (err) {
      console.error(`[useFormPersistence] Failed to load ${entityType}:`, err)
      setError(err.message || 'Failed to load data')
      throw err
    } finally {
      setLoading(false)
    }
  }, [entityType]) // Only entityType as dependency - use refs for others

  // Reset to default values and clear localStorage draft
  const reset = useCallback(() => {
    if (storageKey) clearStorageDraft(storageKey)
    setValues(defaultValuesRef.current)
    setError(null)
    setLastSaved(null)
  }, [storageKey])

  // Clear localStorage draft only (call after successful submit so reload doesn't restore old draft)
  const clearLocalDraft = useCallback(() => {
    if (storageKey) clearStorageDraft(storageKey)
  }, [storageKey])

  // Update single field
  const updateField = useCallback((field, value) => {
    setValues(prev => ({
      ...prev,
      [field]: value,
    }))
  }, [])

  // Update multiple fields
  const updateFields = useCallback((updates) => {
    setValues(prev => ({
      ...prev,
      ...updates,
    }))
  }, [])

  return {
    values,
    setValues,
    loading,
    saving,
    error,
    lastSaved,
    save,
    load,
    reset,
    clearLocalDraft,
    updateField,
    updateFields,
  }
}

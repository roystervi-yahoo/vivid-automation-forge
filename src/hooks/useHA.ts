import { useEffect, useState, useCallback } from 'react'

export interface HAEntity {
  entity_id: string
  state: string
  attributes?: Record<string, unknown>
}

const store: Record<string, HAEntity> = {}
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(l => l())

export function useHA(_pollMs: number = 30000) {
  const [, setTick] = useState(0)

  useEffect(() => {
    const l = () => setTick(n => n + 1)
    listeners.add(l)
    return () => { listeners.delete(l) }
  }, [])

  const getState = useCallback((entityId: string): HAEntity | undefined => {
    return store[entityId]
  }, [])

  const optimisticUpdate = useCallback((entityId: string, patch: Partial<HAEntity>) => {
    const cur = store[entityId] || { entity_id: entityId, state: 'unknown', attributes: {} }
    store[entityId] = {
      ...cur,
      ...patch,
      attributes: { ...(cur.attributes || {}), ...(patch.attributes || {}) },
    }
    notify()
  }, [])

  const refreshNow = useCallback(async () => { notify() }, [])

  return { getState, optimisticUpdate, refreshNow }
}
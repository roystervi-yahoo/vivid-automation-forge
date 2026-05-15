import { useEffect, useState, useCallback, useRef } from 'react'
import { haService, type HAEntityState } from '../services/haService'

export type HAEntity = HAEntityState

/** Module-level store shared by every useHA() consumer. */
const store: Record<string, HAEntity> = {}
const listeners = new Set<() => void>()
const notify = () => listeners.forEach(l => l())

let inflight: Promise<void> | null = null
let lastFetchAt = 0

async function fetchAll(force = false): Promise<void> {
  const now = Date.now()
  if (!force && now - lastFetchAt < 1000) return
  if (inflight) return inflight

  inflight = (async () => {
    try {
      const all = await haService.getAllStates()
      // Replace store contents
      for (const k of Object.keys(store)) delete store[k]
      for (const ent of all) store[ent.entity_id] = ent
      lastFetchAt = Date.now()
      notify()
    } catch (err) {
      console.error('[useHA] fetch failed:', err)
    } finally {
      inflight = null
    }
  })()
  return inflight
}

export function useHA(pollMs: number = 30000) {
  const [, setTick] = useState(0)
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    const l = () => setTick(n => n + 1)
    listeners.add(l)

    // Initial load + polling
    fetchAll()
    pollRef.current = setInterval(() => fetchAll(true), pollMs)

    return () => {
      listeners.delete(l)
      if (pollRef.current) clearInterval(pollRef.current)
    }
  }, [pollMs])

  const getState = useCallback((entityId: string): HAEntity | undefined => {
    return store[entityId]
  }, [])

  const optimisticUpdate = useCallback((entityId: string, patch: Partial<HAEntity>) => {
    const cur = store[entityId] || { entity_id: entityId, state: 'unknown', attributes: {} }
    store[entityId] = {
      ...cur,
      ...patch,
      attributes: { ...(cur.attributes || {}), ...(patch.attributes || {}) } as Record<string, unknown>,
    }
    notify()
  }, [])

  const refreshNow = useCallback(async () => { await fetchAll(true) }, [])

  return { getState, optimisticUpdate, refreshNow }
}
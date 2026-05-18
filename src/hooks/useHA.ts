import { useState, useEffect, useRef } from 'react'
import { haService } from '../services/haService'

export interface HAState {
  entity_id: string
  state: string
  attributes: Record<string, unknown>
  last_updated: string
}

let globalStates: Record<string, HAState> = {}
let listeners: Set<() => void> = new Set()
let pollTimer: ReturnType<typeof setInterval> | null = null
let optimisticLocks: Record<string, number> = {}

async function fetchStates() {
  try {
    const all = await haService.getStates()
    const now = Date.now()
    const map: Record<string, HAState> = {}
    for (const s of all) {
      if (optimisticLocks[s.entity_id] && optimisticLocks[s.entity_id] > now) {
        map[s.entity_id] = globalStates[s.entity_id] ?? s
      } else {
        map[s.entity_id] = s
      }
    }
    globalStates = map
    listeners.forEach(fn => fn())
  } catch (e) {
    console.error('HA fetch failed:', e)
  }
}

function startPolling() {
  if (pollTimer) return
  fetchStates()
  pollTimer = setInterval(fetchStates, 5000)  // poll every 5s
}

export function useHA() {
  const [, forceUpdate] = useState(0)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    const notify = () => { if (mounted.current) forceUpdate(n => n + 1) }
    listeners.add(notify)
    startPolling()
    return () => {
      mounted.current = false
      listeners.delete(notify)
    }
  }, [])

  const getState  = (entityId: string) => globalStates[entityId]
  const isOn      = (entityId: string) => {
    const s = globalStates[entityId]?.state
    return s === 'on' || s === 'open' || s === 'home' || s === 'playing'
  }

  const optimisticUpdate = (entityId: string, patch: Partial<HAState>) => {
    optimisticLocks[entityId] = Date.now() + 15000  // hold for 15s
    globalStates = {
      ...globalStates,
      [entityId]: { ...globalStates[entityId], ...patch } as HAState,
    }
    listeners.forEach(fn => fn())
  }

  const refreshNow = () => {
    if (pollTimer) { clearInterval(pollTimer); pollTimer = null }
    setTimeout(() => { fetchStates(); pollTimer = setInterval(fetchStates, 5000) }, 1500)
  }

  return { getState, isOn, optimisticUpdate, refreshNow, entities: globalStates }
}

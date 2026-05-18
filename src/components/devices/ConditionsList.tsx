import { useState, useEffect, useRef, useCallback } from 'react'
import { Thermometer, Zap, Play, Home, Minus, Plus, Sun, Fan, Droplets, Bot, Wind } from 'lucide-react'
import { useHA } from '../../hooks/useHA'
import { StatTile } from './StatTile'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'

function useLongPress(onLongPress: () => void, ms = 500) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const firedRef = useRef(false)
  const start = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('button[data-action]')) return
    firedRef.current = false
    timerRef.current = setTimeout(() => { firedRef.current = true; onLongPress() }, ms)
  }, [onLongPress, ms])
  const cancel = useCallback(() => { if (timerRef.current) clearTimeout(timerRef.current) }, [])
  const onClick = useCallback((e: React.MouseEvent) => { if (firedRef.current) e.stopPropagation() }, [])
  return { onMouseDown: start, onMouseUp: cancel, onMouseLeave: cancel, onTouchStart: start, onTouchEnd: cancel, onTouchCancel: cancel, onClick }
}

function PinWrapper({ id, pinned, onToggle, children, className = '' }: {
  id: string; pinned: boolean; onToggle: (id: string) => void
  children: React.ReactNode; className?: string
}) {
  const [flash, setFlash] = useState(false)
  const handleLongPress = useCallback(() => {
    onToggle(id); setFlash(true)
    setTimeout(() => setFlash(false), 600)
    if (navigator.vibrate) navigator.vibrate(40)
  }, [id, onToggle])
  const lp = useLongPress(handleLongPress)
  return (
    <div {...lp} className={`relative select-none touch-none ${className}`}
      style={{ animation: flash ? 'pinFlash 0.5s ease' : undefined }}>
      {pinned && (
        <span style={{ position: 'absolute', top: 4, right: 5, zIndex: 10,
          fontSize: 8, color: 'var(--neon-cyan)', opacity: 0.7,
          pointerEvents: 'none', userSelect: 'none' }}>📌</span>
      )}
      {children}
    </div>
  )
}

// ─── Card registry ────────────────────────────────────────────────────────────
type CardId = 'hot-water' | 'energy' | 'dreame' | 'saraiyah' | 'humidity' | 'air-quality'

const CARD_SIZE: Record<CardId, 1 | 2> = {
  'hot-water':   1,
  'energy':      1,
  'dreame':      2,
  'saraiyah':    2,
  'humidity':    1,
  'air-quality': 1,
}

const ALL_IDS: CardId[] = ['hot-water', 'energy', 'dreame', 'saraiyah', 'humidity', 'air-quality']

// Layout = ordered array of card IDs; sum of their sizes must equal 8
type Layout = CardId[]

function colCount(l: Layout) { return l.reduce((s, id) => s + CARD_SIZE[id], 0) }

// ─── Rotation engine ──────────────────────────────────────────────────────────
// Every tick we:
//   1. Pick a random unpinned slot (not the last one we touched)
//   2. Eject that card
//   3. Pick a random DIFFERENT card to insert at a random position in the layout
//   4. If the new card is double and another double is already shown, it can still
//      come in — the other double just stays wherever it is.
//   5. Patch the layout to keep total = 8 cols.

function buildNextLayout(layout: Layout, slotIdx: number, pinned: string[]): Layout | null {
  const ejectedId   = layout[slotIdx]
  const ejectedSize = CARD_SIZE[ejectedId]

  // All cards except the one being ejected, and not pinned
  const candidates = ALL_IDS.filter(id => id !== ejectedId && !pinned.includes(id))
  if (!candidates.length) return null

  const shuffled = [...candidates].sort(() => Math.random() - 0.5)

  for (const incoming of shuffled) {
    const inSize = CARD_SIZE[incoming]

    // Start from layout with the ejected slot removed
    let draft = layout.filter((_, i) => i !== slotIdx)

    // Also remove the incoming card from wherever it currently sits (it's relocating)
    draft = draft.filter(id => id !== incoming)

    // Pick a random insertion point in the draft
    const insertAt = Math.floor(Math.random() * (draft.length + 1))
    draft.splice(insertAt, 0, incoming)

    // Now fix the column count to reach exactly 8
    const cols = colCount(draft)
    const diff  = 8 - cols   // positive = need more cols, negative = too many

    if (diff === 0) return draft

    if (diff === 1) {
      // Need 1 more col — insert a hidden single card
      const shown   = new Set(draft)
      const fillers = ALL_IDS.filter(id => !shown.has(id) && !pinned.includes(id) && CARD_SIZE[id] === 1)
      if (!fillers.length) continue
      const filler = fillers[Math.floor(Math.random() * fillers.length)]
      // Insert filler at a random spot
      const fi = Math.floor(Math.random() * (draft.length + 1))
      draft.splice(fi, 0, filler)
      if (colCount(draft) === 8) return draft
      continue
    }

    if (diff === -1) {
      // 1 col too many — evict a random unpinned single that isn't the incoming card
      const evictable = draft
        .map((id, i) => ({ id, i }))
        .filter(({ id }) => id !== incoming && !pinned.includes(id) && CARD_SIZE[id] === 1)
      if (!evictable.length) continue
      const victim = evictable[Math.floor(Math.random() * evictable.length)]
      draft.splice(victim.i, 1)
      if (colCount(draft) === 8) return draft
      continue
    }

    if (diff === -2) {
      // ejected a single, incoming is double AND another double already in draft
      // evict two singles
      const evictable = draft
        .map((id, i) => ({ id, i }))
        .filter(({ id }) => id !== incoming && !pinned.includes(id) && CARD_SIZE[id] === 1)
      if (evictable.length < 2) continue
      // remove two (highest index first to preserve indices)
      const sorted = evictable.sort((a, b) => b.i - a.i).slice(0, 2)
      sorted.forEach(v => draft.splice(v.i, 1))
      if (colCount(draft) === 8) return draft
      continue
    }

    if (diff === 2) {
      // ejected a double, incoming is single — need 2 more cols, add 2 singles
      const shown   = new Set(draft)
      const fillers = ALL_IDS.filter(id => !shown.has(id) && !pinned.includes(id) && CARD_SIZE[id] === 1)
      if (fillers.length < 2) continue
      const f1 = fillers.splice(Math.floor(Math.random() * fillers.length), 1)[0]
      const f2 = fillers[Math.floor(Math.random() * fillers.length)]
      draft.push(f1); draft.push(f2)
      if (colCount(draft) === 8) return draft
      continue
    }
  }

  return null
}

// ─── Component ────────────────────────────────────────────────────────────────
export function ConditionsList() {
  const { getState } = useHA()
  const [pinned,   setPinned]   = useState<string[]>([])
  const [layout,   setLayout]   = useState<Layout>(['hot-water', 'energy', 'dreame', 'saraiyah', 'humidity', 'air-quality'])
  const [flipping, setFlipping] = useState<Set<number>>(new Set())

  const layoutRef   = useRef(layout)
  const pinnedRef   = useRef(pinned)
  const lastSlotRef = useRef(-1)

  useEffect(() => { layoutRef.current = layout }, [layout])
  useEffect(() => { pinnedRef.current = pinned  }, [pinned])

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/preferences`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d?.pinnedConditions)) setPinned(d.pinnedConditions) })
      .catch(() => {})
  }, [])

  const togglePin = useCallback((id: string) => {
    setPinned(prev => {
      const next = prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
      fetch(`${API_BASE}/api/settings/preferences`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pinnedConditions: next }),
      }).catch(() => {})
      return next
    })
  }, [])

  // Rotation engine
  useEffect(() => {
    const t = setInterval(() => {
      const cur   = layoutRef.current
      const pins  = pinnedRef.current
      const last  = lastSlotRef.current

      // Pick a random unpinned slot that wasn't last flipped
      const eligible = cur
        .map((id, i) => ({ id, i }))
        .filter(({ id, i }) => !pins.includes(id) && i !== last)
      if (!eligible.length) return

      const slot = eligible[Math.floor(Math.random() * eligible.length)].i
      lastSlotRef.current = slot

      setFlipping(prev => new Set(prev).add(slot))

      setTimeout(() => {
        const next = buildNextLayout(layoutRef.current, slot, pinnedRef.current)
        if (next) setLayout(next)
        setFlipping(prev => { const s = new Set(prev); s.delete(slot); return s })
      }, 350)
    }, 5000)

    return () => clearInterval(t)
  }, [])

  // HA state
  const hotWaterTemp  = getState('sensor.hot_water_tank_temperature')
  const totalPower    = getState('sensor.balance_power_minute_average')
  const humidity      = getState('sensor.indoor_humidity')
  const saraiyahTemp  = getState('sensor.saraiyah_room_temperature')
  const saraiyahLight = getState('light.saraiyah_room_light')
  const saraiyahFan   = getState('fan.saraiyah_room_fan')
  const dreame        = getState('vacuum.dreame_vacuum')

  const kwTotal = totalPower   ? (parseFloat(totalPower.state) / 1000).toFixed(2) : '—'
  const hwTemp  = hotWaterTemp ? Math.round(parseFloat(hotWaterTemp.state)).toString() : '—'
  const hum     = humidity     ? Math.round(parseFloat(humidity.state)).toString()     : '—'
  const sarTemp = saraiyahTemp ? Math.round(parseFloat(saraiyahTemp.state)).toString() : '28'

  const dreameStatus   = dreame?.state === 'cleaning' ? 'on' : dreame?.state === 'unavailable' ? 'unavailable' : 'off'
  const saraiyahStatus = saraiyahLight?.state === 'on' || saraiyahFan?.state === 'on' ? 'on' : 'off'

  const ip = (id: string) => pinned.includes(id)

  const renderCard = (id: CardId, slotIdx: number) => {
    const span   = CARD_SIZE[id] === 2 ? 'col-span-2' : ''
    const isFlip = flipping.has(slotIdx)

    const inner = (() => {
      switch (id) {
        case 'hot-water':
          return <StatTile icon={Thermometer} label="Hot Water" value={hwTemp} unit="°F" accent="magenta" />

        case 'energy':
          return <StatTile icon={Zap} label="Energy" value={kwTotal} unit="kW" accent="amber" footer="live" />

        case 'dreame':
          return (
            <div className="device-tile !p-3 h-full">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border-2 border-[var(--neon-violet)]/50 flex items-center justify-center bg-[var(--neon-violet)]/10 shrink-0">
                  <Bot className="h-5 w-5 text-[var(--neon-violet)]" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] font-bold uppercase tracking-[0.18em]">Dreame</div>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={dreameStatus === 'on' ? 'pulse-dot' : dreameStatus === 'unavailable' ? 'pulse-dot warn' : 'pulse-dot off'} />
                    <span className="text-[9px] digit-font text-muted-foreground">{dreameStatus.toUpperCase()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 shrink-0">
                  <button data-action="start" className="px-2.5 py-1 rounded-md bg-[var(--neon-lime)]/10 border border-[var(--neon-lime)]/40 flex items-center gap-1 hover:bg-[var(--neon-lime)]/20 transition">
                    <Play className="h-3 w-3 text-[var(--neon-lime)]" />
                    <span className="text-[9px] digit-font text-[var(--neon-lime)]">START</span>
                  </button>
                  <button data-action="home" className="px-2.5 py-1 rounded-md bg-white/5 border border-border flex items-center gap-1 hover:bg-white/10 transition">
                    <Home className="h-3 w-3 text-muted-foreground" />
                    <span className="text-[9px] digit-font text-muted-foreground">HOME</span>
                  </button>
                </div>
              </div>
            </div>
          )

        case 'saraiyah':
          return (
            <div className="device-tile !p-3 h-full relative">
              <div className="absolute top-2 right-3 flex items-center gap-1.5">
                <span className={saraiyahStatus === 'on' ? 'pulse-dot' : 'pulse-dot off'} />
                <span className="text-[9px] digit-font text-[var(--neon-lime)]">{saraiyahStatus === 'on' ? 'HOME' : 'AWAY'}</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="text-center shrink-0">
                  <div className="text-[10px] uppercase tracking-[0.18em] font-bold">Saraiyah</div>
                  <div className="digit-font text-2xl text-[var(--neon-amber)] font-bold mt-0.5">{sarTemp}°</div>
                  <div className="flex items-center justify-center gap-1 mt-1">
                    <button data-action="temp-down" className="h-5 w-5 rounded bg-white/5 border border-border flex items-center justify-center hover:bg-white/10 transition">
                      <Minus className="h-2.5 w-2.5 text-muted-foreground" />
                    </button>
                    <span className="text-[9px] digit-font text-muted-foreground">85°</span>
                    <button data-action="temp-up" className="h-5 w-5 rounded bg-white/5 border border-border flex items-center justify-center hover:bg-white/10 transition">
                      <Plus className="h-2.5 w-2.5 text-muted-foreground" />
                    </button>
                  </div>
                </div>
                <div className="flex-1 grid grid-cols-2 gap-2">
                  <div className="rounded-lg bg-white/5 border border-border p-2">
                    <div className="flex items-center gap-1.5">
                      <Sun className="h-3 w-3 text-[var(--neon-amber)]" />
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Light</span>
                    </div>
                    <div className="text-[10px] digit-font text-foreground/80 mt-1">{saraiyahLight?.state?.toUpperCase() || 'OFF'}</div>
                  </div>
                  <div className="rounded-lg bg-white/5 border border-border p-2">
                    <div className="flex items-center gap-1.5">
                      <Fan className="h-3 w-3 text-[var(--neon-cyan)]" />
                      <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Fan</span>
                    </div>
                    <div className="text-[10px] digit-font text-foreground/80 mt-1">{saraiyahFan?.state?.toUpperCase() || 'OFF'}</div>
                  </div>
                </div>
              </div>
              <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--neon-lime)] to-transparent opacity-60" />
            </div>
          )

        case 'humidity':
          return <StatTile icon={Droplets} label="Humidity" value={hum} unit="%" accent="cyan" />

        case 'air-quality':
          return <StatTile icon={Wind} label="Air Quality" value="—" unit="AQI" accent="lime" />
      }
    })()

    return (
      <PinWrapper
        key={`slot-${slotIdx}`}
        id={id}
        pinned={ip(id)}
        onToggle={togglePin}
        className={`${span} ${isFlip ? 'cond-flip-out' : 'cond-flip-in'}`}
      >
        {inner}
      </PinWrapper>
    )
  }

  return (
    <>
      <style>{`
        @keyframes pinFlash {
          0%   { box-shadow: 0 0 0 0 rgba(0,255,255,0.5); }
          50%  { box-shadow: 0 0 0 6px rgba(0,255,255,0.25); }
          100% { box-shadow: 0 0 0 0 rgba(0,255,255,0); }
        }
        @keyframes condFlipOut {
          0%   { opacity: 1; transform: rotateY(0deg);   }
          100% { opacity: 0; transform: rotateY(90deg);  }
        }
        @keyframes condFlipIn {
          0%   { opacity: 0; transform: rotateY(-90deg); }
          100% { opacity: 1; transform: rotateY(0deg);   }
        }
        .cond-flip-out { animation: condFlipOut 0.32s ease-in  forwards; transform-style: preserve-3d; }
        .cond-flip-in  { animation: condFlipIn  0.32s ease-out forwards; transform-style: preserve-3d; }
      `}</style>
      <div className="grid grid-cols-8 gap-2">
        {layout.map((id, i) => renderCard(id, i))}
      </div>
    </>
  )
}
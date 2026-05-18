import React from 'react'

type Accent = 'cyan' | 'magenta' | 'amber' | 'lime' | 'violet'
type Status = 'on' | 'off' | 'open' | 'offline' | 'unavailable'

export interface Device {
  id: string
  name: string
  sub?: string
  entityId?: string
  status: Status
  icon: React.ComponentType<{ className?: string }>
  accent?: Accent
}

function accentClass(a?: Accent) {
  switch (a) {
    case 'cyan':    return 'text-[var(--neon-cyan)]'
    case 'magenta': return 'text-[var(--neon-magenta)]'
    case 'amber':   return 'text-[var(--neon-amber)]'
    case 'lime':    return 'text-[var(--neon-lime)]'
    case 'violet':  return 'text-[var(--neon-violet)]'
    default:        return 'text-muted-foreground'
  }
}

function statusDot(s: Status) {
  if (s === 'on' || s === 'open')              return 'pulse-dot'
  if (s === 'offline' || s === 'unavailable')  return 'pulse-dot warn'
  return 'pulse-dot off'
}

export function DeviceTile({ d }: { d: Device }) {
  const Icon   = d.icon
  const active = d.status === 'on' || d.status === 'open'
  return (
    <button className={`device-tile text-left w-full !p-2.5 ${active ? 'active' : ''}`}>
      <div className="flex items-center gap-2">
        <div className={`relative h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${active ? 'bg-primary/15' : 'bg-white/5'}`}>
          <Icon className={`h-4 w-4 ${active ? (accentClass(d.accent) || 'text-primary') : 'text-muted-foreground'}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] text-foreground/90 truncate font-semibold">{d.name}</div>
          {d.sub && <div className="text-[9px] text-muted-foreground/70 truncate">{d.sub}</div>}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={statusDot(d.status)} />
            <span className="digit-font text-[9px] text-foreground/70">{d.status.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </button>
  )
}

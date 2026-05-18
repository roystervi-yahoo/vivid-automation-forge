import {
  DoorOpen, Droplets, Shirt, Wind, Flame, Bot,
  Thermometer, Zap, Play, Home, Minus, Plus, Sun, Fan,
} from 'lucide-react'
import { useHA } from '../../hooks/useHA'

type Accent = 'cyan' | 'magenta' | 'amber' | 'lime' | 'violet'
type Status = 'on' | 'off' | 'open' | 'offline' | 'unavailable'

interface Device {
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
  if (s === 'on' || s === 'open') return 'pulse-dot'
  if (s === 'offline' || s === 'unavailable') return 'pulse-dot warn'
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

function StatTile({ icon: Icon, label, value, unit, accent, footer }: {
  icon: React.ComponentType<{ className?: string }>
  label: string; value: string; unit?: string
  accent: Accent; footer?: string
}) {
  return (
    <div className="device-tile !p-3 relative">
      <div className="flex items-start justify-between">
        <Icon className={`h-4 w-4 ${accentClass(accent)}`} />
        {footer && <span className="text-[9px] digit-font text-muted-foreground/60 uppercase">{footer}</span>}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="digit-font text-2xl text-foreground/95 font-bold">{value}</span>
        {unit && <span className="text-[10px] text-muted-foreground digit-font">{unit}</span>}
      </div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 mt-0.5">{label}</div>
      <div className={`absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-current to-transparent ${accentClass(accent)} opacity-50`} />
    </div>
  )
}

const STATIC_DEVICES: Device[] = [
  { id: 'den',       name: 'Den',         sub: 'Window',   status: 'open',      icon: DoorOpen,  accent: 'amber'  },
  { id: 'recirc',    name: 'Recirc Pump',                  status: 'on',        icon: Droplets,  accent: 'cyan'   },
  { id: 'washer',    name: 'Washer',                       status: 'off',       icon: Shirt                       },
  { id: 'dryer',     name: 'Dryer',                        status: 'offline',   icon: Wind                        },
  { id: 'hotwater',  name: 'Hot Water',                    status: 'offline',   icon: Flame                       },
  { id: 'purifier1', name: 'Air Purifier', sub: 'Living',  status: 'off',       icon: Wind                        },
  { id: 'purifier2', name: 'Air Purifier', sub: 'Master',  status: 'off',       icon: Wind                        },
  { id: 'vacuum',    name: 'L10S Vacuum',                  status: 'off',       icon: Bot,       accent: 'lime'   },
]

export function DevicesConditions() {
  return (
    <section className="flex flex-col gap-2 shrink-0">
      {/* Section header */}
      <div className="flex items-center gap-3">
        <div className="h-px flex-1 bg-gradient-to-r from-[var(--neon-cyan)]/60 via-primary/20 to-transparent" />
      </div>

      {/* Device tiles grid */}
      <div className="grid grid-cols-8 gap-2">
        {STATIC_DEVICES.map(d => <DeviceTile key={d.id} d={d} />)}
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-8 gap-2">
        <StatTile icon={Thermometer} label="Hot Water"  value="—"    unit="°F" accent="magenta" />
        <StatTile icon={Zap}         label="Energy"     value="1.17" unit="kW" accent="amber" footer="tap" />

        {/* Dreame tile — spans 2 cols */}
        <div className="device-tile !p-3 col-span-2">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-[var(--neon-violet)]/50 flex items-center justify-center bg-[var(--neon-violet)]/10">
              <Bot className="h-5 w-5 text-[var(--neon-violet)]" />
            </div>
            <div className="flex-1">
              <div className="text-[11px] font-bold uppercase tracking-[0.18em]">Dreame</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="pulse-dot warn" />
                <span className="text-[9px] digit-font text-muted-foreground">UNAVAILABLE</span>
              </div>
            </div>
            <div className="flex flex-col gap-1">
              <button className="px-2.5 py-1 rounded-md bg-[var(--neon-lime)]/10 border border-[var(--neon-lime)]/40 flex items-center gap-1">
                <Play className="h-3 w-3 text-[var(--neon-lime)]" />
                <span className="text-[9px] digit-font text-[var(--neon-lime)]">START</span>
              </button>
              <button className="px-2.5 py-1 rounded-md bg-white/5 border border-border flex items-center gap-1">
                <Home className="h-3 w-3 text-muted-foreground" />
                <span className="text-[9px] digit-font text-muted-foreground">HOME</span>
              </button>
            </div>
          </div>
        </div>

        {/* Saraiyah room — spans 2 cols */}
        <div className="device-tile !p-3 col-span-2 relative">
          <div className="absolute top-2 right-3 flex items-center gap-1.5">
            <span className="pulse-dot" />
            <span className="text-[9px] digit-font text-[var(--neon-lime)]">HOME</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-center">
              <div className="text-[10px] uppercase tracking-[0.18em] font-bold">Saraiyah</div>
              <div className="digit-font text-2xl text-[var(--neon-amber)] font-bold mt-0.5">28°</div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <button className="h-5 w-5 rounded bg-white/5 border border-border flex items-center justify-center"><Minus className="h-2.5 w-2.5 text-muted-foreground" /></button>
                <span className="text-[9px] digit-font text-muted-foreground">85°</span>
                <button className="h-5 w-5 rounded bg-white/5 border border-border flex items-center justify-center"><Plus className="h-2.5 w-2.5 text-muted-foreground" /></button>
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-white/5 border border-border p-2">
                <div className="flex items-center gap-1.5"><Sun className="h-3 w-3 text-[var(--neon-amber)]" /><span className="text-[9px] uppercase tracking-widest text-muted-foreground">Light</span></div>
                <div className="text-[10px] digit-font text-foreground/80 mt-1">OFF</div>
              </div>
              <div className="rounded-lg bg-white/5 border border-border p-2">
                <div className="flex items-center gap-1.5"><Fan className="h-3 w-3 text-[var(--neon-cyan)]" /><span className="text-[9px] uppercase tracking-widest text-muted-foreground">Fan</span></div>
                <div className="text-[10px] digit-font text-foreground/80 mt-1">OFF</div>
              </div>
            </div>
          </div>
          <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--neon-lime)] to-transparent opacity-60" />
        </div>

        <StatTile icon={Droplets} label="Humidity" value="—" unit="%" accent="cyan" />
      </div>
    </section>
  )
}

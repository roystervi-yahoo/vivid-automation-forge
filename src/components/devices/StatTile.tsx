import React from 'react'

type Accent = 'cyan' | 'magenta' | 'amber' | 'lime' | 'violet'

function accentClass(a: Accent) {
  switch (a) {
    case 'cyan':    return 'text-[var(--neon-cyan)]'
    case 'magenta': return 'text-[var(--neon-magenta)]'
    case 'amber':   return 'text-[var(--neon-amber)]'
    case 'lime':    return 'text-[var(--neon-lime)]'
    case 'violet':  return 'text-[var(--neon-violet)]'
    default:        return 'text-muted-foreground'
  }
}

export function StatTile({ icon: Icon, label, value, unit, accent, footer }: {
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

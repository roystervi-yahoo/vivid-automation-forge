import { useState, useEffect } from 'react'
import { Home, RefreshCw, Maximize2, Play, Wifi, Battery, Zap, Volume2, Power, Settings } from 'lucide-react'
import { GitHubSyncStatus } from './GitHubSyncStatus'

function Clock() {
  const [time, setTime] = useState('')
  useEffect(() => {
    const u = () => {
      const d  = new Date()
      let h    = d.getHours()
      const m  = d.getMinutes().toString().padStart(2, '0')
      const ap = h >= 12 ? 'PM' : 'AM'
      h        = h % 12 || 12
      setTime(`${h.toString().padStart(2, '0')}:${m} ${ap}`)
    }
    u(); const t = setInterval(u, 30000); return () => clearInterval(t)
  }, [])
  return (
    <div className="glass-panel px-6 py-2 flex items-center gap-3">
      <div className="pulse-dot" />
      <span className="digit-font text-xl neon-text font-bold">{time || '—'}</span>
    </div>
  )
}

function TBtn({ icon: Icon, danger, onClick }: { icon: React.ComponentType<{className?:string}>, danger?: boolean, onClick?: () => void }) {
  return (
    <button onClick={onClick} className="h-9 w-9 glass-panel flex items-center justify-center hover:border-primary/60 transition !rounded-lg">
      <Icon className={`h-4 w-4 ${danger ? 'text-red-400' : 'text-primary'}`} />
    </button>
  )
}

interface Props {
  onSettingsOpen: () => void
  onESPHomeOpen:  () => void
}

export function Header({ onSettingsOpen, onESPHomeOpen }: Props) {
  return (
    <header className="glass-panel px-4 py-2 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-3">
        <button onClick={onSettingsOpen} className="h-9 w-9 rounded-lg bg-white/5 border border-border flex items-center justify-center hover:border-primary">
          <div className="flex flex-col gap-1">
            <span className="block w-3.5 h-0.5 bg-primary" />
            <span className="block w-3.5 h-0.5 bg-primary" />
            <span className="block w-3.5 h-0.5 bg-primary" />
          </div>
        </button>
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-magenta)]/20 border border-primary/40 flex items-center justify-center shadow-[0_0_15px_oklch(0.82_0.16_210/0.3)]">
          <Home className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-[0.2em] neon-text leading-none">HA DASH</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] digit-font text-[var(--neon-magenta)]">v8.0.0</span>
            <span className="h-px w-24 bg-gradient-to-r from-primary/60 to-transparent" />
          </div>
        </div>
      </div>

      <Clock />

      <div className="flex items-center gap-1.5">
        <GitHubSyncStatus />
        <TBtn icon={RefreshCw} />
        <TBtn icon={Maximize2} />
        <TBtn icon={Play} />
        <TBtn icon={Wifi} />
        <div className="h-9 px-2.5 glass-panel flex items-center gap-1.5 !rounded-lg">
          <Battery className="h-3.5 w-3.5 text-[var(--neon-lime)]" />
          <Zap className="h-3 w-3 text-[var(--neon-lime)]" />
          <span className="digit-font text-[10px] text-[var(--neon-lime)]">100%</span>
        </div>
        <TBtn icon={Volume2} />
        <button
          onClick={onESPHomeOpen}
          className="h-9 px-3 rounded-lg bg-[var(--neon-violet)]/20 border border-[var(--neon-violet)]/50 text-[var(--neon-violet)] font-bold tracking-[0.15em] text-[10px] hover:bg-[var(--neon-violet)]/30 transition"
        >
          ESP
        </button>
        <button className="h-9 px-3 rounded-lg bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] text-primary-foreground font-bold tracking-[0.2em] text-[10px] shadow-[0_0_20px_oklch(0.82_0.16_210/0.5)] hover:shadow-[0_0_35px_oklch(0.82_0.16_210/0.7)] transition">
          BUILD
        </button>
        <TBtn icon={Power} danger />
      </div>
    </header>
  )
}

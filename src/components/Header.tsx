import { useState, useEffect } from "react"
import { Home, Power, Maximize2, Minimize2 } from "lucide-react"

const API_BASE = import.meta.env.VITE_API_BASE || "http://192.168.1.4:3001"

function useOnlineStatus() {
  const [backend, setBackend] = useState(false)
  const [ha, setHa] = useState(false)
  useEffect(() => {
    const check = async () => {
      try { const r = await fetch(API_BASE + "/api/health", { signal: AbortSignal.timeout(3000) }); setBackend(r.ok) } catch { setBackend(false) }
      try { const r = await fetch(API_BASE + "/api/ha/states", { signal: AbortSignal.timeout(5000) }); const d = await r.json(); setHa(Array.isArray(d) && d.length > 0) } catch { setHa(false) }
    }
    check(); const t = setInterval(check, 15000); return () => clearInterval(t)
  }, [])
  return { backend, ha }
}

function Clock() {
  const [time, setTime] = useState("")
  useEffect(() => {
    const u = () => { const d = new Date(); let h = d.getHours(); const m = d.getMinutes().toString().padStart(2,"0"); const ap = h >= 12 ? "PM" : "AM"; h = h % 12 || 12; setTime(h.toString().padStart(2,"0") + ":" + m + " " + ap) }
    u(); const t = setInterval(u, 30000); return () => clearInterval(t)
  }, [])
  return (
    <div className="glass-panel px-6 py-2 flex items-center gap-3">
      <div className="pulse-dot" />
      <span className="digit-font text-xl neon-text font-bold">{time || "---"}</span>
    </div>
  )
}

function WifiBars() {
  const { backend, ha } = useOnlineStatus()
  const heights = ["h-2", "h-3.5", "h-5", "h-7"]
  const bars = [
    { active: backend, blink: !backend },
    { active: backend, blink: !backend },
    { active: ha, blink: !ha && backend },
    { active: ha, blink: !ha && backend },
  ]
  return (
    <div className="glass-panel h-9 px-3 flex items-end gap-0.5 pb-1.5 !rounded-lg" title={"Backend: " + (backend ? "online" : "offline") + " - HA: " + (ha ? "online" : "offline")}>
      <style>{"@keyframes bar-blink { 0%,100%{opacity:1} 50%{opacity:0.15} }"}</style>
      {bars.map((b, i) => {
        const color = b.active ? (i < 2 ? "var(--neon-cyan)" : "var(--neon-lime)") : "#374151"
        return <div key={i} className={"w-1.5 rounded-sm " + heights[i] + " transition-colors duration-500"} style={{ background: color, boxShadow: b.active ? "0 0 6px " + color : "none", animation: b.blink ? "bar-blink 1s ease-in-out infinite" : "none", animationDelay: (i * 0.1) + "s" }} />
      })}
    </div>
  )
}

interface Props { onSettingsOpen: () => void; onESPHomeOpen: () => void }

export function Header({ onSettingsOpen, onESPHomeOpen }: Props) {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [refreshing,   setRefreshing]   = useState(false)

  useEffect(() => {
    const fn = () => setIsFullscreen(!!document.fullscreenElement)
    document.addEventListener("fullscreenchange", fn)
    return () => document.removeEventListener("fullscreenchange", fn)
  }, [])

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) document.documentElement.requestFullscreen().catch(() => {})
    else document.exitFullscreen().catch(() => {})
  }

  const refreshDashboard = async () => {
    setRefreshing(true)
    try { await fetch(API_BASE + "/api/health") } catch {}
    window.location.reload()
  }

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
        <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-magenta)]/20 border border-primary/40 flex items-center justify-center">
          <Home className="h-4 w-4 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-black tracking-[0.2em] neon-text leading-none">HA DASH</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-[9px] digit-font text-[var(--neon-magenta)]">v9.0.0</span>
            <span className="h-px w-24 bg-gradient-to-r from-primary/60 to-transparent" />
          </div>
        </div>
      </div>
      <Clock />
      <div className="flex items-center gap-1.5">
        <WifiBars />
        <button onClick={onESPHomeOpen} className="h-9 px-3 rounded-lg bg-[var(--neon-violet)]/20 border border-[var(--neon-violet)]/50 text-[var(--neon-violet)] font-bold tracking-[0.15em] text-[10px] hover:bg-[var(--neon-violet)]/30 transition">ESP</button>
        <button onClick={refreshDashboard} disabled={refreshing} className="h-9 w-9 glass-panel flex items-center justify-center hover:border-primary/60 transition !rounded-lg disabled:opacity-50" title="Refresh Dashboard">
          <Power className="h-4 w-4 text-primary" style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
        </button>
        <button onClick={toggleFullscreen} className="h-9 w-9 glass-panel flex items-center justify-center hover:border-primary/60 transition !rounded-lg" title="Toggle Fullscreen">
          {isFullscreen ? <Minimize2 className="h-4 w-4 text-primary" /> : <Maximize2 className="h-4 w-4 text-primary" />}
        </button>
      </div>
    </header>
  )
}

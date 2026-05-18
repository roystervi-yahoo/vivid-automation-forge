import { useState, useEffect } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'

export default function FlightCard() {
  const [flights, setFlights] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tick,    setTick]    = useState(0)

  useEffect(() => {
    const load = async () => {
      try {
        const r = await fetch(`${API_BASE}/api/flights`)
        if (r.ok) setFlights(await r.json())
      } catch {}
      setLoading(false)
    }
    load()
    const t = setInterval(() => { load(); setTick(p=>p+1) }, 30000)
    return () => clearInterval(t)
  }, [])

  const statusColor = (s: string) => {
    if (!s) return 'var(--neon-cyan)'
    if (s.toLowerCase().includes('land') || s.toLowerCase().includes('arriv')) return 'var(--neon-lime)'
    if (s.toLowerCase().includes('delay') || s.toLowerCase().includes('cancel')) return '#ff4444'
    if (s.toLowerCase().includes('board') || s.toLowerCase().includes('depart')) return 'var(--neon-magenta)'
    return 'var(--neon-cyan)'
  }

  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-base">✈️</span>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--neon-cyan)]">Flight Tracker</span>
        </div>
        <div className="digit-font text-[9px] text-muted-foreground">{flights.length} tracked</div>
      </div>

      {/* Flights */}
      <div className="flex-1 overflow-y-auto p-2 flex flex-col gap-1.5">
        {loading && <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">Loading...</div>}
        {!loading && flights.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 text-center">
            <div className="text-3xl">✈️</div>
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">No Flights Tracked</div>
            <div className="text-[9px] text-muted-foreground/50">Add flights in Settings</div>
          </div>
        )}
        {flights.map((f: any, i: number) => (
          <div key={i} className="glass-panel !p-2 flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <span className="digit-font text-[11px] font-black text-[var(--neon-cyan)]">{f.flightNumber || f.flight_number || f.id}</span>
                <span className="text-[9px] text-muted-foreground">{f.airline}</span>
              </div>
              <span className="digit-font text-[9px] font-bold px-1.5 py-0.5 rounded-full border"
                style={{color: statusColor(f.status), borderColor: statusColor(f.status)+'44', background: statusColor(f.status)+'11'}}>
                {f.status || 'Scheduled'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px]">
              <span className="font-black text-foreground">{f.origin || f.departure}</span>
              <span className="text-muted-foreground flex-1 text-center">──✈──</span>
              <span className="font-black text-foreground">{f.destination || f.arrival}</span>
            </div>
            {(f.departureTime || f.departure_time) && (
              <div className="flex justify-between text-[9px] text-muted-foreground">
                <span>Dep: <span className="digit-font text-foreground/80">{f.departureTime || f.departure_time}</span></span>
                {(f.arrivalTime || f.arrival_time) && <span>Arr: <span className="digit-font text-foreground/80">{f.arrivalTime || f.arrival_time}</span></span>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

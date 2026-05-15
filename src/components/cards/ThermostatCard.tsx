import { useState, useEffect } from 'react'
import { Settings, Minus, Plus, Power, Flame, Snowflake, RefreshCw } from 'lucide-react'
import { useHA } from '../../hooks/useHA'
import { haService } from '../../services/haService'

export function ThermostatCard() {
  const { getState, optimisticUpdate, refreshNow } = useHA(15000)
  const climate    = getState('climate.bobby')
  const tempSensor = getState('sensor.house_temperature')
  const humidity   = getState('sensor.bobby_humidity')
  const outside    = getState('sensor.jax_temp')

  const currentTemp = parseFloat(tempSensor?.state || '0')
  const setPoint    = parseFloat((climate?.attributes as Record<string,unknown>)?.temperature as string || '87')
  const mode        = climate?.state || 'off'
  const humVal      = humidity?.state || '—'

  const [localTemp, setLocalTemp] = useState(setPoint)
  useEffect(() => { setLocalTemp(setPoint) }, [setPoint])

  const pct = Math.min(1, Math.max(0, (localTemp - 60) / 30))

  const setTemp = async (newTemp: number) => {
    setLocalTemp(newTemp)
    // Instant UI update
    optimisticUpdate('climate.bobby', {
      attributes: { ...(climate?.attributes || {}), temperature: newTemp } as Record<string,unknown>
    })
    haService.callService('climate', 'set_temperature', {
      entity_id: 'climate.bobby',
      temperature: newTemp,
    }).then(() => refreshNow()).catch(console.error)
  }

  const setMode = async (newMode: string) => {
    // Instant UI update
    optimisticUpdate('climate.bobby', { state: newMode })
    haService.callService('climate', 'set_hvac_mode', {
      entity_id: 'climate.bobby',
      hvac_mode: newMode,
    }).then(() => refreshNow()).catch(console.error)
  }

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-start justify-between">
        <button className="h-8 w-8 rounded-lg bg-white/5 border border-border flex items-center justify-center hover:border-primary/50">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">Climate Zone</div>
          <div className="text-xs font-bold tracking-wide neon-text">HOUSE</div>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center my-2">
        <div className={`relative w-44 h-44 transition-opacity ${mode === 'off' ? 'opacity-40' : 'opacity-100'}`}>
          <div className="absolute inset-0 rounded-full border border-primary/20" />
          <div className="absolute inset-1 rounded-full" style={{
            background: `conic-gradient(from 220deg, var(--neon-cyan) 0deg, var(--neon-magenta) ${pct * 280}deg, oklch(0.3 0.05 260 / 0.4) ${pct * 280}deg, oklch(0.3 0.05 260 / 0.4) 280deg, transparent 280deg)`,
            mask: 'radial-gradient(circle, transparent 64%, #000 66%, #000 72%, transparent 73%)',
            WebkitMask: 'radial-gradient(circle, transparent 64%, #000 66%, #000 72%, transparent 73%)',
            filter: 'drop-shadow(0 0 10px oklch(0.82 0.16 210 / 0.5))',
          }} />
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[oklch(0.22_0.06_260)] to-[oklch(0.14_0.05_260)] flex flex-col items-center justify-center shadow-[inset_0_6px_20px_oklch(0_0_0/0.6)]">
            <div className="digit-font text-4xl font-bold text-foreground tracking-tight">
              {localTemp}<span className="text-lg align-top text-primary">°</span>
            </div>
            <Snowflake className="h-3.5 w-3.5 text-[var(--neon-cyan)] mt-1" />
            <div className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">Set Point</div>
          </div>
          <button onClick={() => setTemp(Math.max(60, localTemp - 1))}
            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 h-9 w-9 rounded-full bg-[oklch(0.22_0.06_260)] border border-primary/30 flex items-center justify-center hover:border-primary z-10">
            <Minus className="h-3.5 w-3.5 text-primary" />
          </button>
          <button onClick={() => setTemp(Math.min(90, localTemp + 1))}
            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 h-9 w-9 rounded-full bg-[oklch(0.22_0.06_260)] border border-primary/30 flex items-center justify-center hover:border-primary z-10">
            <Plus className="h-3.5 w-3.5 text-primary" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {[
          { l: 'Off',  i: Power,     m: 'off',  color: '' },
          { l: 'Heat', i: Flame,     m: 'heat', color: 'text-[var(--neon-amber)]' },
          { l: 'Cool', i: Snowflake, m: 'cool', color: 'text-[var(--neon-cyan)]' },
          { l: 'Auto', i: RefreshCw, m: 'auto', color: '' },
        ].map((m) => {
          const Mi     = m.i
          const active = mode === m.m
          return (
            <button key={m.l} onClick={() => setMode(m.m)}
              className={`py-2 rounded-lg flex flex-col items-center gap-0.5 border transition ${active ? 'bg-primary/10 border-primary/50' : 'bg-white/5 border-white/5 hover:border-primary/30'}`}>
              <Mi className={`h-3.5 w-3.5 ${m.color || (active ? 'text-primary' : 'text-muted-foreground')}`} />
              <span className="text-[8px] uppercase tracking-widest text-muted-foreground">{m.l}</span>
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
        {[
          { l: 'Indoor',   v: currentTemp ? `${currentTemp}°` : '—' },
          { l: 'Humidity', v: humVal ? `${humVal}%` : '—' },
          { l: 'Outside',  v: outside?.state ? `${outside.state}°` : '—' },
        ].map(s => (
          <div key={s.l} className="text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
            <div className="digit-font text-sm text-foreground/90 mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

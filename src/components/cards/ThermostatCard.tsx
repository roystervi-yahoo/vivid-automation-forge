import { useState, useEffect, useRef } from 'react'
import { Settings, Minus, Plus, Power, Flame, Snowflake, RefreshCw, X } from 'lucide-react'
import { useHA } from '../../hooks/useHA'
import { haService } from '../../services/haService'

const ROOMS = [
  { id: 'climate.bobby',                    name: 'Bobby',       tempSensor: 'sensor.house_temperature', humidity: 'sensor.bobby_humidity' },
  { id: 'climate.saraiyh',                  name: 'Saraiyh',     tempSensor: null, humidity: null },
  { id: 'climate.jenniveen',               name: 'Jenniveen',   tempSensor: null, humidity: null },
  { id: 'climate.master',                  name: 'Master',      tempSensor: null, humidity: null },
  { id: 'climate.bobby_bath_floor',        name: 'Bath Floor',  tempSensor: null, humidity: null },
  { id: 'climate.rloor_recirculating_pump',name: 'Recirc Pump', tempSensor: null, humidity: null },
]

export function ThermostatCard() {
  const { getState, optimisticUpdate, refreshNow } = useHA()
  const [showRoomPicker, setShowRoomPicker] = useState(false)
  const [selectedRoom,   setSelectedRoom]   = useState(ROOMS[0])
  const lastTouched = useRef(0)

  const climate    = getState(selectedRoom.id)
  const tempSensor = selectedRoom.tempSensor ? getState(selectedRoom.tempSensor) : null
  const humidity   = selectedRoom.humidity   ? getState(selectedRoom.humidity)   : null
  const outside    = getState('sensor.jax_temp')

  const currentTemp = tempSensor
    ? parseFloat(tempSensor.state || '0')
    : parseFloat((climate?.attributes as any)?.current_temperature || '0')
  const setPoint = parseFloat((climate?.attributes as any)?.temperature as string || '75')
  const mode     = climate?.state || 'off'
  const humVal   = humidity?.state || '—'

  const [localTemp, setLocalTemp] = useState(setPoint)

  // Only sync from HA if user hasn't touched controls in 15s
  useEffect(() => {
    if (Date.now() - lastTouched.current > 15000) {
      setLocalTemp(setPoint)
    }
  }, [setPoint, selectedRoom.id])

  const pct = Math.min(1, Math.max(0, (localTemp - 60) / 30))

  const setTemp = async (newTemp: number) => {
    lastTouched.current = Date.now()
    setLocalTemp(newTemp)
    optimisticUpdate(selectedRoom.id, {
      attributes: { ...(climate?.attributes || {}), temperature: newTemp } as Record<string, unknown>
    })
    haService.callService('climate', 'set_temperature', {
      entity_id: selectedRoom.id, temperature: newTemp,
    }).then(() => refreshNow()).catch(console.error)
  }

  const setMode = async (newMode: string) => {
    optimisticUpdate(selectedRoom.id, { state: newMode })
    haService.callService('climate', 'set_hvac_mode', {
      entity_id: selectedRoom.id, hvac_mode: newMode,
    }).then(() => refreshNow()).catch(console.error)
  }

  return (
    <div className="glass-panel p-3 flex flex-col h-full relative">

      {/* Room Picker Overlay */}
      {showRoomPicker && (
        <div className="absolute inset-0 z-50 rounded-xl flex flex-col p-3 gap-2"
          style={{ background: 'oklch(0.10 0.04 260 / 0.97)', backdropFilter: 'blur(20px)' }}>
          <div className="flex items-center justify-between shrink-0">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--neon-cyan)]">🌡 Select Room</span>
            <button onClick={() => setShowRoomPicker(false)}
              className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition">
              <X className="h-3 w-3" />
            </button>
          </div>
          <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
            {ROOMS.map(room => {
              const s      = getState(room.id)
              const active = selectedRoom.id === room.id
              const rMode  = s?.state || 'off'
              const rTemp  = (s?.attributes as any)?.temperature || '—'
              return (
                <button key={room.id}
                  onClick={() => { setSelectedRoom(room); setShowRoomPicker(false); lastTouched.current = 0 }}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg border transition
                    ${active ? 'border-[var(--neon-cyan)]/60 bg-[var(--neon-cyan)]/10' : 'border-border/20 bg-white/3 hover:border-[var(--neon-cyan)]/30'}`}>
                  <div className="text-left">
                    <div className={`text-[11px] font-bold uppercase tracking-wide ${active ? 'text-[var(--neon-cyan)]' : 'text-foreground'}`}>{room.name}</div>
                    <div className="text-[9px] text-muted-foreground font-mono">{room.id.split('.')[1]}</div>
                  </div>
                  <div className="text-right">
                    <div className="digit-font text-[11px] text-foreground/80">{rTemp}°</div>
                    <div className={`text-[8px] uppercase font-bold
                      ${rMode === 'cool' ? 'text-[var(--neon-cyan)]'
                      : rMode === 'heat' ? 'text-[var(--neon-amber)]'
                      : 'text-muted-foreground'}`}>{rMode}</div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between">
        <button onClick={() => setShowRoomPicker(true)}
          className="h-8 w-8 rounded-lg bg-white/5 border border-border flex items-center justify-center hover:border-primary/50 transition">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">Climate Zone</div>
          <div className="text-xs font-bold tracking-wide neon-text">{selectedRoom.name.toUpperCase()}</div>
        </div>
      </div>

      {/* Dial */}
      <div className="relative flex-1 flex items-center justify-center my-2">
        <div className={`relative w-[min(10vw,176px)] h-[min(10vw,176px)] transition-opacity ${mode === 'off' ? 'opacity-40' : 'opacity-100'}`}>
          <div className="absolute inset-0 rounded-full border border-primary/20" />
          <div className="absolute inset-1 rounded-full" style={{
            background: `conic-gradient(from 220deg, var(--neon-cyan) 0deg, var(--neon-magenta) ${pct * 280}deg, oklch(0.3 0.05 260 / 0.4) ${pct * 280}deg, oklch(0.3 0.05 260 / 0.4) 280deg, transparent 280deg)`,
            mask: 'radial-gradient(circle, transparent 64%, #000 66%, #000 72%, transparent 73%)',
            WebkitMask: 'radial-gradient(circle, transparent 64%, #000 66%, #000 72%, transparent 73%)',
            filter: 'drop-shadow(0 0 10px oklch(0.82 0.16 210 / 0.5))',
          }} />
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[oklch(0.22_0.06_260)] to-[oklch(0.14_0.05_260)] flex flex-col items-center justify-center shadow-[inset_0_6px_20px_oklch(0_0_0/0.6)]">
            <div className="digit-font text-3xl font-bold text-foreground tracking-tight">
              {localTemp}<span className="text-lg align-top text-primary">°</span>
            </div>
            {mode === 'cool' ? <Snowflake className="h-3.5 w-3.5 text-[var(--neon-cyan)] mt-1" />
              : mode === 'heat' ? <Flame className="h-3.5 w-3.5 text-[var(--neon-amber)] mt-1" />
              : <Power className="h-3.5 w-3.5 text-muted-foreground mt-1" />}
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

      {/* Mode buttons */}
      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {[
          { l:'Off',  i:Power,     m:'off',  color:'' },
          { l:'Heat', i:Flame,     m:'heat', color:'text-[var(--neon-amber)]' },
          { l:'Cool', i:Snowflake, m:'cool', color:'text-[var(--neon-cyan)]' },
          { l:'Auto', i:RefreshCw, m:'auto', color:'' },
        ].map((m) => {
          const Mi     = m.i
          const active = mode === m.m
          return (
            <button key={m.l} onClick={() => setMode(m.m)}
              className={`py-2 rounded-lg flex flex-col items-center gap-0.5 border transition
                ${active ? 'bg-primary/10 border-primary/50' : 'bg-white/5 border-white/5 hover:border-primary/30'}`}>
              <Mi className={`h-3.5 w-3.5 ${m.color || (active ? 'text-primary' : 'text-muted-foreground')}`} />
              <span className="text-[8px] uppercase tracking-widest text-muted-foreground">{m.l}</span>
            </button>
          )
        })}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
        {[
          { l:'Indoor',   v: currentTemp ? `${currentTemp}°` : '—' },
          { l:'Humidity', v: humVal !== '—' ? `${humVal}%` : '—' },
          { l:'Outside',  v: outside?.state ? `${outside.state}°` : '—' },
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

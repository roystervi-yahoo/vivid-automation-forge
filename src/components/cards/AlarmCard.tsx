import { useState, useEffect, useCallback } from 'react'
import { Lock, Settings, AlertTriangle, Home, Plane, ShieldCheck } from 'lucide-react'
import { useHA } from '../../hooks/useHA'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'
const ENTITY   = 'alarm_control_panel.home_alarm'
const ARMING_DELAY = 30
const USERS = [{ id:'admin', name:'Admin', pin:'1469', isAdmin:true }]

const SENSORS = [
  { id:'binary_sensor.front_door',          name:'Front Door',        icon:'🚪' },
  { id:'binary_sensor.rear_door',           name:'Rear Door',         icon:'🚪' },
  { id:'binary_sensor.laundry_door',        name:'Laundry Door',      icon:'🚪' },
  { id:'binary_sensor.den_single_window',   name:'Den Window',        icon:'🪟' },
  { id:'binary_sensor.den_rear_windows',    name:'Den Rear Windows',  icon:'🪟' },
  { id:'binary_sensor.bathroom_window',     name:'Bathroom Window',   icon:'🪟' },
  { id:'binary_sensor.kitchen_window',      name:'Kitchen Window',    icon:'🪟' },
  { id:'binary_sensor.laundry_rear_window', name:'Laundry Rear Win',  icon:'🪟' },
  { id:'binary_sensor.laundry_side_window', name:'Laundry Side Win',  icon:'🪟' },
  { id:'binary_sensor.living_room_window',  name:'Living Room Win',   icon:'🪟' },
  { id:'binary_sensor.masterbath_window',   name:'Master Bath Win',   icon:'🪟' },
  { id:'binary_sensor.masterbed_window',    name:'Master Bed Win',    icon:'🪟' },
]

export function AlarmCard() {
  const { getState, optimisticUpdate } = useHA()
  const alarm = getState(ENTITY)

  const openSensors = SENSORS.filter(s => getState(s.id)?.state === 'on')
  const allClosed   = openSensors.length === 0
  const alarmState  = alarm?.state || 'disarmed'
  const isArmed     = alarmState.startsWith('armed')

  const [localArming,    setLocalArming]    = useState(false)
  const [countdown,      setCountdown]      = useState(ARMING_DELAY)
  const [showPinpad,     setShowPinpad]     = useState(false)
  const [pin,            setPin]            = useState('')
  const [pinError,       setPinError]       = useState(false)
  const [lastUser,       setLastUser]       = useState<string|null>(null)
  const [haError,        setHaError]        = useState<string|null>(null)
  const [autoArmPaused,  setAutoArmPaused]  = useState(false)
  const [autoArmBusy,    setAutoArmBusy]    = useState(false)

  useEffect(() => {
    const poll = async () => {
      try { const r = await fetch(`${API_BASE}/api/autoarm/status`); const d = await r.json(); setAutoArmPaused(d.paused) } catch {}
    }
    poll(); const t = setInterval(poll, 30000); return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!localArming) return
    let secs = ARMING_DELAY; setCountdown(secs)
    const id = setInterval(() => {
      secs -= 1; setCountdown(secs)
      if (secs <= 0) { clearInterval(id); setLocalArming(false); setCountdown(ARMING_DELAY) }
    }, 1000)
    return () => clearInterval(id)
  }, [localArming])

  const callHA = useCallback(async (service: string, extra: any = {}) => {
    try {
      const res = await fetch(`${API_BASE}/api/ha/services/alarm_control_panel/${service}`, {
        method:'POST',
        headers:{ 'Content-Type':'application/json' },
        body: JSON.stringify({ entity_id: ENTITY, ...extra }),
      })
      if (res.ok) { setHaError(null); optimisticUpdate(ENTITY, { state: extra.state||service }); return true }
      setHaError(`${service} (${res.status})`); return false
    } catch (e: any) { setHaError(`Network: ${e.message}`); return false }
  }, [optimisticUpdate])

  const toggleAutoArm = async () => {
    if (autoArmBusy) return
    setAutoArmBusy(true)
    try {
      if (autoArmPaused) { await fetch(`${API_BASE}/api/autoarm/resume`, { method:'POST' }); setAutoArmPaused(false) }
      else { await fetch(`${API_BASE}/api/autoarm/pause`, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify({ hours:0 }) }); setAutoArmPaused(true) }
    } catch {}
    setAutoArmBusy(false)
  }

  const press = async (service: string, newState: string) => {
    if (service === 'alarm_disarm') {
      if (localArming) { setLocalArming(false); setCountdown(ARMING_DELAY); await callHA('alarm_disarm') }
      else { setShowPinpad(true); setPinError(false); setPin('') }
      return
    }
    if (!allClosed) return
    setLocalArming(true)
    optimisticUpdate(ENTITY, { state: newState })
    await callHA(service, { code: USERS.find(u=>u.isAdmin)?.pin })
  }

  const doDisarm = async (p: string) => {
    const matched = USERS.find(u => u.pin === p)
    if (matched) {
      await callHA('alarm_disarm', { code: p })
      optimisticUpdate(ENTITY, { state:'disarmed' })
      setLocalArming(false); setLastUser(matched.name)
      setCountdown(ARMING_DELAY); setPin(''); setPinError(false); setShowPinpad(false)
    } else { setPinError(true); setPin('') }
  }

  const handleDigit = (d: string) => {
    if (pin.length >= 4) return
    const np = pin + d; setPin(np)
    if (np.length === 4) setTimeout(() => doDisarm(np), 200)
  }

  const stateColor    = isArmed ? 'text-[var(--neon-lime)]' : alarmState === 'triggered' ? 'text-red-400' : 'text-[var(--neon-cyan)]'
  const displayState  = localArming
    ? alarmState.includes('away') ? 'ARMING AWAY' : 'ARMING HOME'
    : alarmState.toUpperCase().replace(/_/g,' ')
  const circumference = 2 * Math.PI * 42

  return (
    <div className="glass-panel p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase neon-text">Security System</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={toggleAutoArm} disabled={autoArmBusy}
            className="px-2 py-0.5 rounded-md text-[9px] digit-font border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] flex items-center gap-1 hover:bg-[var(--neon-cyan)]/20 transition disabled:opacity-50">
            <Settings className="h-2.5 w-2.5" style={{animation:autoArmBusy?'spin 1s linear infinite':'none'}}/>
            {autoArmPaused ? 'PAUSED' : 'AUTO-ARM'}
          </button>
          <span className={`text-[10px] digit-font flex items-center gap-1.5 ${stateColor}`}>
            <span className={isArmed||localArming ? 'pulse-dot' : 'pulse-dot off'} />
            {displayState}
          </span>
        </div>
      </div>

      {haError && (
        <div className="mb-2 px-3 py-1 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-[9px]">
          ⚠️ {haError}
        </div>
      )}

      {/* Open sensors list */}
      {openSensors.length > 0 && !localArming && (
        <div className="mb-2 flex flex-wrap gap-1">
          {openSensors.map(s => (
            <span key={s.id} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[8px] font-bold border border-[var(--neon-amber)]/30 bg-[var(--neon-amber)]/10 text-[var(--neon-amber)]">
              {s.icon} {s.name}
            </span>
          ))}
        </div>
      )}

      <div className={`flex-1 rounded-xl border border-[var(--neon-cyan)]/30 bg-gradient-to-br from-[var(--neon-cyan)]/5 to-transparent flex flex-col items-center justify-center min-h-0 relative overflow-hidden`}>
        <div className="absolute inset-0 opacity-30" style={{ background:'radial-gradient(circle at 50% 60%, var(--neon-cyan) 0%, transparent 50%)' }} />

        {localArming && (
          <div className="flex flex-col items-center gap-2 relative z-10">
            <div className="relative w-20 h-20 flex items-center justify-center">
              <svg className="w-20 h-20" viewBox="0 0 100 100" style={{transform:'rotate(-90deg)'}}>
                <circle cx="50" cy="50" r="42" fill="none" stroke="oklch(1 0 0 / 0.08)" strokeWidth="4"/>
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="4" strokeLinecap="round"
                  stroke="var(--neon-lime)"
                  style={{strokeDasharray:circumference, strokeDashoffset:circumference*(1-(countdown/ARMING_DELAY)), transition:'stroke-dashoffset 1s linear'}}/>
              </svg>
              <span className="absolute digit-font text-2xl font-black text-[var(--neon-lime)]">{countdown}</span>
            </div>
            <div className="digit-font text-[11px] font-black uppercase tracking-wider text-[var(--neon-lime)]">
              {alarmState.includes('away') ? 'ARMING AWAY' : 'ARMING HOME'}
            </div>
            <div className="text-[8px] text-muted-foreground uppercase tracking-widest">Tap CANCEL to abort</div>
          </div>
        )}

        {!localArming && openSensors.length > 0 && (
          <>
            <AlertTriangle className="h-5 w-5 text-[var(--neon-amber)] mb-1 relative" />
            <div className="digit-font text-[11px] tracking-[0.2em] text-[var(--neon-amber)] font-bold relative">NOT READY</div>
            <div className="text-[8px] text-muted-foreground mt-1">{openSensors.length} sensor{openSensors.length!==1?'s':''} open</div>
          </>
        )}

        {!localArming && openSensors.length === 0 && (
          <>
            <ShieldCheck className="h-8 w-8 text-[var(--neon-lime)] mb-2 relative" />
            <div className="digit-font text-[11px] tracking-[0.2em] text-[var(--neon-lime)] font-bold relative">
              {isArmed ? alarmState.toUpperCase().replace(/_/g,' ') : 'SYSTEM READY'}
            </div>
            {lastUser && <div className="text-[9px] text-muted-foreground mt-1 relative">🔓 Disarmed by <strong>{lastUser}</strong></div>}
          </>
        )}

        {showPinpad && (
          <div className="absolute inset-0 z-50 rounded-xl flex flex-col p-3 gap-1.5"
            style={{background:'oklch(0.10 0.04 260 / 0.98)', backdropFilter:'blur(20px)'}}>
            <div className="flex justify-between items-center shrink-0">
              <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground digit-font">🔐 PIN</span>
              <button onClick={() => { setShowPinpad(false); setPin(''); setPinError(false) }}
                className="w-6 h-6 rounded-lg bg-white/5 border border-white/10 text-foreground text-xs flex items-center justify-center hover:bg-white/10 transition">✕</button>
            </div>
            {pinError && (
              <div className="px-2 py-1 rounded-lg border border-red-500/25 bg-red-500/10 text-red-400 text-[8px] font-bold text-center shrink-0">
                ✗ Incorrect PIN
              </div>
            )}
            <div className="flex gap-3 justify-center py-0.5 shrink-0">
              {[...Array(4)].map((_,i) => (
                <span key={i} className="w-2.5 h-2.5 rounded-full border-2 transition-all"
                  style={i < pin.length
                    ? {background:'var(--neon-lime)',borderColor:'var(--neon-lime)',boxShadow:'0 0 8px var(--neon-lime)'}
                    : {borderColor:'oklch(0.4 0.1 230 / 40%)'}}/>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-1 flex-1 min-h-0">
              {[1,2,3,4,5,6,7,8,9].map(d => (
                <button key={d} onClick={() => handleDigit(d.toString())}
                  className="rounded-lg border border-primary/20 bg-white/5 text-foreground text-base font-semibold flex items-center justify-center hover:bg-white/10 active:scale-95 transition">
                  {d}
                </button>
              ))}
              <button onClick={() => { setPin(''); setPinError(false) }}
                className="rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-[9px] font-black uppercase flex items-center justify-center">CLR</button>
              <button onClick={() => handleDigit('0')}
                className="rounded-lg border border-primary/20 bg-white/5 text-foreground text-base font-semibold flex items-center justify-center hover:bg-white/10 active:scale-95 transition">0</button>
              <button onClick={() => doDisarm(pin)}
                className="rounded-lg text-[9px] font-black uppercase flex items-center justify-center"
                style={{background:'oklch(0.86 0.2 145 / 0.2)',border:'1px solid oklch(0.86 0.2 145 / 0.4)',color:'oklch(0.86 0.2 145)'}}>OK</button>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { l:'Home',   i:Home,  service:'alarm_arm_home', state:'armed_home' },
          { l:'Away',   i:Plane, service:'alarm_arm_away', state:'armed_away' },
          { l: localArming ? 'Cancel' : 'Disarm', i:Lock, service:'alarm_disarm', state:'disarmed' },
        ].map((b) => {
          const Bi     = b.i
          const active = alarmState === b.state
          return (
            <button key={b.l} onClick={() => press(b.service, b.state)}
              className={`device-tile !p-2 flex flex-col items-center gap-1 transition ${active ? 'border-[var(--neon-cyan)]/60 bg-[var(--neon-cyan)]/10' : 'hover:border-[var(--neon-cyan)]/40'}`}>
              <Bi className={`h-3.5 w-3.5 ${active ? 'text-[var(--neon-cyan)]' : 'text-muted-foreground'}`} />
              <span className="text-[9px] digit-font tracking-widest text-foreground/80">{b.l.toUpperCase()}</span>
            </button>
          )
        })}
      </div>

      {!allClosed && alarmState === 'disarmed' && !localArming && (
        <div className="mt-2 text-[9px] text-center text-[var(--neon-amber)] digit-font">
          🔐 {openSensors.length} sensor{openSensors.length!==1?'s':''} open — close to arm
        </div>
      )}
    </div>
  )
}

import { Lock, Settings, AlertTriangle, Home, Plane, ShieldCheck } from 'lucide-react'
import { useHA } from '../../hooks/useHA'
import { haService } from '../../services/haService'

export function AlarmCard() {
  const { getState, optimisticUpdate } = useHA()
  const alarm     = getState('alarm_control_panel.home_alarm')
  const denWindow = getState('binary_sensor.den_single_window')
  const frontDoor = getState('binary_sensor.front_door')

  const alarmState = alarm?.state || 'unknown'
  const isArmed    = alarmState.startsWith('armed')

  const openSensors = [
    denWindow?.state === 'on' ? 'Den Window' : null,
    frontDoor?.state === 'on' ? 'Front Door' : null,
  ].filter(Boolean)

  const stateColor = isArmed ? 'text-[var(--neon-lime)]'
    : alarmState === 'triggered' ? 'text-red-400'
    : 'text-[var(--neon-cyan)]'

  const press = (service: string, newState: string) => {
    optimisticUpdate('alarm_control_panel.home_alarm', { state: newState })
    haService.callService('alarm_control_panel', service, {
      entity_id: 'alarm_control_panel.home_alarm',
      code: '',
    }).catch(console.error)
  }

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase neon-text">Security System</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md text-[9px] digit-font bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/40 text-[var(--neon-cyan)] flex items-center gap-1">
            <Settings className="h-2.5 w-2.5" /> AUTO-ARM
          </span>
          <span className={`text-[10px] digit-font flex items-center gap-1.5 ${stateColor}`}>
            <span className={isArmed ? 'pulse-dot' : 'pulse-dot off'} />
            {alarmState.toUpperCase().replace(/_/g,' ')}
          </span>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-[var(--neon-cyan)]/30 bg-gradient-to-br from-[var(--neon-cyan)]/5 to-transparent flex flex-col items-center justify-center min-h-0 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: 'radial-gradient(circle at 50% 60%, var(--neon-cyan) 0%, transparent 50%)' }} />
        {openSensors.length > 0 ? (
          <>
            <AlertTriangle className="h-5 w-5 text-[var(--neon-amber)] mb-1 relative" />
            <div className="digit-font text-[11px] tracking-[0.2em] text-[var(--neon-amber)] font-bold relative">NOT READY</div>
            {openSensors.map(s => (
              <button key={s} className="mt-2 px-4 py-1 rounded-md bg-black/30 border border-border text-[10px] uppercase tracking-widest text-foreground/80 hover:border-primary relative">{s}</button>
            ))}
          </>
        ) : (
          <>
            <ShieldCheck className="h-8 w-8 text-[var(--neon-lime)] mb-2 relative" />
            <div className="digit-font text-[11px] tracking-[0.2em] text-[var(--neon-lime)] font-bold relative">SYSTEM READY</div>
          </>
        )}
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[
          { l: 'Home',   i: Home,  service: 'alarm_arm_home', state: 'armed_home'  },
          { l: 'Away',   i: Plane, service: 'alarm_arm_away', state: 'armed_away'  },
          { l: 'Disarm', i: Lock,  service: 'alarm_disarm',   state: 'disarmed'    },
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
    </div>
  )
}

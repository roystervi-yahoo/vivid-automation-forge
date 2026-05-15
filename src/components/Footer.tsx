import { Lightbulb, Flame, Fan, Car, Plus } from 'lucide-react'
import { DeviceTile } from './devices/DevicesConditions'

const FOOTER_DEVICES = [
  { id: 'denone',  name: 'Den One',       status: 'off' as const, icon: Lightbulb                      },
  { id: 'wh',      name: 'Water Heater',  status: 'off' as const, icon: Flame,    accent: 'amber' as const },
  { id: 'denfan',  name: 'Den Fan',       status: 'on'  as const, icon: Fan,      accent: 'cyan'  as const },
  { id: 'lights',  name: 'Inside Lights', status: 'on'  as const, icon: Lightbulb,accent: 'amber' as const, sub: '100%' },
  { id: 'garage',  name: 'Garage Door',   status: 'off' as const, icon: Car                            },
]

export function Footer() {
  return (
    <section className="shrink-0">
      <div className="grid grid-cols-8 gap-2">
        {FOOTER_DEVICES.map(d => <DeviceTile key={d.id} d={d} />)}

        <button className="device-tile !p-2.5 flex flex-col items-center justify-center gap-1 border-dashed">
          <Plus className="h-4 w-4 text-primary" />
          <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Add Device</span>
        </button>

        <div className="glass-panel !p-2.5 flex items-center justify-around">
          <div className="text-center">
            <div className="text-[8px] text-muted-foreground tracking-widest uppercase">Devices</div>
            <div className="digit-font text-base text-primary font-bold">6</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] text-muted-foreground tracking-widest uppercase">Online</div>
            <div className="digit-font text-base text-[var(--neon-lime)] font-bold">3</div>
          </div>
          <div className="text-center">
            <div className="text-[8px] text-muted-foreground tracking-widest uppercase">System</div>
            <div className="digit-font text-base text-[var(--neon-cyan)] font-bold">OK</div>
          </div>
        </div>
      </div>
    </section>
  )
}

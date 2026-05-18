import { DevicesList }    from './DevicesList'
import { ConditionsList } from './ConditionsList'

export function DevicesConditions() {
  return (
    <section className="flex flex-col gap-2 shrink-0">
      {/* Divider */}
      <div className="h-px bg-gradient-to-r from-[var(--neon-cyan)]/60 via-primary/20 to-transparent" />
      <DevicesList />
      <ConditionsList />
    </section>
  )
}

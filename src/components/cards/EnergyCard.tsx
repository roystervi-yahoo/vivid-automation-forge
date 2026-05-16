import { useState, useMemo, useEffect } from 'react'
import { Zap, Home as HomeIcon, Activity, Maximize2, X, TrendingUp, TrendingDown, Calendar, DollarSign, Plug } from 'lucide-react'
import { useHA } from '../../hooks/useHA'

/* ============================================================================
 * ENERGY CARD — Energy Core skin (grid-only, Emporia panel monitor)
 * - Carousel skin matches the "Energy Core" reference
 * - Top-right icon opens a full-screen Energy page with stats, current readings,
 *   12-month history, and daily / weekly / monthly cost.
 * - All data + CSS live in this file (no external CSS dependency).
 * ========================================================================== */

/* ---- CONFIG -------------------------------------------------------------- */
const COST_PER_KWH = 0.17                 // $/kWh — edit to your utility rate
const CURRENCY = '$'
const HOUSE_LABEL = 'CASA'

/* Emporia entity ids — adjust to match your Home Assistant install.
 * The card degrades gracefully if any entity is missing. */
const ENT_GRID_NOW      = 'sensor.emporia_vue_power'           // W, current draw
const ENT_GRID_TODAY    = 'sensor.emporia_vue_energy_today'    // kWh today
const ENT_GRID_MONTH    = 'sensor.emporia_vue_energy_month'    // kWh this month

/* Per-zone Emporia circuits (Living, Kitchen, Bedroom, Bath, Garage, Outside) */
const ZONES: { id: string; label: string; icon: string }[] = [
  { id: 'sensor.emporia_living_room_power', label: 'LIVING',  icon: '🛋️' },
  { id: 'sensor.emporia_kitchen_power',     label: 'KITCHEN', icon: '🍳' },
  { id: 'sensor.emporia_bedroom_power',     label: 'BEDROOM', icon: '🛏️' },
  { id: 'sensor.emporia_bathroom_power',    label: 'BATH',    icon: '🚿' },
  { id: 'sensor.emporia_garage_power',      label: 'GARAGE',  icon: '🚗' },
  { id: 'sensor.emporia_outside_power',     label: 'OUTSIDE', icon: '🌳' },
]

/* ---- HELPERS ------------------------------------------------------------- */
const num = (v: unknown, d = 0) => {
  const n = parseFloat(String(v ?? ''))
  return Number.isFinite(n) ? n : d
}
const fmt = (n: number, digits = 2) => n.toFixed(digits)
const money = (n: number) => `${CURRENCY}${n.toFixed(2)}`

/* Stable pseudo-random 12-month history so the chart looks consistent.
 * Replace with a HA statistics call when you wire long-term data. */
function build12mHistory(seed = 7): { month: string; kwh: number }[] {
  const months = ['Jun','Jul','Aug','Sep','Oct','Nov','Dec','Jan','Feb','Mar','Apr','May']
  let s = seed
  const rng = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
  return months.map((m, i) => {
    // Seasonal curve: summer + winter peaks
    const seasonal = 600 + 250 * Math.cos((i / 12) * Math.PI * 2) + 200 * Math.sin((i / 12) * Math.PI * 4)
    const noise = (rng() - 0.5) * 120
    return { month: m, kwh: Math.max(180, Math.round(seasonal + noise)) }
  })
}

/* ---- CAROUSEL SKIN ------------------------------------------------------- */
export function EnergyCard() {
  const [open, setOpen] = useState(false)
  const { getState } = useHA(15000)

  const gridNowW    = num(getState(ENT_GRID_NOW)?.state)            // W
  const gridTodayKWh = num(getState(ENT_GRID_TODAY)?.state, 14.8)   // kWh
  const gridMonthKWh = num(getState(ENT_GRID_MONTH)?.state, 412)    // kWh

  const gridNowKW = gridNowW / 1000
  const zoneReadings = ZONES.map(z => ({ ...z, kw: num(getState(z.id)?.state) / 1000 }))
  const zoneTotal = zoneReadings.reduce((a, z) => a + z.kw, 0)

  return (
    <>
      <style>{ENERGY_CSS}</style>
      <div className="energy-card glass-panel relative overflow-hidden">
        {/* Header */}
        <div className="ec-header">
          <div className="ec-title">
            <span className="ec-title-main">ENERGY CORE</span>
            <span className="ec-title-sub">POWER DISTRIBUTION SYSTEM</span>
          </div>
          <div className="ec-status">
            <span className="ec-dot" />
            <span>ONLINE</span>
            <button
              className="ec-expand"
              onClick={() => setOpen(true)}
              aria-label="Open Energy dashboard"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          </div>
        </div>

        {/* Body: left stats — core — right stats */}
        <div className="ec-body">
          <div className="ec-col">
            <Stat icon={<HomeIcon className="h-3 w-3" />} label={HOUSE_LABEL}
                  value={fmt(gridMonthKWh, 0)} unit="kWh" sub="THIS MONTH" tone="cyan" />
            <Stat icon={<Plug className="h-3 w-3" />} label="GRID"
                  value={fmt(gridTodayKWh, 1)} unit="kWh" sub="TODAY" tone="cyan" />
          </div>

          <div className="ec-core">
            <div className="ec-ring r1" />
            <div className="ec-ring r2" />
            <div className="ec-ring r3" />
            <div className="ec-core-inner">
              <Zap className="ec-bolt" />
              <div className="ec-core-val">{fmt(gridNowKW, 2)}</div>
              <div className="ec-core-unit">kW NOW</div>
            </div>
            {/* connecting circuit lines */}
            <svg className="ec-lines" viewBox="0 0 200 200" preserveAspectRatio="none">
              <path d="M0,40 L70,40 L100,80" />
              <path d="M200,40 L130,40 L100,80" />
              <path d="M0,160 L70,160 L100,120" />
              <path d="M200,160 L130,160 L100,120" />
            </svg>
          </div>

          <div className="ec-col">
            <Stat icon={<Activity className="h-3 w-3" />} label="LIVE"
                  value={fmt(gridNowKW * 1000, 0)} unit="W" sub="DRAW" tone="magenta" />
            <Stat icon={<DollarSign className="h-3 w-3" />} label="COST"
                  value={money(gridTodayKWh * COST_PER_KWH).replace(CURRENCY,'')}
                  unit={CURRENCY} sub="TODAY" tone="amber" />
          </div>
        </div>

        {/* Footer: per-zone */}
        <div className="ec-zones">
          <div className="ec-zones-title">CONSUMI PER ZONA</div>
          <div className="ec-zones-grid">
            {zoneReadings.slice(0, 6).map(z => (
              <div key={z.id} className="ec-zone">
                <div className="ec-zone-icon">{z.icon}</div>
                <div className="ec-zone-label">{z.label}</div>
                <div className="ec-zone-val">{fmt(z.kw, 2)}<span>kW</span></div>
              </div>
            ))}
          </div>
          {zoneTotal > 0 && (
            <div className="ec-zones-total">Σ {fmt(zoneTotal, 2)} kW</div>
          )}
        </div>
      </div>

      {open && (
        <EnergyPage
          onClose={() => setOpen(false)}
          gridNowKW={gridNowKW}
          gridTodayKWh={gridTodayKWh}
          gridMonthKWh={gridMonthKWh}
          zones={zoneReadings}
        />
      )}
    </>
  )
}

/* ---- STAT TILE ----------------------------------------------------------- */
function Stat({ icon, label, value, unit, sub, tone }: {
  icon: React.ReactNode; label: string; value: string; unit: string; sub: string;
  tone: 'cyan' | 'magenta' | 'amber'
}) {
  return (
    <div className={`ec-stat tone-${tone}`}>
      <div className="ec-stat-head">{icon}<span>{label}</span></div>
      <div className="ec-stat-val">
        {value}<span className="ec-stat-unit">{unit}</span>
      </div>
      <div className="ec-stat-sub">{sub}</div>
    </div>
  )
}

/* ============================================================================
 * FULL-SCREEN ENERGY PAGE
 * ========================================================================== */
function EnergyPage(props: {
  onClose: () => void
  gridNowKW: number
  gridTodayKWh: number
  gridMonthKWh: number
  zones: { id: string; label: string; icon: string; kw: number }[]
}) {
  const { onClose, gridNowKW, gridTodayKWh, gridMonthKWh, zones } = props
  const history = useMemo(() => build12mHistory(11), [])

  const weeklyKWh  = gridTodayKWh * 7
  const monthlyKWh = gridMonthKWh
  const yearKWh    = history.reduce((a, m) => a + m.kwh, 0)

  const costDaily   = gridTodayKWh * COST_PER_KWH
  const costWeekly  = weeklyKWh    * COST_PER_KWH
  const costMonthly = monthlyKWh   * COST_PER_KWH
  const costYearly  = yearKWh      * COST_PER_KWH

  const maxKwh = Math.max(...history.map(m => m.kwh))

  // ESC to close
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="ep-overlay" onClick={onClose}>
      <div className="ep-modal" onClick={e => e.stopPropagation()}>
        <header className="ep-header">
          <div>
            <div className="ep-h-title">ENERGY DASHBOARD</div>
            <div className="ep-h-sub">EMPORIA VUE · GRID → HOUSE</div>
          </div>
          <button className="ep-close" onClick={onClose} aria-label="Close">
            <X className="h-4 w-4" />
          </button>
        </header>

        {/* KPI row */}
        <section className="ep-kpis">
          <Kpi icon={<Activity />} label="LIVE NOW"     value={fmt(gridNowKW, 2)}   unit="kW"  tone="cyan" />
          <Kpi icon={<Calendar />} label="TODAY"        value={fmt(gridTodayKWh,1)} unit="kWh" tone="magenta" />
          <Kpi icon={<Calendar />} label="THIS WEEK"    value={fmt(weeklyKWh, 0)}   unit="kWh" tone="violet" />
          <Kpi icon={<Calendar />} label="THIS MONTH"   value={fmt(monthlyKWh, 0)}  unit="kWh" tone="lime" />
          <Kpi icon={<TrendingUp />} label="LAST 12 MO" value={fmt(yearKWh, 0)}     unit="kWh" tone="amber" />
        </section>

        {/* Cost row */}
        <section className="ep-costs">
          <div className="ep-cost-title">
            <DollarSign className="h-3.5 w-3.5" />
            <span>COST · @ {money(COST_PER_KWH)}/kWh</span>
          </div>
          <div className="ep-cost-grid">
            <CostCard label="DAILY"   value={money(costDaily)}   trend="-2.1%" down />
            <CostCard label="WEEKLY"  value={money(costWeekly)}  trend="+4.6%" />
            <CostCard label="MONTHLY" value={money(costMonthly)} trend="+1.8%" />
            <CostCard label="YEARLY"  value={money(costYearly)}  trend="—" />
          </div>
        </section>

        {/* History chart */}
        <section className="ep-chart-section">
          <div className="ep-section-title">
            <TrendingUp className="h-3.5 w-3.5" />
            <span>12-MONTH HISTORY</span>
            <span className="ep-section-tag">kWh / MONTH</span>
          </div>
          <div className="ep-chart">
            {history.map((m, i) => {
              const h = (m.kwh / maxKwh) * 100
              return (
                <div key={i} className="ep-bar-wrap" title={`${m.month}: ${m.kwh} kWh · ${money(m.kwh * COST_PER_KWH)}`}>
                  <div className="ep-bar-val">{m.kwh}</div>
                  <div className="ep-bar" style={{ height: `${h}%` }} />
                  <div className="ep-bar-label">{m.month}</div>
                </div>
              )
            })}
          </div>
        </section>

        {/* Per-zone live */}
        <section className="ep-zones-section">
          <div className="ep-section-title">
            <Plug className="h-3.5 w-3.5" />
            <span>CIRCUIT BREAKDOWN · LIVE</span>
            <span className="ep-section-tag">EMPORIA PANEL</span>
          </div>
          <div className="ep-zones">
            {zones.map(z => {
              const pct = gridNowKW > 0 ? Math.min(100, (z.kw / gridNowKW) * 100) : 0
              return (
                <div key={z.id} className="ep-zone-row">
                  <span className="ep-zone-ic">{z.icon}</span>
                  <span className="ep-zone-lbl">{z.label}</span>
                  <div className="ep-zone-bar"><div style={{ width: `${pct}%` }} /></div>
                  <span className="ep-zone-kw">{fmt(z.kw, 2)} kW</span>
                  <span className="ep-zone-pct">{pct.toFixed(0)}%</span>
                </div>
              )
            })}
          </div>
        </section>

        <footer className="ep-footer">
          GRID-ONLY · NO BATTERY · NO SOLAR · ESC to close
        </footer>
      </div>
    </div>
  )
}

function Kpi({ icon, label, value, unit, tone }: {
  icon: React.ReactNode; label: string; value: string; unit: string;
  tone: 'cyan' | 'magenta' | 'amber' | 'lime' | 'violet'
}) {
  return (
    <div className={`ep-kpi tone-${tone}`}>
      <div className="ep-kpi-head">{icon}<span>{label}</span></div>
      <div className="ep-kpi-val">{value}<span>{unit}</span></div>
    </div>
  )
}

function CostCard({ label, value, trend, down }: { label: string; value: string; trend: string; down?: boolean }) {
  return (
    <div className="ep-cost">
      <div className="ep-cost-label">{label}</div>
      <div className="ep-cost-value">{value}</div>
      <div className={`ep-cost-trend ${down ? 'down' : trend === '—' ? 'neutral' : 'up'}`}>
        {down ? <TrendingDown className="h-3 w-3" /> : trend === '—' ? null : <TrendingUp className="h-3 w-3" />}
        <span>{trend}</span>
      </div>
    </div>
  )
}

/* ============================================================================
 * STYLES (all in this file as requested)
 * ========================================================================== */
const ENERGY_CSS = `
.energy-card {
  display: flex; flex-direction: column; height: 100%; padding: 12px 12px 10px;
  background:
    radial-gradient(120% 80% at 50% 0%, oklch(0.32 0.14 230 / 0.35), transparent 60%),
    linear-gradient(180deg, oklch(0.13 0.05 250) 0%, oklch(0.08 0.04 250) 100%);
  border: 1px solid oklch(0.55 0.18 220 / 0.35);
  box-shadow: inset 0 0 30px oklch(0.45 0.18 220 / 0.15), 0 0 24px oklch(0.55 0.18 220 / 0.2);
}
.ec-header { display: flex; align-items: flex-start; justify-content: space-between; }
.ec-title-main {
  font-weight: 800; letter-spacing: .35em; font-size: 12px;
  background: linear-gradient(90deg, var(--neon-cyan), var(--neon-magenta));
  -webkit-background-clip: text; background-clip: text; color: transparent;
  text-shadow: 0 0 12px oklch(0.7 0.2 220 / 0.4);
}
.ec-title-sub { display:block; font-size: 7px; letter-spacing: .35em; color: oklch(0.7 0.05 240 / 0.7); margin-top: 2px; }
.ec-status {
  display: flex; align-items: center; gap: 6px; font-size: 9px; letter-spacing: .25em;
  color: var(--neon-lime); font-family: var(--font-mono, ui-monospace);
}
.ec-dot { width: 6px; height: 6px; border-radius: 9999px; background: var(--neon-lime); box-shadow: 0 0 8px var(--neon-lime); animation: ec-pulse 1.5s infinite; }
@keyframes ec-pulse { 0%,100% { opacity: 1 } 50% { opacity: .35 } }
.ec-expand {
  margin-left: 6px; height: 22px; width: 22px; border-radius: 9999px;
  display: inline-flex; align-items: center; justify-content: center;
  background: oklch(0.2 0.06 250 / 0.8); border: 1px solid oklch(0.55 0.18 220 / 0.5);
  color: var(--neon-cyan); cursor: pointer; transition: all .2s;
}
.ec-expand:hover { border-color: var(--neon-cyan); box-shadow: 0 0 10px var(--neon-cyan); }

.ec-body { display: grid; grid-template-columns: 1fr 1.1fr 1fr; gap: 8px; align-items: center; margin-top: 6px; flex: 1; min-height: 0; }
.ec-col { display: flex; flex-direction: column; gap: 6px; }

.ec-stat {
  border: 1px solid oklch(0.55 0.18 220 / 0.3); border-radius: 10px; padding: 6px 8px;
  background: linear-gradient(135deg, oklch(0.18 0.06 250 / 0.6), oklch(0.1 0.04 250 / 0.6));
  position: relative; overflow: hidden;
}
.ec-stat.tone-cyan    { border-color: oklch(0.7 0.18 210 / 0.4); }
.ec-stat.tone-magenta { border-color: oklch(0.7 0.22 340 / 0.4); }
.ec-stat.tone-amber   { border-color: oklch(0.78 0.18 80 / 0.4); }
.ec-stat-head { display: flex; align-items: center; gap: 4px; font-size: 8px; letter-spacing: .25em; color: oklch(0.75 0.05 240 / 0.85); }
.ec-stat-val  { font-family: var(--font-mono, ui-monospace); font-size: 16px; font-weight: 700; color: #fff; line-height: 1.1; margin-top: 2px; }
.ec-stat-unit { font-size: 9px; font-weight: 500; color: oklch(0.7 0.1 220); margin-left: 3px; }
.ec-stat-sub  { font-size: 7px; letter-spacing: .25em; color: oklch(0.6 0.04 240); margin-top: 1px; }

.ec-core { position: relative; aspect-ratio: 1; max-height: 100%; display: flex; align-items: center; justify-content: center; }
.ec-ring { position: absolute; inset: 0; border-radius: 9999px; border: 1px solid oklch(0.6 0.18 220 / 0.3); }
.ec-ring.r1 { inset: 6%;  border-color: oklch(0.7 0.2 220 / 0.45); animation: ec-spin 16s linear infinite; }
.ec-ring.r2 { inset: 16%; border-color: oklch(0.7 0.22 340 / 0.35); border-style: dashed; animation: ec-spin 24s linear infinite reverse; }
.ec-ring.r3 { inset: 28%; border-color: oklch(0.8 0.18 180 / 0.4); }
@keyframes ec-spin { to { transform: rotate(360deg) } }
.ec-core-inner {
  position: relative; z-index: 2; width: 60%; aspect-ratio: 1; border-radius: 9999px;
  background: radial-gradient(circle at 50% 35%, oklch(0.55 0.2 220 / 0.7), oklch(0.18 0.08 250 / 0.95));
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  box-shadow: 0 0 30px oklch(0.6 0.2 220 / 0.55), inset 0 0 14px oklch(0 0 0 / 0.6);
}
.ec-bolt { width: 22px; height: 22px; color: var(--neon-cyan); filter: drop-shadow(0 0 8px var(--neon-cyan)); }
.ec-core-val { font-family: var(--font-mono, ui-monospace); font-weight: 800; font-size: 18px; color: #fff; line-height: 1; margin-top: 2px; }
.ec-core-unit { font-size: 7px; letter-spacing: .3em; color: oklch(0.75 0.1 220); margin-top: 2px; }
.ec-lines { position: absolute; inset: 0; width: 100%; height: 100%; pointer-events: none; }
.ec-lines path { fill: none; stroke: oklch(0.65 0.2 220 / 0.5); stroke-width: 1; stroke-dasharray: 3 4; animation: ec-dash 1.6s linear infinite; }
@keyframes ec-dash { to { stroke-dashoffset: -14 } }

.ec-zones { margin-top: 6px; border-top: 1px solid oklch(0.55 0.18 220 / 0.25); padding-top: 6px; }
.ec-zones-title { font-size: 8px; letter-spacing: .3em; text-align: center; color: oklch(0.7 0.05 240 / 0.7); margin-bottom: 4px; }
.ec-zones-grid { display: grid; grid-template-columns: repeat(6, 1fr); gap: 4px; }
.ec-zone {
  border: 1px solid oklch(0.55 0.18 220 / 0.2); border-radius: 8px; padding: 4px 2px;
  background: oklch(0.12 0.04 250 / 0.6); text-align: center;
}
.ec-zone-icon { font-size: 12px; line-height: 1; }
.ec-zone-label { font-size: 7px; letter-spacing: .15em; color: oklch(0.7 0.05 240 / 0.75); margin-top: 2px; }
.ec-zone-val { font-family: var(--font-mono, ui-monospace); font-size: 10px; color: #fff; }
.ec-zone-val span { font-size: 7px; color: oklch(0.65 0.1 220); margin-left: 2px; }
.ec-zones-total { text-align: right; font-size: 8px; color: var(--neon-cyan); font-family: var(--font-mono, ui-monospace); margin-top: 3px; letter-spacing: .15em; }

/* ===== Full-screen Energy Page ===== */
.ep-overlay {
  position: fixed; inset: 0; z-index: 100;
  background: oklch(0.05 0.02 250 / 0.85); backdrop-filter: blur(8px);
  display: flex; align-items: center; justify-content: center; padding: 24px;
  animation: ep-fade .2s ease-out;
}
@keyframes ep-fade { from { opacity: 0 } to { opacity: 1 } }
.ep-modal {
  width: 100%; max-width: 1200px; max-height: 95vh; overflow-y: auto;
  background:
    radial-gradient(140% 100% at 50% 0%, oklch(0.3 0.14 230 / 0.4), transparent 55%),
    linear-gradient(180deg, oklch(0.12 0.05 250) 0%, oklch(0.07 0.03 250) 100%);
  border: 1px solid oklch(0.55 0.18 220 / 0.4); border-radius: 16px;
  box-shadow: 0 0 60px oklch(0.5 0.2 220 / 0.4); padding: 22px;
  animation: ep-pop .25s cubic-bezier(.2,.9,.3,1.1);
}
@keyframes ep-pop { from { transform: scale(.96); opacity: 0 } to { transform: scale(1); opacity: 1 } }

.ep-header { display: flex; align-items: center; justify-content: space-between; padding-bottom: 14px; border-bottom: 1px solid oklch(0.55 0.18 220 / 0.25); }
.ep-h-title {
  font-weight: 800; font-size: 18px; letter-spacing: .3em;
  background: linear-gradient(90deg, var(--neon-cyan), var(--neon-magenta));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}
.ep-h-sub { font-size: 9px; letter-spacing: .35em; color: oklch(0.7 0.05 240 / 0.7); margin-top: 4px; }
.ep-close {
  height: 32px; width: 32px; border-radius: 9999px;
  background: oklch(0.18 0.06 250 / 0.8); border: 1px solid oklch(0.55 0.18 220 / 0.5);
  color: #fff; cursor: pointer; display: flex; align-items: center; justify-content: center;
  transition: all .2s;
}
.ep-close:hover { border-color: var(--neon-magenta); color: var(--neon-magenta); box-shadow: 0 0 12px var(--neon-magenta); }

.ep-kpis { display: grid; grid-template-columns: repeat(5, 1fr); gap: 10px; margin-top: 16px; }
.ep-kpi {
  border: 1px solid oklch(0.55 0.18 220 / 0.35); border-radius: 12px; padding: 12px;
  background: linear-gradient(135deg, oklch(0.18 0.07 250 / 0.7), oklch(0.1 0.04 250 / 0.7));
}
.ep-kpi.tone-cyan    { border-color: oklch(0.7 0.18 210 / 0.5); }
.ep-kpi.tone-magenta { border-color: oklch(0.7 0.22 340 / 0.5); }
.ep-kpi.tone-amber   { border-color: oklch(0.78 0.18 80 / 0.5); }
.ep-kpi.tone-lime    { border-color: oklch(0.78 0.18 130 / 0.5); }
.ep-kpi.tone-violet  { border-color: oklch(0.65 0.2 290 / 0.5); }
.ep-kpi-head { display: flex; align-items: center; gap: 6px; font-size: 9px; letter-spacing: .25em; color: oklch(0.75 0.05 240 / 0.85); }
.ep-kpi-head > :first-child { width: 12px; height: 12px; }
.ep-kpi-val  { font-family: var(--font-mono, ui-monospace); font-weight: 800; font-size: 24px; color: #fff; margin-top: 4px; line-height: 1; }
.ep-kpi-val span { font-size: 11px; font-weight: 500; color: oklch(0.7 0.1 220); margin-left: 5px; }

.ep-costs { margin-top: 18px; }
.ep-cost-title { display: flex; align-items: center; gap: 6px; font-size: 10px; letter-spacing: .3em; color: var(--neon-amber); margin-bottom: 8px; }
.ep-cost-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
.ep-cost {
  border: 1px solid oklch(0.78 0.18 80 / 0.35); border-radius: 12px; padding: 14px;
  background: linear-gradient(135deg, oklch(0.18 0.08 80 / 0.25), oklch(0.1 0.04 250 / 0.6));
}
.ep-cost-label { font-size: 9px; letter-spacing: .3em; color: oklch(0.75 0.05 240 / 0.85); }
.ep-cost-value { font-family: var(--font-mono, ui-monospace); font-weight: 800; font-size: 22px; color: var(--neon-amber); margin-top: 4px; }
.ep-cost-trend { display: inline-flex; align-items: center; gap: 4px; font-size: 10px; margin-top: 4px; font-family: var(--font-mono, ui-monospace); }
.ep-cost-trend.up      { color: oklch(0.7 0.22 25); }
.ep-cost-trend.down    { color: var(--neon-lime); }
.ep-cost-trend.neutral { color: oklch(0.6 0.04 240); }

.ep-chart-section, .ep-zones-section { margin-top: 22px; }
.ep-section-title {
  display: flex; align-items: center; gap: 6px; font-size: 10px; letter-spacing: .3em;
  color: var(--neon-cyan); margin-bottom: 10px;
}
.ep-section-tag { margin-left: auto; font-size: 8px; color: oklch(0.6 0.04 240); }
.ep-chart {
  display: grid; grid-template-columns: repeat(12, 1fr); gap: 6px; align-items: end;
  height: 200px; padding: 12px;
  border: 1px solid oklch(0.55 0.18 220 / 0.25); border-radius: 12px;
  background: oklch(0.1 0.04 250 / 0.5);
}
.ep-bar-wrap { display: flex; flex-direction: column; align-items: center; gap: 4px; height: 100%; justify-content: flex-end; }
.ep-bar-val { font-family: var(--font-mono, ui-monospace); font-size: 9px; color: oklch(0.8 0.05 240 / 0.7); }
.ep-bar {
  width: 100%; max-width: 28px;
  background: linear-gradient(180deg, var(--neon-cyan), var(--neon-magenta));
  border-radius: 4px 4px 0 0; box-shadow: 0 0 12px oklch(0.7 0.2 220 / 0.5);
  transition: all .3s;
}
.ep-bar:hover { filter: brightness(1.2); }
.ep-bar-label { font-size: 9px; letter-spacing: .15em; color: oklch(0.7 0.05 240 / 0.8); }

.ep-zones { display: flex; flex-direction: column; gap: 6px; }
.ep-zone-row {
  display: grid; grid-template-columns: 24px 80px 1fr 70px 50px; gap: 10px;
  align-items: center; padding: 8px 12px;
  border: 1px solid oklch(0.55 0.18 220 / 0.2); border-radius: 8px;
  background: oklch(0.13 0.05 250 / 0.5);
}
.ep-zone-ic { font-size: 16px; }
.ep-zone-lbl { font-size: 10px; letter-spacing: .2em; color: oklch(0.8 0.05 240 / 0.9); }
.ep-zone-bar { height: 6px; background: oklch(0.2 0.05 250); border-radius: 9999px; overflow: hidden; }
.ep-zone-bar > div {
  height: 100%; background: linear-gradient(90deg, var(--neon-cyan), var(--neon-magenta));
  border-radius: 9999px; transition: width .4s;
}
.ep-zone-kw  { font-family: var(--font-mono, ui-monospace); font-size: 11px; color: #fff; text-align: right; }
.ep-zone-pct { font-family: var(--font-mono, ui-monospace); font-size: 10px; color: var(--neon-cyan); text-align: right; }

.ep-footer { margin-top: 20px; text-align: center; font-size: 8px; letter-spacing: .35em; color: oklch(0.6 0.04 240 / 0.7); }
`

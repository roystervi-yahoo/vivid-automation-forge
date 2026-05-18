import { useState, useEffect } from 'react'

const HA_URL   = import.meta.env.VITE_HA_URL   || 'http://192.168.1.8:8123'
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN  || ''

const CIRCUITS = [
  { id:'sensor.heat_pump_power_minute_average',             label:'Heat Pump',    icon:'❤️' },
  { id:'sensor.air_handler_power_minute_average',           label:'Air Handler',  icon:'💨' },
  { id:'sensor.hot_water_tank_power_minute_average',        label:'Hot Water',    icon:'🚿' },
  { id:'sensor.stove_power_minute_average',                 label:'Stove',        icon:'🍳' },
  { id:'sensor.fridge_power_minute_average',                label:'Fridge',       icon:'🧊' },
  { id:'sensor.washer_receptacles_power_minute_average',    label:'Washer',       icon:'🧧' },
  { id:'sensor.kitchen_receptacles_power_minute_average',   label:'Kitchen',      icon:'🔌' },
  { id:'sensor.bobbys_power_minute_average',                label:"Bobby's",      icon:'🛏️' },
  { id:'sensor.masterbed_saraiyh_power_minute_average',     label:'Master/Sar',   icon:'🛏️' },
  { id:'sensor.jen_liv_rm_recp_hallw_power_minute_average', label:'Jen/Living',   icon:'🛋️' },
  { id:'sensor.den_garage_power_minute_average',            label:'Den/Garage',   icon:'🏗' },
  { id:'sensor.network_switch_power_minute_average',        label:'Network',      icon:'🌐' },
  { id:'sensor.driveway_receptacle_power_minute_average',   label:'Driveway',     icon:'🔌' },
  { id:'sensor.pump_power_minute_average',                  label:'Pump',         icon:'💧' },
]
const TOTAL_ID = 'sensor.balance_power_minute_average'

async function fetchStates(ids: string[]) {
  try {
    const results = await Promise.all(ids.map(async id => {
      const r = await fetch(`${HA_URL}/api/states/${id}`, { headers:{Authorization:`Bearer ${HA_TOKEN}`} })
      if (!r.ok) return { id, value: 0 }
      const d = await r.json()
      return { id, value: parseFloat(d.state) || 0 }
    }))
    return Object.fromEntries(results.map(r => [r.id, r]))
  } catch { return {} }
}

export default function EnergyCard() {
  const [states, setStates] = useState<any>({})
  const [angle,  setAngle]  = useState(0)

  useEffect(() => {
    const load = () => fetchStates([TOTAL_ID, ...CIRCUITS.map(c=>c.id)]).then(setStates)
    load()
    const t = setInterval(load, 10000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    let id: number
    const loop = () => { setAngle(a => a + 0.003); id = requestAnimationFrame(loop) }
    id = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(id)
  }, [])

  const total  = states[TOTAL_ID]?.value ?? 0
  const kw     = (total / 1000).toFixed(2)
  const color  = total > 5000 ? '#ff4444' : total > 2000 ? '#ffaa44' : '#00f2ff'
  const circuits = CIRCUITS.map(c => ({ ...c, w: states[c.id]?.value ?? 0 }))
  const maxW     = Math.max(...circuits.map(c=>c.w), 1)
  const top3     = [...circuits].sort((a,b)=>b.w-a.w).slice(0,3)

  const cx = 100, cy = 100, r1 = 38, r2 = 58
  const inner = circuits.slice(0, 7)
  const outer = circuits.slice(7, 14)

  const nodePos = (idx: number, count: number, r: number, offset=0) => {
    const a = (idx/count)*Math.PI*2 + angle*(r===r1?1:-0.7) + offset
    return { x: cx + r*Math.cos(a), y: cy + r*Math.sin(a) }
  }

  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden" style={{background:'radial-gradient(circle at 40% 40%, #0d1530, #05070a)'}}>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 shrink-0">
        <div className="text-[9px] uppercase tracking-widest text-muted-foreground">
          System Core <span style={{color}}>⚡ Live</span>
        </div>
        <div className="digit-font text-lg font-black" style={{color}}>
          {kw}<span className="text-[10px] text-muted-foreground/50">kW</span>
        </div>
      </div>

      {/* Orbital SVG */}
      <div className="flex-1 relative min-h-0">
        <svg viewBox="20 15 160 175" className="w-full h-full">
          <defs>
            <filter id="glow-e"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
          </defs>
          <circle cx={cx} cy={cy} r={r1} fill="none" stroke={`${color}18`} strokeWidth="1" strokeDasharray="3 4"/>
          <circle cx={cx} cy={cy} r={r2} fill="none" stroke={`${color}10`} strokeWidth="1" strokeDasharray="2 5"/>
          {inner.map((c,i) => { const p=nodePos(i,inner.length,r1); const intensity=Math.min(c.w/maxW,1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke={color} strokeWidth="0.5" opacity={0.1+intensity*0.3}/> })}
          {outer.map((c,i) => { const p=nodePos(i,outer.length,r2,0.45); const intensity=Math.min(c.w/maxW,1); return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="#00ffff" strokeWidth="0.5" opacity={0.08+intensity*0.25}/> })}
          <circle cx={cx} cy={cy} r="22" fill={`${color}22`} filter="url(#glow-e)"/>
          <circle cx={cx} cy={cy} r="16" fill={color} filter="url(#glow-e)" opacity="0.85">
            <animate attributeName="r" values="15;18;15" dur="3s" repeatCount="indefinite"/>
          </circle>
          <text x={cx} y={cy+4} textAnchor="middle" fontSize="12" style={{pointerEvents:'none'}}>🏠</text>
          {inner.map((c,i) => { const p=nodePos(i,inner.length,r1); const cl=c.w>2000?'#ff4444':c.w>800?'#ffaa44':'#44ffcc'; return <g key={i} opacity={c.w>50?1:0.4}><circle cx={p.x} cy={p.y} r="10" fill="#0a0e27" stroke={`${cl}88`} strokeWidth="1.2" filter="url(#glow-e)"/><text x={p.x} y={p.y+4} textAnchor="middle" fontSize="8" style={{pointerEvents:'none'}}>{c.icon}</text></g> })}
          {outer.map((c,i) => { const p=nodePos(i,outer.length,r2,0.45); const cl=c.w>2000?'#ff4444':c.w>800?'#ffaa44':'#44ffcc'; return <g key={i} opacity={c.w>50?1:0.4}><circle cx={p.x} cy={p.y} r="9" fill="#0a0e27" stroke={`${cl}66`} strokeWidth="1" filter="url(#glow-e)"/><text x={p.x} y={p.y+3} textAnchor="middle" fontSize="7" style={{pointerEvents:'none'}}>{c.icon}</text></g> })}
        </svg>
      </div>

      {/* Top 3 */}
      <div className="flex gap-1.5 px-3 pb-3 shrink-0">
        {top3.map((c,i) => (
          <div key={i} className="flex-1 glass-panel !p-1.5 text-center">
            <div className="text-xs">{c.icon}</div>
            <div className="digit-font text-[8px] font-bold mt-0.5" style={{color}}>
              {c.w>1000?(c.w/1000).toFixed(1)+'k':Math.round(c.w)}W
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

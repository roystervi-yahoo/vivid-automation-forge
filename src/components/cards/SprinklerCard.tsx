import { useState, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Settings, X } from 'lucide-react'
import { useHA } from '../../hooks/useHA'
import { HAEntityPicker } from '../HAEntityPicker'

const HA_URL   = import.meta.env.VITE_HA_URL   || 'http://192.168.1.8:8123'
const HA_TOKEN = import.meta.env.VITE_HA_TOKEN  || ''

// ─── Default entity config (editable via HAEntityPicker) ─────────────────────
const DEFAULT_CONFIG = {
  power:       'switch.sprinkler_power',
  mainSwitch:  'switch.sprinkler_start_sprinkler',
  autoAdvance: 'switch.sprinkler_auto_advance',
  rainDelay:   'switch.sprinkler_rain_delay',
  schedule:    'select.sprinkler_schedule',
  timeRemaining: 'sensor.sprinkler_zone_time_remaining',
  totalTime:     'sensor.sprinkler_total_time',
  zonesStatus:   'sensor.sprinkler_zones_status',
  pumpPower:     'sensor.pump_power_minute_average',
  nextWatering:  'sensor.sprinkler_next_watering_day',
  progressPct:   'sensor.sprinkler_zone_progress',
  btnStart:  'button.sprinkler_start',
  btnStop:   'button.sprinkler_stop',
  btnPause:  'button.sprinkler_pause',
  btnResume: 'button.sprinkler_resume',
  btnNext:   'button.sprinkler_next',
  btnRestart:'button.sprinkler_sys_restart',
  days: {
    sun:'switch.sprinkler_sun', mon:'switch.sprinkler_mon', tue:'switch.sprinkler_tue',
    wed:'switch.sprinkler_wed', thu:'switch.sprinkler_thur', fri:'switch.sprinkler_fri', sat:'switch.sprinkler_sat',
  },
  zones: [
    { id:1, name:'Zone 1', entity:'switch.sprinkler_zone_1', enable:'switch.sprinkler_enable_z1', timer:'number.sprinkler_set_1_timer', pct:'sensor.sprinkler_z1_percent', status:'sensor.sprinkler_zone_1_status', color:'#00ffff' },
    { id:2, name:'Zone 2', entity:'switch.sprinkler_zone_2', enable:'switch.sprinkler_enable_z2', timer:'number.sprinkler_set_2_timer', pct:'sensor.sprinkler_z2_percent', status:'sensor.sprinkler_zone_2_status', color:'#ff8800' },
    { id:3, name:'Zone 3', entity:'switch.sprinkler_zone_3', enable:'switch.sprinkler_enable_z3', timer:'number.sprinkler_set_3_timer', pct:'sensor.sprinkler_z3_percent', status:'sensor.sprinkler_zone_3_status', color:'#44ff88' },
    { id:4, name:'Zone 4', entity:'switch.sprinkler_zone_4', enable:'switch.sprinkler_enable_z4', timer:'number.sprinkler_set_4_timer', pct:'sensor.sprinkler_z4_percent', status:'sensor.sprinkler_zone_4_status', color:'#ff44ff' },
    { id:5, name:'Zone 5', entity:'switch.sprinkler_zone_5', enable:'switch.sprinkler_enable_z5', timer:'number.sprinkler_set_5_timer', pct:'sensor.sprinkler_z5_percent', status:'sensor.sprinkler_zone_5_status', color:'#ffcc44' },
  ],
}

type SprinklerConfig = typeof DEFAULT_CONFIG
const STORAGE_KEY = 'sprinkler_config_v1'

function loadConfig(): SprinklerConfig {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) return { ...DEFAULT_CONFIG, ...JSON.parse(saved) }
  } catch { /* ignore */ }
  return DEFAULT_CONFIG
}

function saveConfig(cfg: SprinklerConfig) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(cfg)) } catch { /* ignore */ }
}

// ─── HA service call ──────────────────────────────────────────────────────────
function callHA(service: string, entityId: string, domain?: string, extra: Record<string,unknown> = {}) {
  const d = domain || entityId.split('.')[0]
  fetch(`${HA_URL}/api/services/${d}/${service}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${HA_TOKEN}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ entity_id: entityId, ...extra }),
  }).catch(() => {})
}

// ─── Flow diagram ─────────────────────────────────────────────────────────────
function Flow({ displayZone, zones, size = 190 }: { displayZone: number; zones: typeof DEFAULT_CONFIG['zones']; size?: number }) {
  const cx = size / 2, cy = size / 2, r = size * 0.34
  return (
    <div style={{ position:'relative', width:size, height:size, display:'flex', alignItems:'center', justifyContent:'center' }}>
      <div style={{ position:'relative', zIndex:20, width:size*0.26, height:size*0.26, borderRadius:'50%',
        background:'rgba(5,12,30,0.95)', border:'2px solid rgba(0,200,255,0.7)',
        display:'flex', alignItems:'center', justifyContent:'center', fontSize:size*0.12,
        boxShadow:`0 0 24px ${displayZone>=0 ? zones[displayZone]?.color||'#00ffff' : '#00ffff'},0 0 8px rgba(0,200,255,0.4)`,
        transition:'box-shadow 0.5s' }}>💧</div>
      <svg style={{ position:'absolute', inset:0, width:'100%', height:'100%' }} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,200,255,0.06)" strokeWidth="1" strokeDasharray="4 4"
          style={{ animation:'sp-spin 30s linear infinite', transformOrigin:`${cx}px ${cy}px` }}/>
        {zones.map((z, i) => {
          const a = (i * (360 / zones.length) - 90) * (Math.PI / 180)
          const x2 = cx + Math.cos(a) * r, y2 = cy + Math.sin(a) * r
          const active = displayZone === i
          return (
            <g key={z.id}>
              <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={z.color}
                strokeWidth={active ? 2 : 1.5} strokeDasharray="5 3"
                style={{ opacity: active ? 1 : 0.15, transition:'opacity 0.5s',
                  ...(active ? { animation:'sp-flow 0.8s linear infinite' } : {}) }}/>
              <circle cx={x2} cy={y2} r={active ? 13 : 10}
                fill="rgba(5,12,30,0.95)" stroke={z.color} strokeWidth={active ? 2 : 1}
                style={{ filter: active ? `drop-shadow(0 0 6px ${z.color})` : 'none', transition:'all 0.5s' }}/>
              <text x={x2} y={y2+1} fontSize="7" fontWeight="900"
                fill={active ? z.color : 'rgba(150,160,180,0.6)'} textAnchor="middle" dominantBaseline="middle">Z{z.id}</text>
              {active && <circle cx={x2} cy={y2-17} r="2.5" fill={z.color}
                style={{ animation:`sp-drop 1.5s ease-in-out infinite`, animationDelay:`${i*0.3}s` }}/>}
            </g>
          )
        })}
      </svg>
    </div>
  )
}

// ─── Entity Settings Panel ────────────────────────────────────────────────────
function EntitySettings({ cfg, onSave, onClose }: { cfg: SprinklerConfig; onSave: (c: SprinklerConfig) => void; onClose: () => void }) {
  const [local, setLocal]   = useState(cfg)
  const [picker, setPicker] = useState<{ key: string; label: string } | null>(null)

  const set = (key: string, val: string) => setLocal(prev => ({ ...prev, [key]: val }))

  const FIELDS: { key: keyof SprinklerConfig; label: string }[] = [
    { key: 'power',         label: 'Power Switch'     },
    { key: 'mainSwitch',    label: 'Main Switch'      },
    { key: 'autoAdvance',   label: 'Auto Advance'     },
    { key: 'rainDelay',     label: 'Rain Delay'       },
    { key: 'schedule',      label: 'Schedule Select'  },
    { key: 'timeRemaining', label: 'Time Remaining'   },
    { key: 'totalTime',     label: 'Total Time'       },
    { key: 'zonesStatus',   label: 'Zones Status'     },
    { key: 'pumpPower',     label: 'Pump Power'       },
    { key: 'nextWatering',  label: 'Next Watering'    },
    { key: 'btnStart',      label: 'Start Button'     },
    { key: 'btnStop',       label: 'Stop Button'      },
    { key: 'btnPause',      label: 'Pause Button'     },
    { key: 'btnResume',     label: 'Resume Button'    },
    { key: 'btnNext',       label: 'Next Button'      },
  ]

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center" style={{ background:'rgba(0,0,0,0.85)', backdropFilter:'blur(8px)' }}>
      <div className="glass-panel rounded-2xl w-full max-w-lg max-h-[85vh] flex flex-col overflow-hidden">
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--neon-cyan)]">⚙️ Sprinkler Entities</span>
          <button onClick={onClose} className="h-7 w-7 rounded-lg bg-white/5 border border-border flex items-center justify-center hover:border-primary/60 transition text-muted-foreground text-sm">✕</button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
          {FIELDS.map(f => (
            <div key={f.key} className="flex items-center gap-3">
              <span className="text-[10px] text-muted-foreground w-32 shrink-0">{f.label}</span>
              <button onClick={() => setPicker({ key: f.key, label: f.label })}
                className="flex-1 text-left px-3 py-1.5 rounded-lg bg-white/5 border border-border hover:border-primary/40 transition text-[10px] digit-font text-[var(--neon-cyan)] truncate">
                {(local[f.key] as string) || 'Click to pick…'}
              </button>
            </div>
          ))}
          <div className="mt-2 text-[9px] text-muted-foreground uppercase tracking-widest">Zone Entities</div>
          {local.zones.map((z, zi) => (
            <div key={z.id} className="flex items-center gap-3">
              <span className="text-[10px] w-32 shrink-0" style={{ color: z.color }}>{z.name}</span>
              <button onClick={() => setPicker({ key: `zone_${zi}_entity`, label: `${z.name} Switch` })}
                className="flex-1 text-left px-3 py-1.5 rounded-lg bg-white/5 border border-border hover:border-primary/40 transition text-[10px] digit-font text-[var(--neon-cyan)] truncate">
                {z.entity}
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2 px-4 py-3 border-t border-border/40 shrink-0">
          <button onClick={() => { saveConfig(local); onSave(local); onClose() }}
            className="flex-1 py-2 rounded-lg bg-[var(--neon-cyan)]/15 border border-[var(--neon-cyan)]/40 text-[var(--neon-cyan)] text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--neon-cyan)]/25 transition">
            Save
          </button>
          <button onClick={onClose}
            className="px-4 py-2 rounded-lg bg-white/5 border border-border text-muted-foreground text-[10px] font-bold uppercase tracking-wider hover:border-primary/30 transition">
            Cancel
          </button>
        </div>
      </div>

      {picker && (
        <HAEntityPicker
          currentEntityId={picker.key.startsWith('zone_')
            ? local.zones[parseInt(picker.key.split('_')[1])].entity
            : (local[picker.key as keyof SprinklerConfig] as string)}
          onSelect={(entityId) => {
            if (picker.key.startsWith('zone_')) {
              const zi = parseInt(picker.key.split('_')[1])
              const zones = [...local.zones]
              zones[zi] = { ...zones[zi], entity: entityId }
              setLocal(prev => ({ ...prev, zones }))
            } else {
              set(picker.key, entityId)
            }
            setPicker(null)
          }}
          onClose={() => setPicker(null)}
        />
      )}
    </div>,
    document.body
  )
}

// ─── Main SprinklerCard ───────────────────────────────────────────────────────
export default function SprinklerCard() {
  const { getState } = useHA()
  const [cfg,      setCfg]      = useState<SprinklerConfig>(loadConfig)
  const [showFull, setShowFull] = useState(false)
  const [showCfg,  setShowCfg]  = useState(false)
  const [cycleZone, setCycleZone] = useState(0)
  const [opts,     setOpts]     = useState<Record<string,boolean>>({})

  const get = useCallback((id: string) => {
    if (opts[id] !== undefined) return opts[id]
    return getState(id)?.state === 'on'
  }, [opts, getState])

  const tog = useCallback((id: string) => {
    const cur = get(id)
    setOpts(p => ({ ...p, [id]: !cur }))
    callHA(!cur ? 'turn_on' : 'turn_off', id)
  }, [get])

  const pressBtn = (id: string) => callHA('press', id, 'button')

  const isOn       = get(cfg.power)
  const isWatering = get(cfg.mainSwitch) || cfg.zones.some(z => get(z.entity))
  const pumpPower  = parseFloat(getState(cfg.pumpPower)?.state || '0')
  const pumpRunning = pumpPower > 0
  const zoneTimeLeft = getState(cfg.timeRemaining)?.state || '--'
  const totalTime    = getState(cfg.totalTime)?.state || '--'
  const nextWatering = getState(cfg.nextWatering)?.state || '--'

  const runningZoneIdx = cfg.zones.findIndex(z => {
    const s  = getState(z.entity)?.state
    const st = getState(z.status)?.state
    return s === 'on' || (st && st !== 'Stop' && st !== 'N/A')
  })

  useEffect(() => {
    if (runningZoneIdx >= 0) { setCycleZone(runningZoneIdx); return }
    if (!isOn) { setCycleZone(-1); return }
    const t = setInterval(() => setCycleZone(p => (p + 1) % cfg.zones.length), 2000)
    return () => clearInterval(t)
  }, [runningZoneIdx, isOn, cfg.zones.length])

  const displayZone = runningZoneIdx >= 0 ? runningZoneIdx : cycleZone
  const sColor = !isOn ? '#ff4444' : isWatering ? '#44ff88' : '#3b82f6'
  const sLabel = !isOn ? 'STANDBY' : isWatering ? 'WATERING' : 'IDLE'
  const sBg    = !isOn ? 'rgba(255,68,68,0.1)' : isWatering ? 'rgba(68,255,136,0.1)' : 'rgba(59,130,246,0.1)'
  const sBdr   = !isOn ? 'rgba(255,68,68,0.3)' : isWatering ? 'rgba(68,255,136,0.35)' : 'rgba(59,130,246,0.3)'

  return (
    <>
      <style>{`
        @keyframes sp-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:0.5;transform:scale(1.15)}}
        @keyframes sp-flow{from{stroke-dashoffset:40}to{stroke-dashoffset:0}}
        @keyframes sp-drop{0%{transform:translateY(-6px);opacity:0}50%{opacity:1}100%{transform:translateY(6px);opacity:0}}
        @keyframes sp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        .sp-stat{display:flex;flex-direction:column;align-items:center;justify-content:center;padding:8px 6px;border-radius:99px;min-height:52px;background:linear-gradient(160deg,rgba(0,30,60,0.8),rgba(0,20,50,0.8));border:1px solid rgba(0,200,255,0.18);box-shadow:0 4px 14px rgba(0,0,0,0.5),inset 0 1px 0 rgba(255,255,255,0.06);cursor:default;transition:all 0.2s;}
        .sp-stat.cp{cursor:pointer;}
        .sp-stat.cp:hover{border-color:rgba(0,200,255,0.5);transform:translateY(-2px);}
        .sp-slabel{font-size:7px;color:rgba(255,255,255,0.35);text-transform:uppercase;letter-spacing:0.15em;font-weight:900;font-family:'Orbitron','Courier New',monospace;}
        .sp-sval{font-size:11px;font-weight:900;font-family:'Orbitron','Courier New',monospace;letter-spacing:0.05em;line-height:1.2;}
      `}</style>

      {/* ── Card shell — glass-panel gives the border ── */}
      <div className="glass-panel p-0 flex flex-col h-full overflow-hidden relative" style={{ color:'#fff', fontFamily:"'Inter',system-ui,sans-serif" }}>

        {/* Ambient glow */}
        <div style={{ position:'absolute', top:'50%', left:'50%', transform:'translate(-50%,-50%)', width:220, height:220,
          borderRadius:'50%', background:'radial-gradient(circle,rgba(0,200,255,0.07),transparent 70%)',
          filter:'blur(40px)', pointerEvents:'none', zIndex:0 }}/>

        {/* Header */}
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center',
          padding:'12px 14px 8px', flexShrink:0, position:'relative', zIndex:2 }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div onClick={() => setShowFull(true)}
              style={{ width:30, height:30, borderRadius:10, cursor:'pointer',
                background:'rgba(0,200,255,0.1)', border:'1px solid rgba(0,200,255,0.3)',
                display:'flex', alignItems:'center', justifyContent:'center', fontSize:15 }}>💧</div>
            <div>
              <div style={{ fontSize:11, fontWeight:700, letterSpacing:'0.15em', textTransform:'uppercase', color:'rgba(0,200,255,0.9)' }}>Hydration</div>
              <div style={{ fontSize:8, letterSpacing:'0.2em', textTransform:'uppercase', color:'rgba(255,255,255,0.3)', marginTop:1 }}>Sprinkler System</div>
            </div>
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:6 }}>
            <div style={{ display:'flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:99,
              background:sBg, border:`1px solid ${sBdr}`, color:sColor,
              fontSize:9, fontWeight:900, letterSpacing:'0.12em', textTransform:'uppercase',
              fontFamily:"'Orbitron','Courier New',monospace" }}>
              <span style={{ width:6, height:6, borderRadius:'50%', background:sColor,
                boxShadow:`0 0 6px ${sColor}`, animation:isOn?'sp-pulse 1.5s ease-in-out infinite':'none' }}/>
              {sLabel}
            </div>
            <button onClick={() => setShowCfg(true)}
              className="h-7 w-7 rounded-lg bg-white/5 border border-border flex items-center justify-center hover:border-[var(--neon-cyan)]/50 transition text-muted-foreground">
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Flow diagram */}
        <div style={{ flex:1, minHeight:0, position:'relative', display:'flex', alignItems:'center', justifyContent:'center', zIndex:1 }}>
          <Flow displayZone={displayZone} zones={cfg.zones} size={210} />
          <div style={{ position:'absolute', bottom:8, left:'50%', transform:'translateX(-50%)', textAlign:'center', pointerEvents:'none' }}>
            <div style={{ fontSize:14, fontWeight:900 }}>
              {!isOn ? 'Standby' : isWatering ? `Zone ${runningZoneIdx >= 0 ? runningZoneIdx + 1 : '?'} Watering` : 'Idle — Ready'}
            </div>
            <div style={{ fontSize:7, color:'rgba(0,200,255,0.4)', textTransform:'uppercase', letterSpacing:'0.1em', marginTop:2 }}>
              {zoneTimeLeft !== '--' ? `Time Left: ${zoneTimeLeft}` : nextWatering !== '--' ? nextWatering : ''}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div style={{ flexShrink:0, padding:'6px 10px 10px', borderTop:'1px solid rgba(0,200,255,0.1)', display:'flex', flexDirection:'column', gap:5, zIndex:1, position:'relative' }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
            <div className="sp-stat cp" onClick={() => pressBtn(pumpRunning ? cfg.btnStop : cfg.btnStart)}>
              <span className="sp-slabel">Start/Stop</span>
              <span className="sp-sval" style={{ color:pumpRunning ? '#ff4444' : '#44ff88' }}>{pumpRunning ? 'STOP' : 'START'}</span>
            </div>
            <div className="sp-stat">
              <span className="sp-slabel">Zone Left</span>
              <span className="sp-sval" style={{ color:pumpRunning ? '#ffaa44' : 'rgba(255,255,255,0.3)' }}>{zoneTimeLeft}</span>
            </div>
            <div className="sp-stat">
              <span className="sp-slabel">Total</span>
              <span className="sp-sval" style={{ color:'#3b82f6' }}>{totalTime !== '--' ? `${totalTime}s` : '--'}</span>
            </div>
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:6 }}>
            <div className="sp-stat">
              <span className="sp-slabel">Pump</span>
              <span className="sp-sval" style={{ color:pumpRunning ? '#44ff88' : 'rgba(255,255,255,0.3)' }}>{pumpRunning ? `${pumpPower.toFixed(0)}W` : 'Idle'}</span>
            </div>
            <div className="sp-stat">
              <span className="sp-slabel">Zones</span>
              <span className="sp-sval" style={{ color:'#3b82f6' }}>{getState(cfg.zonesStatus)?.state || '--'}</span>
            </div>
            <div className="sp-stat cp" onClick={() => tog(cfg.power)}>
              <span className="sp-slabel">Power</span>
              <span className="sp-sval" style={{ color:sColor }}>{sLabel}</span>
            </div>
          </div>
        </div>

        {/* Full popup */}
        {showFull && createPortal(
          <SprinklerPopup
            onClose={() => setShowFull(false)}
            cfg={cfg} get={get} tog={tog} pressBtn={pressBtn} getState={getState}
            isOn={isOn} isWatering={isWatering} pumpRunning={pumpRunning} pumpPower={pumpPower}
            runningZoneIdx={runningZoneIdx} zoneTimeLeft={zoneTimeLeft}
            totalTime={totalTime} nextWatering={nextWatering} displayZone={displayZone}
          />,
          document.body
        )}

        {/* Entity settings */}
        {showCfg && (
          <EntitySettings cfg={cfg} onSave={c => { setCfg(c); saveConfig(c) }} onClose={() => setShowCfg(false)} />
        )}
      </div>
    </>
  )
}

// ─── Full popup (unchanged layout, just uses cfg + useHA) ────────────────────
function SprinklerPopup({ onClose, cfg, get, tog, pressBtn, getState, isOn, isWatering, pumpRunning, pumpPower, runningZoneIdx, zoneTimeLeft, totalTime, nextWatering, displayZone }: any) {
  const [tab,  setTab]  = useState('dashboard')
  const [time, setTime] = useState(new Date())

  const on  = (id: string) => { tog(id); /* ensure on */ callHA('turn_on',  id) }
  const off = (id: string) => { tog(id); /* ensure off */ callHA('turn_off', id) }

  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])

  const schedule = getState(cfg.schedule)?.state || '--'
  const DAYS     = ['sun','mon','tue','wed','thu','fri','sat'] as const
  const DAY_LABELS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat']
  const C = { cyan:'#00ffff', green:'#44ff88', amber:'#ffaa44', red:'#ff4444', violet:'#aa44ff', blue:'#3b82f6' }

  return (
    <div style={{ position:'fixed', inset:0, zIndex:99999, background:'linear-gradient(135deg,rgba(5,10,25,0.99),rgba(10,18,48,0.99))', display:'flex', flexDirection:'column', fontFamily:"'Courier New',monospace", color:'#fff' }}>
      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'12px 24px', borderBottom:'1px solid rgba(0,200,255,0.15)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ padding:10, background:'linear-gradient(135deg,#00ffff,#3b82f6)', borderRadius:14, fontSize:22 }}>💧</div>
          <div>
            <div style={{ fontSize:18, fontWeight:900, letterSpacing:'0.15em', textTransform:'uppercase' }}>CYBER-HYDRATE <span style={{ color:'rgba(0,200,255,0.8)', fontWeight:400 }}>PRO</span></div>
            <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', letterSpacing:'0.2em', textTransform:'uppercase' }}>Intelligent Irrigation OS</div>
          </div>
        </div>
        <div style={{ display:'flex', gap:4, background:'rgba(255,255,255,0.04)', padding:4, borderRadius:12, border:'1px solid rgba(255,255,255,0.08)' }}>
          {['dashboard','schedule','controls'].map(t => (
            <button key={t} onClick={() => setTab(t)} style={{ padding:'6px 16px', borderRadius:8, border:'none', cursor:'pointer', fontSize:10, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', background:tab===t?'rgba(255,255,255,0.1)':'transparent', color:tab===t?'#fff':'rgba(255,255,255,0.4)', transition:'all 0.2s', fontFamily:'inherit' }}>{t}</button>
          ))}
        </div>
        <div style={{ display:'flex', alignItems:'center', gap:14 }}>
          <div style={{ textAlign:'right' }}>
            <div style={{ fontSize:18, fontWeight:900 }}>{time.toLocaleTimeString([],{hour:'2-digit',minute:'2-digit',second:'2-digit'})}</div>
            <div style={{ fontSize:9, color:C.cyan, textTransform:'uppercase', letterSpacing:'0.1em' }}>{time.toLocaleDateString([],{weekday:'long',month:'short',day:'numeric'})}</div>
          </div>
          <button onClick={onClose} style={{ width:36, height:36, borderRadius:10, cursor:'pointer', background:'rgba(255,255,255,0.05)', border:'1px solid rgba(255,255,255,0.12)', color:'#fff', fontSize:16, display:'flex', alignItems:'center', justifyContent:'center' }}>✕</button>
        </div>
      </div>

      <div style={{ flex:1, overflow:'auto', padding:'16px 24px' }}>

        {tab === 'dashboard' && (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {/* Day pills */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:8 }}>
              {DAYS.map((d, i) => {
                const dn = get(cfg.days[d])
                return <div key={d} onClick={() => tog(cfg.days[d])}
                  style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 4px', borderRadius:12, cursor:'pointer', fontWeight:900, fontSize:12, textTransform:'uppercase', transition:'all 0.15s', border:'2px solid', color:'#fff',
                    background:dn?'rgba(34,197,94,0.85)':'rgba(220,50,50,0.75)', borderColor:dn?'rgba(34,197,94,0.9)':'rgba(220,50,50,0.6)' }}>{DAY_LABELS[i]}</div>
              })}
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'260px 1fr', gap:12 }}>
              {/* Controls */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:12 }}>
                    <div style={{ fontSize:12, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em' }}>Power</div>
                    <div onClick={() => tog(cfg.power)} style={{ width:40, height:22, borderRadius:11, padding:2, cursor:'pointer', transition:'background 0.15s', background:isOn?C.cyan:'rgba(255,255,255,0.1)', position:'relative' }}>
                      <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:isOn?21:3, transition:'left 0.15s' }}/>
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexWrap:'wrap' }}>
                    {[{l:'▶ Start',b:cfg.btnStart,c:C.green},{l:'⏹ Stop',b:cfg.btnStop,c:C.red},{l:'⏸ Pause',b:cfg.btnPause,c:C.amber},{l:'▶ Resume',b:cfg.btnResume,c:C.cyan},{l:'⏭ Next',b:cfg.btnNext,c:C.violet}].map(x => (
                      <button key={x.b} onClick={() => pressBtn(x.b)} style={{ flex:1, minWidth:50, padding:'8px 4px', borderRadius:8, cursor:'pointer', fontSize:9, fontWeight:900, background:`${x.c}22`, color:x.c, border:`1px solid ${x.c}44`, fontFamily:'inherit' }}>{x.l}</button>
                    ))}
                  </div>
                </div>
                <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16 }}>
                  {[{l:'⚡ Auto Advance',id:cfg.autoAdvance,c:C.cyan},{l:'🌧️ Rain Delay',id:cfg.rainDelay,c:C.amber}].map((item, i) => (
                    <div key={item.id}>
                      {i > 0 && <div style={{ height:1, background:'rgba(255,255,255,0.05)', margin:'8px 0' }}/>}
                      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                        <div style={{ fontSize:11, fontWeight:700, color:get(item.id)?item.c:'rgba(255,255,255,0.5)' }}>{item.l}</div>
                        <div onClick={() => tog(item.id)} style={{ width:40, height:22, borderRadius:11, padding:2, cursor:'pointer', transition:'background 0.15s', background:get(item.id)?item.c:'rgba(255,255,255,0.1)', position:'relative' }}>
                          <div style={{ width:16, height:16, borderRadius:'50%', background:'#fff', position:'absolute', top:3, left:get(item.id)?21:3, transition:'left 0.15s' }}/>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {/* Flow + zones */}
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16, display:'flex', justifyContent:'center', alignItems:'center', minHeight:200, position:'relative' }}>
                  <Flow displayZone={displayZone} zones={cfg.zones} size={280} />
                  <div style={{ position:'absolute', bottom:12, left:'50%', transform:'translateX(-50%)', textAlign:'center', pointerEvents:'none' }}>
                    <div style={{ fontSize:12, fontWeight:900 }}>{runningZoneIdx>=0?`Zone ${runningZoneIdx+1} Running`:pumpRunning?'Pump Active':isOn?'Idle':'Standby'}</div>
                    {nextWatering !== '--' && <div style={{ fontSize:8, color:C.blue, marginTop:2 }}>{nextWatering}</div>}
                  </div>
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'repeat(5,1fr)', gap:8 }}>
                  {cfg.zones.map((z: any) => {
                    const zOn = get(z.entity)
                    const zSt = getState(z.status)?.state || 'Stop'
                    const timer = getState(z.timer)?.state || '--'
                    const zPct  = getState(z.pct)?.state || ''
                    const run   = zOn || (zSt && zSt !== 'Stop' && zSt !== 'N/A')
                    return (
                      <div key={z.id} onClick={() => tog(z.entity)}
                        style={{ borderRadius:12, padding:12, textAlign:'center', cursor:'pointer', transition:'all 0.15s',
                          border:`2px solid ${run?z.color:'rgba(255,255,255,0.08)'}`,
                          background:run?`${z.color}22`:'rgba(255,255,255,0.04)',
                          boxShadow:run?`0 0 16px ${z.color}44`:'none', transform:run?'scale(1.03)':'scale(1)' }}>
                        <div style={{ fontSize:20, marginBottom:4 }}>{run?'💦':'💧'}</div>
                        <div style={{ fontSize:11, fontWeight:900, color:run?z.color:'#fff' }}>{z.name}</div>
                        <div style={{ fontSize:8, color:'rgba(255,255,255,0.3)', marginTop:2 }}>{timer} min</div>
                        {zPct && <div style={{ fontSize:8, color:z.color, marginTop:1 }}>{zPct}</div>}
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === 'schedule' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16 }}>
              <div style={{ fontSize:12, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>📅 Watering Days</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(7,1fr)', gap:6, marginBottom:12 }}>
                {DAYS.map((d, i) => {
                  const dn = get(cfg.days[d])
                  return <div key={d} onClick={() => tog(cfg.days[d])}
                    style={{ display:'flex', alignItems:'center', justifyContent:'center', padding:'10px 4px', borderRadius:12, cursor:'pointer', fontWeight:900, fontSize:12, textTransform:'uppercase', border:'2px solid', color:'#fff',
                      background:dn?'rgba(34,197,94,0.85)':'rgba(220,50,50,0.75)', borderColor:dn?'rgba(34,197,94,0.9)':'rgba(220,50,50,0.6)' }}>{DAY_LABELS[i]}</div>
                })}
              </div>
              <div style={{ background:'rgba(0,0,0,0.2)', padding:12, borderRadius:10, textAlign:'center' }}>
                <div style={{ fontSize:9, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:4 }}>Start Time</div>
                <div style={{ fontSize:28, fontWeight:900, color:C.cyan, fontFamily:'Courier New' }}>{schedule}</div>
              </div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16 }}>
              <div style={{ fontSize:12, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>⏱️ Zone Run Times</div>
              {cfg.zones.map((z: any) => {
                const dur = parseFloat(getState(z.timer)?.state || '25')
                return (
                  <div key={z.id} style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 10px', borderRadius:8, marginBottom:6, background:'rgba(0,0,0,0.2)', border:`1px solid ${z.color}22` }}>
                    <span style={{ fontSize:11, color:'rgba(255,255,255,0.7)', fontWeight:700 }}>{z.name}</span>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      {['-','+'].map(op => (
                        <button key={op} onClick={() => callHA('set_value', z.timer, 'number', { value: op==='-' ? Math.max(1, dur-1) : Math.min(60, dur+1) })}
                          style={{ width:24, height:24, borderRadius:6, border:`1px solid ${z.color}44`, background:`${z.color}18`, color:z.color, cursor:'pointer', fontSize:14, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:900 }}>{op}</button>
                      ))}
                      <span style={{ fontSize:14, fontWeight:900, color:z.color, fontFamily:'Courier New', minWidth:32, textAlign:'center' }}>{dur}</span>
                      <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)' }}>min</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {tab === 'controls' && (
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16 }}>
              <div style={{ fontSize:12, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>🖥️ System Controls</div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                {[
                  {l:'▶ Start Full Cycle', b:cfg.btnStart,   c:C.green,  d:'Run all zones'},
                  {l:'⏹ Stop All',         b:cfg.btnStop,    c:C.red,    d:'Stop immediately'},
                  {l:'⏸ Pause',            b:cfg.btnPause,   c:C.amber,  d:'Pause current zone'},
                  {l:'▶ Resume',           b:cfg.btnResume,  c:C.cyan,   d:'Resume from pause'},
                  {l:'⏭ Next Zone',        b:cfg.btnNext,    c:C.violet, d:'Skip to next zone'},
                  {l:'🔄 Restart ESP',     b:cfg.btnRestart, c:C.red,    d:'Reboot controller'},
                ].map(x => (
                  <button key={x.b} onClick={() => pressBtn(x.b)}
                    style={{ padding:12, borderRadius:12, cursor:'pointer', fontSize:10, fontWeight:900, display:'flex', flexDirection:'column', gap:4, textAlign:'left', transition:'all 0.15s', fontFamily:'inherit', border:`1px solid ${x.c}44`, background:`${x.c}18`, color:x.c }}>
                    <span>{x.l}</span><span style={{ fontSize:8, color:'rgba(255,255,255,0.3)', fontWeight:400 }}>{x.d}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ background:'rgba(255,255,255,0.04)', border:'1px solid rgba(255,255,255,0.08)', borderRadius:16, padding:16 }}>
              <div style={{ fontSize:12, fontWeight:900, textTransform:'uppercase', letterSpacing:'0.1em', marginBottom:12 }}>💧 Manual Zone Control</div>
              {cfg.zones.map((z: any) => {
                const zOn = get(z.entity)
                return (
                  <div key={z.id}
                    style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'10px 14px', borderRadius:12, marginBottom:6,
                      background:zOn?`${z.color}18`:'rgba(255,255,255,0.04)', border:`2px solid ${zOn?z.color:'rgba(255,255,255,0.08)'}`,
                      boxShadow:zOn?`0 0 14px ${z.color}33`:'none', transition:'all 0.15s' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <div style={{ width:10, height:10, borderRadius:'50%', background:zOn?z.color:'rgba(255,255,255,0.1)', boxShadow:zOn?`0 0 8px ${z.color}`:'none' }}/>
                      <span style={{ fontSize:12, fontWeight:900, color:zOn?z.color:'rgba(255,255,255,0.7)' }}>{z.name}</span>
                    </div>
                    <div style={{ display:'flex', gap:6 }}>
                      {['ON','OFF'].map(a => (
                        <button key={a} onClick={() => a==='ON' ? on(z.entity) : off(z.entity)}
                          style={{ padding:'6px 12px', borderRadius:8, cursor:'pointer', fontSize:10, fontWeight:900, fontFamily:'inherit',
                            border:`1px solid ${a==='ON'?`${z.color}44`:'rgba(255,68,68,0.4)'}`,
                            background:`${a==='ON'?z.color:'#ff4444'}18`, color:a==='ON'?z.color:'#ff6666' }}>{a}</button>
                      ))}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'8px 24px', background:'rgba(0,0,0,0.4)', borderTop:'1px solid rgba(255,255,255,0.04)', flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:6 }}>
          <div style={{ width:6, height:6, borderRadius:'50%', background:isOn?C.green:C.red, animation:isOn?'sp-pulse 1s infinite':'none' }}/>
          <span style={{ fontSize:9, color:'rgba(255,255,255,0.3)', textTransform:'uppercase', letterSpacing:'0.1em' }}>{!isOn?'STANDBY':isWatering?'WATERING — ACTIVE':'IDLE — READY'}</span>
        </div>
        <button onClick={() => tog(cfg.power)}
          style={{ padding:'5px 16px', borderRadius:8, cursor:'pointer', fontSize:9, fontWeight:900, letterSpacing:'0.1em', fontFamily:'inherit', border:'none', background:isOn?'rgba(255,68,68,0.15)':'rgba(68,255,136,0.15)', color:isOn?C.red:C.green }}>
          {isOn ? '→ STANDBY' : '→ IDLE'}
        </button>
      </div>
    </div>
  )
}
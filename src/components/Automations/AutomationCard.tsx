import { Automation, sumTrigger, sumAction } from './automationsEngine'

interface Props {
  auto: Automation
  onToggle: () => void
  onEdit:   () => void
  onDelete: () => void
  onRunNow: () => void
  runStatus?: string
}

export function AutomationCard({ auto, onToggle, onEdit, onDelete, onRunNow, runStatus }: Props) {
  const C = auto.enabled
    ? { bg:'rgba(255,238,68,.06)', border:'rgba(255,238,68,.2)', badge:'rgba(255,238,68,.15)', text:'#ffee44' }
    : { bg:'rgba(150,150,150,.04)', border:'rgba(150,150,150,.12)', badge:'rgba(150,150,150,.08)', text:'#666' }

  return (
    <div className="relative" style={{ background:C.bg, border:`2px solid ${C.border}`, borderRadius:14, padding:14, display:'flex', flexDirection:'column', gap:10, opacity:auto.enabled?1:0.65, transition:'all .2s' }}>
      {runStatus && (
        <div className="absolute inset-0 rounded-xl flex items-center justify-center z-10" style={{ background:'rgba(68,255,136,.1)', border:'2px solid rgba(68,255,136,.4)' }}>
          <span className="text-[10px] font-bold" style={{ color:'#44ff88' }}>{runStatus==='running'?'⚡ Running…':'✓ Done'}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'2px 8px', borderRadius:20, background:C.badge, border:`1px solid ${C.border}`, marginBottom:6 }}>
            <span style={{ fontSize:9 }}>💡</span>
            <span style={{ fontSize:9, fontWeight:900, color:C.text, textTransform:'uppercase', letterSpacing:1 }}>Outside Lights</span>
          </div>
          <div className="text-[13px] font-black truncate" style={{ color:auto.enabled?'#fff':'#888' }}>{auto.name||'Unnamed'}</div>
        </div>
        {/* ON/OFF pill */}
        <div onClick={onToggle} style={{ display:'flex', alignItems:'center', gap:5, cursor:'pointer', flexShrink:0, padding:'3px 10px', borderRadius:20,
          background:auto.enabled?'rgba(68,255,136,.15)':'rgba(255,100,100,.1)',
          border:`1px solid ${auto.enabled?'rgba(68,255,136,.4)':'rgba(255,100,100,.3)'}`}}>
          <div style={{ width:7, height:7, borderRadius:'50%', background:auto.enabled?'#44ff88':'#ff6666', boxShadow:auto.enabled?'0 0 5px #44ff88':'none' }}/>
          <span style={{ fontSize:10, fontWeight:900, color:auto.enabled?'#44ff88':'#ff6666' }}>{auto.enabled?'ON':'OFF'}</span>
        </div>
      </div>

      {/* IF / AND / DO — V7 layout */}
      <div style={{ padding:'8px 10px', borderRadius:8, background:'rgba(0,0,0,.2)', border:'1px solid rgba(255,255,255,.05)', display:'flex', flexDirection:'column', gap:6 }}>
        <div className="flex gap-2">
          <span style={{ fontSize:9, fontWeight:900, color:'rgba(0,200,255,.4)', textTransform:'uppercase', minWidth:26, paddingTop:1 }}>IF</span>
          <div className="flex-1">
            {( auto.triggers||[]).length===0
              ? <span style={{ color:'#444', fontSize:11 }}>No trigger</span>
              : (auto.triggers||[]).map((t,i)=><div key={i} style={{ fontSize:11, color:'#ccc', lineHeight:1.5 }}>⚡ {sumTrigger(t)}</div>)}
          </div>
        </div>
        {(auto.conditions||[]).length>0&&(
          <div className="flex gap-2">
            <span style={{ fontSize:9, fontWeight:900, color:'rgba(255,170,68,.4)', textTransform:'uppercase', minWidth:26, paddingTop:1 }}>AND</span>
            <div className="flex-1">{(auto.conditions||[]).map((c,i)=><div key={i} style={{ fontSize:11, color:'#aaa' }}>🕐 {c.after} – {c.before}</div>)}</div>
          </div>
        )}
        <div style={{ height:1, background:'rgba(255,255,255,.04)' }}/>
        <div className="flex gap-2">
          <span style={{ fontSize:9, fontWeight:900, color:'rgba(68,255,136,.4)', textTransform:'uppercase', minWidth:26, paddingTop:1 }}>DO</span>
          <div className="flex-1">
            {(auto.actions||[]).length===0
              ? <span style={{ color:'#444', fontSize:11 }}>No action</span>
              : (auto.actions||[]).map((a,i)=><div key={i} style={{ fontSize:11, color:'#ccc', lineHeight:1.5 }}>{a.type==='light_on'?'💡':'🔌'} {sumAction(a)}</div>)}
          </div>
        </div>
      </div>

      {/* Buttons */}
      <div className="flex gap-2">
        <button onClick={onEdit} style={{ flex:1, padding:'6px 10px', borderRadius:8, background:'rgba(0,200,255,.08)', border:'1px solid rgba(0,200,255,.3)', color:'#00ffff', fontSize:11, fontWeight:700, cursor:'pointer' }}>✏️ Edit</button>
        <button onClick={onRunNow} style={{ padding:'6px 12px', borderRadius:8, background:'rgba(255,170,68,.1)', border:'1px solid rgba(255,170,68,.35)', color:'#ffaa44', fontSize:11, fontWeight:700, cursor:'pointer' }}>▶ Test</button>
        <button onClick={onToggle} style={{ padding:'6px 12px', borderRadius:8, fontWeight:900, fontSize:11, cursor:'pointer',
          background:auto.enabled?'rgba(255,100,100,.15)':'rgba(68,255,136,.15)',
          color:auto.enabled?'#ff6666':'#44ff88',
          border:auto.enabled?'1px solid rgba(255,100,100,.4)':'1px solid rgba(68,255,136,.4)'}}>
          {auto.enabled?'⏸ Disable':'▶ Enable'}
        </button>
        <button onClick={onDelete} style={{ padding:'6px 10px', borderRadius:8, background:'rgba(255,100,100,.08)', border:'1px solid rgba(255,100,100,.3)', color:'#ff6666', fontSize:11, cursor:'pointer' }}>🗑️</button>
      </div>
    </div>
  )
}

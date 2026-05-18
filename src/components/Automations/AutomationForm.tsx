import { useState } from 'react'
import { Automation, Trigger, Condition, Action, TriggerType, ActionType, makeId } from './automationsEngine'
import { HAEntityPicker } from '../HAEntityPicker'

const iS = { width:'100%',padding:'6px 8px',borderRadius:6,background:'rgba(0,200,255,.06)',border:'1px solid rgba(0,200,255,.2)',color:'#e0f8ff',fontSize:11,fontFamily:'inherit',outline:'none',boxSizing:'border-box' as const }

function Inp({value,onChange,placeholder,type='text'}:{value:string;onChange:(v:string)=>void;placeholder?:string;type?:string}) {
  return <input type={type} style={iS} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}/>
}
function Sel({value,onChange,options}:{value:string;onChange:(v:string)=>void;options:{value:string;label:string}[]}) {
  return <select style={{...iS,cursor:'pointer'}} value={value} onChange={e=>onChange(e.target.value)}>{options.map(o=><option key={o.value} value={o.value} style={{background:'#070d24'}}>{o.label}</option>)}</select>
}
function EntityRow({value,onChange,placeholder='light.entity_id'}:{value:string;onChange:(v:string)=>void;placeholder?:string}) {
  const [open,setOpen]=useState(false)
  return (
    <div className="flex gap-2">
      <div className="flex-1"><Inp value={value} onChange={onChange} placeholder={placeholder}/></div>
      <button onClick={()=>setOpen(p=>!p)} className="px-2 rounded border border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] text-[10px] shrink-0 hover:bg-[var(--neon-cyan)]/20 transition">🔍</button>
      {open&&<HAEntityPicker currentEntityId={value} onSelect={id=>{onChange(id);setOpen(false)}} onClose={()=>setOpen(false)}/>}
    </div>
  )
}

function TriggerEd({trigger,onChange,onDelete,idx}:{trigger:Trigger;onChange:(t:Trigger)=>void;onDelete:()=>void;idx:number}) {
  const upd=(k:string,v:string)=>onChange({...trigger,[k]:v})
  return (
    <div className="p-3 rounded-lg bg-black/20 border border-[var(--neon-cyan)]/10 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-bold text-[var(--neon-cyan)]/50 uppercase">Trigger {idx+1}</span>
        <div className="flex-1"><Sel value={trigger.type} onChange={v=>onChange({...trigger,type:v as TriggerType})}
          options={[{value:'time',label:'🕐 Time'},{value:'sun',label:'🌅 Sun event'},{value:'state',label:'📡 Entity state'}]}/></div>
        <button onClick={onDelete} className="text-red-400/60 hover:text-red-400 text-[11px]">✕</button>
      </div>
      {trigger.type==='time'&&<Inp type="time" value={trigger.time||'20:00'} onChange={v=>upd('time',v)}/>}
      {trigger.type==='sun'&&(
        <div className="grid grid-cols-2 gap-2">
          <Sel value={trigger.event||'sunset'} onChange={v=>upd('event',v)} options={[{value:'sunrise',label:'🌅 Sunrise'},{value:'sunset',label:'🌇 Sunset'}]}/>
          <Sel value={trigger.offset||'00:00'} onChange={v=>upd('offset',v)} options={['-01:00','-00:30','00:00','+00:30','+01:00','+02:00'].map(o=>({value:o,label:o}))}/>
        </div>
      )}
      {trigger.type==='state'&&(
        <div className="flex flex-col gap-2">
          <EntityRow value={trigger.entity||''} onChange={v=>upd('entity',v)}/>
          <Inp value={trigger.to||''} onChange={v=>upd('to',v)} placeholder="to state e.g. on, off"/>
        </div>
      )}
    </div>
  )
}

function ActionEd({action,onChange,onDelete,idx}:{action:Action;onChange:(a:Action)=>void;onDelete:()=>void;idx:number}) {
  const upd=(k:string,v:string|number)=>onChange({...action,[k]:v})
  return (
    <div className="p-3 rounded-lg bg-black/20 border border-[var(--neon-lime)]/10 mb-2">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-[9px] font-bold text-[var(--neon-lime)]/50 uppercase">Action {idx+1}</span>
        <div className="flex-1"><Sel value={action.type} onChange={v=>onChange({...action,type:v as ActionType})}
          options={[{value:'light_on',label:'💡 Light On'},{value:'light_off',label:'💡 Light Off'},{value:'switch_on',label:'🔌 Switch On'},{value:'switch_off',label:'🔌 Switch Off'}]}/></div>
        <button onClick={onDelete} className="text-red-400/60 hover:text-red-400 text-[11px]">✕</button>
      </div>
      <div className="flex flex-col gap-2">
        <EntityRow value={action.entity} onChange={v=>upd('entity',v)} placeholder={action.type.startsWith('light')?'light.outside_lights':'switch.entity'}/>
        {action.type==='light_on'&&(
          <div className="flex items-center gap-2">
            <span className="text-[9px] text-muted-foreground whitespace-nowrap">Brightness %</span>
            <input type="number" min={1} max={100} style={{...iS,width:70}} value={action.brightness||100} onChange={e=>upd('brightness',Math.min(100,Math.max(1,parseInt(e.target.value)||100)))}/>
          </div>
        )}
        <div className="flex items-center gap-2">
          <span className="text-[9px] text-muted-foreground whitespace-nowrap">Delay (sec)</span>
          <input type="number" min={0} style={{...iS,width:70}} value={action.delay||0} onChange={e=>upd('delay',Math.max(0,parseInt(e.target.value)||0))}/>
        </div>
      </div>
    </div>
  )
}

function CondEd({condition,onChange,onDelete}:{condition:Condition;onChange:(c:Condition)=>void;onDelete:()=>void}) {
  return (
    <div className="p-3 rounded-lg bg-black/20 border border-[var(--neon-amber)]/10 mb-2">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold text-[var(--neon-amber)]/50 uppercase">Time Range</span>
        <button onClick={onDelete} className="text-red-400/60 hover:text-red-400 text-[11px]">✕</button>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div><div className="text-[9px] text-muted-foreground mb-1">After</div><Inp type="time" value={condition.after||'18:00'} onChange={v=>onChange({...condition,after:v})}/></div>
        <div><div className="text-[9px] text-muted-foreground mb-1">Before</div><Inp type="time" value={condition.before||'23:00'} onChange={v=>onChange({...condition,before:v})}/></div>
      </div>
    </div>
  )
}

interface Props { initial: Automation; onSave: (a:Automation)=>void; onCancel: ()=>void }

export function AutomationForm({ initial, onSave, onCancel }: Props) {
  const [auto,setAuto]=useState<Automation>(initial)
  const upd=(k:keyof Automation,v:unknown)=>setAuto(p=>({...p,[k]:v}))
  const updT=(i:number,t:Trigger)=>upd('triggers',auto.triggers.map((x,j)=>j===i?t:x))
  const updA=(i:number,a:Action)=>upd('actions',auto.actions.map((x,j)=>j===i?a:x))
  const updC=(i:number,c:Condition)=>upd('conditions',auto.conditions.map((x,j)=>j===i?c:x))
  const valid=auto.name.trim()&&auto.triggers.length&&auto.actions.length&&auto.actions.every(a=>a.entity)

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-bold text-[var(--neon-cyan)]">{initial.name?'✏ Edit':'✦ New'} Automation</span>
        <button onClick={()=>upd('enabled',!auto.enabled)} className={`w-8 h-4 rounded-full relative transition ${auto.enabled?'bg-[var(--neon-lime)]':'bg-border'}`}>
          <span className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${auto.enabled?'left-4':'left-0.5'}`}/>
        </button>
      </div>
      <div>
        <div className="text-[9px] text-muted-foreground mb-1 uppercase tracking-wider">Name *</div>
        <Inp value={auto.name} onChange={v=>upd('name',v)} placeholder="e.g. Outside Lights at Sunset"/>
      </div>
      <div>
        <div className="text-[9px] font-bold text-[var(--neon-cyan)]/70 uppercase tracking-wider mb-1">⚡ When (Triggers)</div>
        {auto.triggers.map((t,i)=><TriggerEd key={i} idx={i} trigger={t} onChange={t=>updT(i,t)} onDelete={()=>upd('triggers',auto.triggers.filter((_,j)=>j!==i))}/>)}
        <button onClick={()=>upd('triggers',[...auto.triggers,{type:'time',time:'20:00'}])} className="text-[9px] font-bold uppercase text-[var(--neon-cyan)]/60 hover:text-[var(--neon-cyan)] transition">+ Add Trigger</button>
      </div>
      <div>
        <div className="text-[9px] font-bold text-[var(--neon-amber)]/70 uppercase tracking-wider mb-1">🔒 Only If (Conditions)</div>
        {auto.conditions.map((c,i)=><CondEd key={i} condition={c} onChange={c=>updC(i,c)} onDelete={()=>upd('conditions',auto.conditions.filter((_,j)=>j!==i))}/>)}
        <button onClick={()=>upd('conditions',[...auto.conditions,{after:'18:00',before:'23:00'}])} className="text-[9px] font-bold uppercase text-[var(--neon-amber)]/60 hover:text-[var(--neon-amber)] transition">+ Add Condition</button>
      </div>
      <div>
        <div className="text-[9px] font-bold text-[var(--neon-lime)]/70 uppercase tracking-wider mb-1">💡 Do (Actions)</div>
        {auto.actions.map((a,i)=><ActionEd key={i} idx={i} action={a} onChange={a=>updA(i,a)} onDelete={()=>upd('actions',auto.actions.filter((_,j)=>j!==i))}/>)}
        <button onClick={()=>upd('actions',[...auto.actions,{type:'light_on',entity:'',brightness:100}])} className="text-[9px] font-bold uppercase text-[var(--neon-lime)]/60 hover:text-[var(--neon-lime)] transition">+ Add Action</button>
      </div>
      <div className="flex gap-2 pt-2">
        <button onClick={()=>valid&&onSave(auto)} disabled={!valid} className="flex-1 py-2 rounded-lg text-[10px] font-bold uppercase border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/15 text-[var(--neon-cyan)] disabled:opacity-30 hover:bg-[var(--neon-cyan)]/25 transition">💾 Save</button>
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-[10px] font-bold uppercase border border-border bg-white/5 text-muted-foreground hover:border-primary/30 transition">Cancel</button>
      </div>
    </div>
  )
}

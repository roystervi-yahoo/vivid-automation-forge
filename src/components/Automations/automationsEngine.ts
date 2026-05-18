import { haService } from '../../services/haService'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'

export type TriggerType = 'time' | 'sun' | 'state'
export type ActionType  = 'light_on' | 'light_off' | 'switch_on' | 'switch_off'

export interface Trigger   { type:TriggerType; time?:string; event?:'sunrise'|'sunset'; offset?:string; entity?:string; to?:string }
export interface Condition { after?:string; before?:string }
export interface Action    { type:ActionType; entity:string; delay?:number; brightness?:number }
export interface Automation {
  id:string; name:string; enabled:boolean
  triggers:Trigger[]; conditions:Condition[]; actions:Action[]
  lastRun?:string; createdAt:string
}

// ─── Outside lights auto-dimming (ported from V7 outsideLightsEngine.js) ──────
// Dims from 100% at 8PM → 9% at 5AM, crosses midnight
export function calcOutsideBrightness(onHour=20, offHour=5, dimMin=9): number | null {
  const now = new Date()
  const h = now.getHours(), m = now.getMinutes()
  const cur = h + m / 60.0
  const inWindow = onHour > offHour ? (h >= onHour || h < offHour) : (h >= onHour && h < offHour)
  if (!inWindow) return null
  const sf = onHour, ef = offHour + 24.0
  const ca = cur < sf ? cur + 24.0 : cur
  const prog = Math.max(0, Math.min(1, (ca - sf) / (ef - sf)))
  return Math.max(dimMin, Math.min(100, Math.round(100 - prog * (100 - dimMin))))
}

export function nowHHMM() {
  const d = new Date()
  return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}`
}

export function makeId() { return `auto_${Date.now()}_${Math.random().toString(36).slice(2,7)}` }

export function isLightsAuto(a: Automation): boolean {
  const name = (a.name||'').toLowerCase()
  const hasLight = a.actions?.some(ac => ac.type==='light_on'||ac.type==='light_off'||ac.entity?.startsWith('light.'))
  const hasKw = ['outside','light','porch','yard','garden','exterior','front','back'].some(k=>name.includes(k))
  return hasLight || hasKw
}

export async function apiLoad(): Promise<Automation[]> {
  try {
    const r = await fetch(`${API_BASE}/api/automations`)
    if (!r.ok) throw new Error()
    const d = await r.json()
    return (Array.isArray(d)?d:d.automations||[]).filter((a:Automation)=>isLightsAuto(a))
  } catch {
    try { return JSON.parse(localStorage.getItem('outside_lights_automations')||'[]') } catch { return [] }
  }
}

export async function apiSave(automations: Automation[]): Promise<void> {
  localStorage.setItem('outside_lights_automations', JSON.stringify(automations))
  try {
    const r = await fetch(`${API_BASE}/api/automations`)
    const existing: Automation[] = r.ok ? await r.json() : []
    const others = existing.filter((a:Automation)=>!isLightsAuto(a))
    await fetch(`${API_BASE}/api/automations`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify([...others,...automations])})
  } catch {}
}

export function shouldRun(auto: Automation, sunTimes:{sunrise:string;sunset:string}): boolean {
  if (!auto.enabled) return false
  const now = nowHHMM()
  for (const t of auto.triggers) {
    let tt: string|null = null
    if (t.type==='time' && t.time) {
      tt = t.time
    } else if (t.type==='sun' && t.event) {
      const base = t.event==='sunrise' ? sunTimes.sunrise : sunTimes.sunset
      if (!base) continue
      if (t.offset && t.offset!=='00:00') {
        const mx = t.offset.match(/([+-])(\d{2}):(\d{2})/)
        if (mx) {
          const bd = new Date(`2000-01-01T${base}:00`)
          const ms = (parseInt(mx[2])*60+parseInt(mx[3]))*60000*(mx[1]==='-'?-1:1)
          const adj = new Date(bd.getTime()+ms)
          tt = `${String(adj.getHours()).padStart(2,'0')}:${String(adj.getMinutes()).padStart(2,'0')}`
        }
      } else tt = base
    }
    if (!tt) continue
    const [tH,tM]=tt.split(':').map(Number),[nH,nM]=now.split(':').map(Number)
    if (Math.abs(tH*60+tM-(nH*60+nM))>1) continue
    for (const c of auto.conditions) {
      if (c.after&&c.before) {
        const [aH,aM]=c.after.split(':').map(Number),[bH,bM]=c.before.split(':').map(Number)
        if (!(nH*60+nM>=aH*60+aM&&nH*60+nM<=bH*60+bM)) return false
      }
    }
    return true
  }
  return false
}

export async function executeAuto(auto: Automation) {
  for (const action of auto.actions) {
    if (action.delay&&action.delay>0) await new Promise(r=>setTimeout(r,action.delay!*1000))
    if (!action.entity) continue
    const domain = action.entity.split('.')[0]
    const svc = action.type==='light_on'||action.type==='switch_on' ? 'turn_on' : 'turn_off'
    const extra: Record<string,unknown> = { entity_id: action.entity }
    if (svc==='turn_on' && action.brightness) extra.brightness_pct = action.brightness
    await haService.callService(domain, svc, extra).catch(()=>{})
  }
}

// ─── Summarize for card display (V7 style) ─────────────────────────────────────
export function sumTrigger(t: Trigger): string {
  switch(t.type) {
    case 'time':  return `Every day at ${t.time}`
    case 'sun':   return `At ${t.event}${t.offset&&t.offset!=='00:00'?` ${t.offset}`:''}`
    case 'state': return `${t.entity?.split('.')[1]||t.entity} → ${t.to||'any'}`
    default: return t.type
  }
}
export function sumAction(a: Action): string {
  const delay = a.delay&&a.delay>0 ? ` after ${a.delay}s` : ''
  const bri   = a.brightness ? ` @ ${a.brightness}%` : ''
  const name  = a.entity?.split('.')[1]||a.entity
  switch(a.type) {
    case 'light_on':   return `ON ${name}${bri}${delay}`
    case 'light_off':  return `OFF ${name}${delay}`
    case 'switch_on':  return `ON ${name}${delay}`
    case 'switch_off': return `OFF ${name}${delay}`
    default: return a.type
  }
}

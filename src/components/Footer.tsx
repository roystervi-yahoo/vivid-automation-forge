import React, { useState, useMemo, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { Plus, Settings } from 'lucide-react'
import { loadDevices as loadDevicesFromDB, saveDevices as saveDevicesToDB } from '../services/dbService'
import { HAEntityPicker } from './HAEntityPicker'
import { EspEntityPicker } from './EspEntityPicker'
import { useHA } from '../hooks/useHA'
import { haService } from '../services/haService'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'

// ── Device type SVG icons ──────────────────────────────────────────────────
function DeviceIcon({ type, isOn }: { type: string; isOn: boolean }) {
  switch (type) {
    case 'light': return (
      <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
        <ellipse cx="14" cy="13" rx="7" ry="7"
          fill={isOn ? 'rgba(255,238,68,.25)' : 'rgba(255,255,255,.06)'}
          stroke={isOn ? 'rgba(255,238,68,.8)' : 'rgba(255,255,255,.2)'} strokeWidth="1.2"/>
        {isOn && <ellipse cx="14" cy="13" rx="4" ry="4" fill="rgba(255,238,68,.5)"/>}
        <rect x="11" y="19" width="6" height="3" rx="1"
          fill={isOn ? 'rgba(255,238,68,.4)' : 'rgba(255,255,255,.1)'}/>
      </svg>
    )
    case 'fan': return (
      <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
        <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.fan-spin{animation:spin 1.2s linear infinite;transform-origin:14px 14px}`}</style>
        <g className={isOn ? 'fan-spin' : ''}>
          <path d="M14 14 Q16 8 14 3 Q9 7 14 14Z" fill="rgba(0,200,255,.7)"/>
          <path d="M14 14 Q20 16 25 14 Q21 9 14 14Z" fill="rgba(0,200,255,.7)"/>
          <path d="M14 14 Q12 20 14 25 Q19 21 14 14Z" fill="rgba(0,200,255,.7)"/>
          <path d="M14 14 Q8 12 3 14 Q7 19 14 14Z" fill="rgba(0,200,255,.7)"/>
        </g>
        <circle cx="14" cy="14" r="3" fill="rgba(0,200,255,.9)"/>
      </svg>
    )
    case 'water_heater': return (
      <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
        <rect x="8" y="6" width="12" height="18" rx="3"
          fill="rgba(255,100,50,.1)" stroke="rgba(255,100,50,.5)" strokeWidth="1.2"/>
        <rect x="10" y="14" width="8" height="8" rx="2"
          fill={isOn ? 'rgba(255,100,50,.5)' : 'rgba(255,100,50,.15)'}/>
        <circle cx="14" cy="11" r="2"
          fill={isOn ? 'rgba(255,100,50,.7)' : 'rgba(255,100,50,.2)'}/>
      </svg>
    )
    case 'lock': return (
      <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
        <path d="M10 13 Q10 8 14 8 Q18 8 18 13" fill="none"
          stroke="rgba(255,170,68,.7)" strokeWidth="1.5" strokeLinecap="round"/>
        <rect x="8" y="13" width="12" height="10" rx="3"
          fill="rgba(255,170,68,.15)" stroke="rgba(255,170,68,.5)" strokeWidth="1.2"/>
        <circle cx="14" cy="18" r="2" fill="rgba(255,170,68,.7)"/>
      </svg>
    )
    case 'vacuum': return (
      <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
        <style>{`@keyframes vspin{from{transform:rotate(0)}to{transform:rotate(360deg)}}.vspin{animation:vspin 2s linear infinite;transform-origin:14px 14px}`}</style>
        <circle cx="14" cy="14" r="9" fill="rgba(170,68,255,.1)" stroke="rgba(170,68,255,.4)" strokeWidth="1.2"/>
        <g className={isOn ? 'vspin' : ''}>
          <line x1="14" y1="7" x2="14" y2="10" stroke="rgba(170,68,255,.8)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="19" y1="9" x2="17" y2="11" stroke="rgba(170,68,255,.6)" strokeWidth="1.5" strokeLinecap="round"/>
          <line x1="21" y1="14" x2="18" y2="14" stroke="rgba(170,68,255,.5)" strokeWidth="1.5" strokeLinecap="round"/>
        </g>
        <circle cx="14" cy="14" r="3" fill="rgba(170,68,255,.7)"/>
      </svg>
    )
    default: return (
      <svg width="36" height="36" viewBox="0 0 28 28" fill="none">
        <rect x="5" y="7" width="18" height="14" rx="4"
          fill="rgba(0,200,255,.08)" stroke="rgba(0,200,255,.4)" strokeWidth="1.2"/>
        <rect x="11" y="10" width="6" height="8" rx="2"
          fill={isOn ? 'rgba(68,255,136,.7)' : 'rgba(100,100,100,.4)'}
          stroke={isOn ? 'rgba(68,255,136,.9)' : 'rgba(150,150,150,.3)'} strokeWidth="1"/>
      </svg>
    )
  }
}

// ── Device type list ───────────────────────────────────────────────────────
const DEVICE_TYPES = [
  'light','switch','fan','water_heater','lock','outlet',
  'sensor','climate','cover','media_player','vacuum'
]

// ── Default devices (loaded from localStorage or fallback) ─────────────────
const DEFAULT_DEVICES = [
  { id: '1', name: 'Inside Lights',  entity: 'light.inside_lights',     type: 'light',        glowColor: '#ffee44', hidden: false, source: 'ha' },
  { id: '2', name: 'Garage Door',    entity: 'switch.garage_door_plug',  type: 'switch',       glowColor: '#00ffaa', hidden: false, source: 'ha' },
  { id: '3', name: 'Den Fan',        entity: 'fan.living_room_fan',      type: 'fan',          glowColor: '#00ffff', hidden: false, source: 'ha' },
  { id: '4', name: 'Hot Water',      entity: 'switch.hot_water_recirculation_pump', type: 'water_heater', glowColor: '#ff6432', hidden: false, source: 'ha' },
]

function loadDevicesSync() {
  try {
    const saved = localStorage.getItem('footer_devices')
    return saved ? JSON.parse(saved) : DEFAULT_DEVICES
  } catch { return DEFAULT_DEVICES }
}

function saveDevicesSync(devices: typeof DEFAULT_DEVICES) {
  // legacy - now using backend
}

// ── Device Edit Modal ──────────────────────────────────────────────────────
function DeviceModal({ device, onSave, onDelete, onClose, allEntities }: {
  device: any; onSave: (d: any) => void; onDelete: (id: string) => void
  onClose: () => void; allEntities: any[]
}) {
  const [form, setForm] = useState({ ...device })
  const [showHAPicker,  setShowHAPicker]  = useState(false)
  const [showEspPicker, setShowEspPicker] = useState(false)

  return createPortal(
    <div className="fixed inset-0 z-[99999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="glass-panel p-6 w-[420px] max-w-[95vw] flex flex-col gap-4"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between">
          <span className="text-[12px] font-black uppercase tracking-[0.3em] text-[var(--neon-cyan)]">
            ⚙ Edit Device
          </span>
          <button onClick={onClose} className="h-7 w-7 rounded-lg bg-white/5 border border-border flex items-center justify-center hover:border-primary/60 transition text-muted-foreground">✕</button>
        </div>

        {/* Name */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Device Name</label>
          <input className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
        </div>

        {/* Source toggle */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Source</label>
          <div className="flex gap-2">
            {['ha', 'esphome'].map(src => (
              <button key={src} onClick={() => setForm(f => ({ ...f, source: src }))}
                className={`flex-1 py-2 rounded-lg border text-[11px] font-black uppercase tracking-wider transition ${form.source === src ? (src === 'esphome' ? 'border-[var(--neon-cyan)]/60 bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]' : 'border-primary/60 bg-primary/10 text-primary') : 'border-border/40 bg-white/3 text-muted-foreground'}`}>
                {src === 'ha' ? '🏠 Home Assistant' : '📡 ESPHome'}
              </button>
            ))}
          </div>
        </div>

        {/* HA Entity */}
        {form.source === 'ha' && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">HA Entity ID</label>
            <input className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60 font-mono"
              value={form.entity || ''} onChange={e => setForm(f => ({ ...f, entity: e.target.value }))}
              placeholder="light.kitchen" />
            <button onClick={() => setShowHAPicker(true)} className="mt-1 w-full py-1.5 rounded-lg border border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/5 text-[var(--neon-cyan)] text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--neon-cyan)]/15 transition">🔍 Browse HA Entities</button>
          </div>
        )}

        {/* ESPHome fields */}
        {form.source === 'esphome' && (
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground">ESPHome Device ID</label>
            <input className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60 font-mono"
              value={form.espDeviceId || ''} onChange={e => setForm(f => ({ ...f, espDeviceId: e.target.value }))}
              placeholder="bedroom-esp32" />
            <label className="text-[10px] uppercase tracking-widest text-muted-foreground mt-2">Object ID</label>
            <input className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60 font-mono"
              value={form.espObjectId || ''} onChange={e => setForm(f => ({ ...f, espObjectId: e.target.value }))}
              placeholder="relay_1" />
            <button onClick={() => setShowEspPicker(true)} className="mt-2 w-full py-1.5 rounded-lg border border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/5 text-[var(--neon-cyan)] text-[10px] font-bold uppercase tracking-wider hover:bg-[var(--neon-cyan)]/15 transition">📡 Browse ESPHome Entities</button>
          </div>
        )}

        {/* Type */}
        <div className="flex flex-col gap-1">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Type</label>
          <select className="bg-white/5 border border-border rounded-lg px-3 py-2 text-sm text-foreground focus:outline-none focus:border-primary/60"
            value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}>
            {DEVICE_TYPES.map(t => <option key={t} value={t}>{t.replace(/_/g,' ')}</option>)}
          </select>
        </div>

        {/* Glow color */}
        <div className="flex items-center gap-3">
          <label className="text-[10px] uppercase tracking-widest text-muted-foreground">Glow Color</label>
          <input type="color" value={form.glowColor || '#00ffff'}
            onChange={e => setForm(f => ({ ...f, glowColor: e.target.value }))}
            className="h-8 w-14 rounded cursor-pointer bg-transparent border-0" />
          <span className="digit-font text-[11px] text-muted-foreground">{form.glowColor}</span>
        </div>

        {showHAPicker && <HAEntityPicker currentEntityId={form.entity} onSelect={(id, name) => { setForm(f => ({ ...f, entity: id, name: f.name || name })); setShowHAPicker(false); }} onClose={() => setShowHAPicker(false)} />}
        {showEspPicker && <EspEntityPicker onSelect={(devId, objId, key, type, name) => { setForm(f => ({ ...f, espDeviceId: devId, espObjectId: objId, espEntityKey: key, espEntityType: type, name: f.name || name })); setShowEspPicker(false); }} onClose={() => setShowEspPicker(false)} />}
        {/* Footer buttons */}
        <div className="flex gap-2 mt-2">
          <button onClick={() => onDelete(device.id)}
            className="px-4 py-2 rounded-lg border border-red-500/40 bg-red-500/5 text-red-400 text-[11px] font-bold uppercase tracking-widest hover:bg-red-500/15 transition">
            🗑 Delete
          </button>
          <button onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-border/40 bg-white/3 text-muted-foreground text-[11px] font-bold uppercase tracking-widest hover:bg-white/8 transition">
            Cancel
          </button>
          <button onClick={() => { onSave(form); onClose() }}
            className="flex-1 py-2 rounded-lg border border-primary/50 bg-primary/10 text-primary text-[11px] font-bold uppercase tracking-widest hover:bg-primary/20 transition">
            💾 Save
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ── Main Footer ────────────────────────────────────────────────────────────
export function Footer({ editMode = false }: { editMode?: boolean }) {
  const { getState, optimisticUpdate } = useHA()
  const [devices,       setDevices]       = useState<any[]>([])
  const [editingDevice, setEditingDevice] = useState<any>(null)
  const [espStates,     setEspStates]     = useState<Record<string, string>>({})

  // Load devices from backend on mount
  useEffect(() => {
    loadDevicesFromDB().then(d => { if (d && d.length) setDevices(d) })
  }, [])

  // ── Poll ESPHome states ──────────────────────────────────────────────────
  useEffect(() => {
    const espIds = [...new Set(devices.filter(d => d.espDeviceId).map(d => d.espDeviceId))]
    if (espIds.length === 0) return
    const poll = async () => {
      const next: Record<string, string> = {}
      for (const id of espIds) {
        try {
          const r = await fetch(`${API_BASE}/api/esp/devices/${id}/states`)
          if (!r.ok) continue
          const data = await r.json()
          Object.entries(data).forEach(([objId, val]: any) => {
            const isOn = typeof val.state === 'boolean' ? val.state : String(val.state) === 'on' || String(val.state) === 'true'
            next[`${id}:${objId}`] = isOn ? 'on' : 'off'
          })
        } catch {}
      }
      setEspStates(next)
    }
    poll()
    const iv = setInterval(poll, 3000)
    return () => clearInterval(iv)
  }, [devices])

  // ── Toggle ESPHome device ────────────────────────────────────────────────
  const toggleEsp = useCallback(async (device: any) => {
    const key = `${device.espDeviceId}:${device.espObjectId}`
    const isOn = espStates[key] === 'on'
    setEspStates(prev => ({ ...prev, [key]: isOn ? 'off' : 'on' }))
    try {
      await fetch(`${API_BASE}/api/esp/devices/${device.espDeviceId}/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ entityKey: device.espEntityKey, type: device.espEntityType || 'Switch', state: !isOn }),
      })
    } catch {
      setEspStates(prev => ({ ...prev, [key]: isOn ? 'on' : 'off' }))
    }
  }, [espStates])

  // ── Toggle HA device ─────────────────────────────────────────────────────
  const toggleHA = (device: any) => {
    const state = getState(device.entity)
    const isOn  = state?.state === 'on'
    optimisticUpdate(device.entity, { state: isOn ? 'off' : 'on' })
    haService.callService(device.entity.split('.')[0], isOn ? 'turn_off' : 'turn_on', { entity_id: device.entity }).catch(console.error)
  }

  // ── Resolve live state per device ────────────────────────────────────────
  const displayDevices = useMemo(() => devices.filter(d => !d.hidden).map(d => {
    if (d.source === 'esphome' && d.espDeviceId) {
      return { ...d, isOn: espStates[`${d.espDeviceId}:${d.espObjectId}`] === 'on' }
    }
    return { ...d, isOn: getState(d.entity)?.state === 'on' }
  }), [devices, espStates, getState])

  const addDevice = () => {
    const newDevice = { id: Date.now().toString(), name: 'New Device', entity: '', type: 'switch', glowColor: '#00ffff', hidden: false, source: 'ha' }
    const updated = [...devices, newDevice]
    setDevices(updated)
    saveDevicesToDB(updated)
    setEditingDevice(newDevice)
  }

  const saveDevice = (d: any) => {
    const updated = devices.map(x => x.id === d.id ? d : x)
    setDevices(updated)
    saveDevicesToDB(updated)
  }

  const deleteDevice = (id: string) => {
    const updated = devices.filter(x => x.id !== id)
    setDevices(updated)
    saveDevicesToDB(updated)
  }

  const onlineCount = displayDevices.filter(d => d.isOn).length

  return (
    <section className="shrink-0">
      <div className="grid gap-2" style={{ gridTemplateColumns: `repeat(${displayDevices.length + (editMode ? 1 : 0) + 1}, minmax(0,1fr))` }}>

        {displayDevices.map(d => (
          <div key={d.id} className={`device-tile relative flex flex-col items-center gap-1 cursor-pointer select-none transition-all`}
            style={{ '--glow-color': d.glowColor } as any}
            onClick={() => d.source === 'esphome' ? toggleEsp(d) : toggleHA(d)}>

            {/* Glow when on */}
            {d.isOn && <div className="absolute inset-0 rounded-xl opacity-20 pointer-events-none"
              style={{ background: `radial-gradient(circle, ${d.glowColor}, transparent 70%)` }} />}

            <span className={`transition-opacity ${d.isOn ? 'opacity-100' : 'opacity-40'}`}>
              <DeviceIcon type={d.type} isOn={d.isOn} />
            </span>
            <span className="text-[9px] uppercase tracking-widest text-center leading-tight text-foreground/80 truncate w-full text-center">{d.name}</span>
            <div className="flex items-center gap-1">
              <span className={`w-1.5 h-1.5 rounded-full ${d.isOn ? 'bg-[var(--neon-lime)]' : 'bg-white/20'}`} />
              <span className={`digit-font text-[9px] ${d.isOn ? 'text-[var(--neon-lime)]' : 'text-muted-foreground'}`}>
                {d.isOn ? 'ON' : 'OFF'}
              </span>
            </div>

            {/* Edit gear — only in editMode */}
            {editMode && (
              <button onClick={e => { e.stopPropagation(); setEditingDevice(d) }}
                className="absolute top-1 right-1 h-5 w-5 rounded flex items-center justify-center bg-black/40 border border-white/10 hover:border-primary/60 transition opacity-70 hover:opacity-100">
                <Settings className="h-3 w-3 text-muted-foreground" />
              </button>
            )}
          </div>
        ))}

        {/* Add Device — only in editMode */}
        {editMode && (
          <button onClick={addDevice}
            className="device-tile flex flex-col items-center justify-center gap-1 border-dashed opacity-60 hover:opacity-100 transition">
            <Plus className="h-4 w-4 text-primary" />
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Add</span>
          </button>
        )}

        {/* Stats tile */}
        <div className="glass-panel !p-2.5 flex items-center justify-around text-center flex-col gap-1">
          <div>
            <div className="text-[8px] text-muted-foreground tracking-widest uppercase">Online</div>
            <div className="digit-font text-base text-[var(--neon-lime)] font-bold">{onlineCount}</div>
          </div>
          <div>
            <div className="text-[8px] text-muted-foreground tracking-widest uppercase">System</div>
            <div className="digit-font text-base text-[var(--neon-cyan)] font-bold">OK</div>
          </div>
        </div>
      </div>

      {editingDevice && (
        <DeviceModal
          device={editingDevice}
          allEntities={[]}
          onSave={saveDevice}
          onDelete={deleteDevice}
          onClose={() => setEditingDevice(null)}
        />
      )}
    </section>
  )
}

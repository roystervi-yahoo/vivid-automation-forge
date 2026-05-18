import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'
const CONTROLLABLE = ['Switch','Light','Fan','Cover','Number','Select','Lock','Button','Climate']

interface Props {
  onSelect: (deviceId: string, objectId: string, entityKey: string, entityType: string, entityName: string) => void
  onClose: () => void
}

export function EspEntityPicker({ onSelect, onClose }: Props) {
  const [devices,    setDevices]    = useState<any[]>([])
  const [selected,   setSelected]   = useState<any>(null)
  const [entities,   setEntities]   = useState<any[]>([])
  const [loading,    setLoading]    = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/esp/devices`)
      .then(r => r.json())
      .then(d => setDevices(d.filter((x: any) => x.status === 'online')))
      .catch(() => {})
  }, [])

  const pickDevice = async (device: any) => {
    setSelected(device)
    setLoading(true)
    try {
      const r = await fetch(`${API_BASE}/api/esp/devices/${device.id}/entities`)
      setEntities(await r.json())
    } catch {}
    setLoading(false)
  }

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-[480px] max-w-[95vw] max-h-[80vh] flex flex-col glass-panel rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0"
          style={{ background: 'rgba(0,200,255,.05)' }}>
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--neon-cyan)]">
            📡 Pick ESPHome Entity
          </span>
          <button onClick={onClose} className="h-7 w-7 rounded-lg bg-white/5 border border-border flex items-center justify-center hover:border-primary/60 transition text-muted-foreground text-sm">✕</button>
        </div>

        <div className="flex flex-1 min-h-0 overflow-hidden">

          {/* Device list */}
          <div className="w-40 border-r border-border/20 overflow-y-auto shrink-0">
            {devices.length === 0 && (
              <div className="p-4 text-[11px] text-muted-foreground text-center">No online devices</div>
            )}
            {devices.map(d => (
              <div key={d.id} onClick={() => pickDevice(d)}
                className={`px-3 py-2.5 cursor-pointer transition border-l-2 ${selected?.id === d.id ? 'border-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]' : 'border-transparent text-muted-foreground hover:bg-white/5 hover:text-foreground'}`}>
                <div className="text-[11px] font-bold uppercase tracking-wide">{d.name}</div>
                <div className="font-mono text-[9px] opacity-50 mt-0.5">{d.ip}</div>
              </div>
            ))}
          </div>

          {/* Entity list */}
          <div className="flex-1 overflow-y-auto p-2">
            {!selected && <div className="p-6 text-center text-muted-foreground text-sm">← Select a device</div>}
            {loading  && <div className="p-6 text-center text-[var(--neon-cyan)] text-sm">Loading...</div>}
            {!loading && selected && entities.map(e => {
              const isCtrl = CONTROLLABLE.includes(e.type)
              return (
                <div key={e.key}
                  onClick={() => isCtrl && onSelect(selected.id, e.objectId, e.key, e.type, e.name)}
                  className={`flex items-center justify-between px-3 py-2 rounded-lg mb-1 border transition
                    ${isCtrl ? 'cursor-pointer border-border/20 bg-white/3 hover:bg-[var(--neon-cyan)]/10 hover:border-[var(--neon-cyan)]/30' : 'cursor-default border-border/10 bg-white/1 opacity-40'}`}>
                  <div>
                    <div className="text-[11px] font-bold uppercase tracking-wide text-foreground">{e.name}</div>
                    <div className="font-mono text-[9px] text-muted-foreground">{e.objectId}</div>
                  </div>
                  <div className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${isCtrl ? 'border-[var(--neon-cyan)]/30 text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10' : 'border-border/20 text-muted-foreground'}`}>
                    {e.type}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}

import { useState, useEffect, useCallback } from 'react'
import { HAEntityPicker } from '../HAEntityPicker'
import { EspEntityPicker } from '../EspEntityPicker'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'

interface LightGroup { id: string; name: string; entities: string[] }

async function loadGroups(): Promise<LightGroup[]> {
  try { const r = await fetch(`${API_BASE}/api/helpers/light-groups`); if (!r.ok) throw new Error(); return await r.json() } catch { return [] }
}

async function saveGroups(groups: LightGroup[]): Promise<void> {
  await fetch(`${API_BASE}/api/helpers/light-groups`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(groups) })
}

export function LightGroups() {
  const [groups, setGroups] = useState<LightGroup[]>([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState<LightGroup | null>(null)
  const [tempEntities, setTempEntities] = useState('')
  const [tempName, setTempName] = useState('')
  const [showHAPicker, setShowHAPicker] = useState(false)
  const [showEspPicker, setShowEspPicker] = useState(false)

  const load = useCallback(async () => { setLoading(true); setGroups(await loadGroups()); setLoading(false) }, [])
  useEffect(() => { load() }, [load])

  const startNew = () => { setEditing({ id: `group_${Date.now()}`, name: '', entities: [] }); setTempName(''); setTempEntities('') }
  const startEdit = (group: LightGroup) => { setEditing(group); setTempName(group.name); setTempEntities(group.entities.join('\n')) }

  const save = async () => {
    if (!tempName.trim()) { alert('Group name required'); return }
    const entities = tempEntities.split('\n').map(e => e.trim()).filter(e => e)
    if (!entities.length) { alert('At least one entity required'); return }
    const updated = editing ? groups.map(g => g.id === editing.id ? { ...g, name: tempName, entities } : g) : [...groups, { id: editing!.id, name: tempName, entities }]
    setGroups(updated); await saveGroups(updated); setEditing(null)
  }

  const deleteGroup = async (id: string) => {
    if (!window.confirm('Delete?')) return
    const updated = groups.filter(g => g.id !== id); setGroups(updated); await saveGroups(updated)
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <div className="text-[12px] font-black text-[var(--neon-cyan)] uppercase tracking-wider">💡 Light Groups</div>
        <div className="text-[9px] text-muted-foreground mt-0.5">Create groups of lights for automations (HA + ESPHome)</div>
      </div>

      {loading && <div className="text-[10px] text-muted-foreground text-center py-6">Loading…</div>}

      {!editing && !loading && (
        <button onClick={startNew} className="px-4 py-2 rounded-lg border border-[var(--neon-lime)]/40 bg-[var(--neon-lime)]/10 text-[var(--neon-lime)] text-[11px] font-bold uppercase">+ New Group</button>
      )}

      {editing && (
        <div className="glass-panel !p-4 flex flex-col gap-3">
          <div>
            <label className="text-[10px] uppercase text-muted-foreground block mb-2">Group Name</label>
            <input type="text" value={tempName} onChange={e => setTempName(e.target.value)} placeholder="Outside Lights" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-foreground text-[11px]" />
          </div>

          <div>
            <label className="text-[10px] uppercase text-muted-foreground block mb-2">Entities</label>
            <div className="flex gap-2 mb-3">
              <button onClick={() => setShowHAPicker(true)} className="flex-1 px-3 py-2 rounded-lg border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] text-[10px] font-bold uppercase tracking-wider">🏠 + Add HA Light</button>
              <button onClick={() => setShowEspPicker(true)} className="flex-1 px-3 py-2 rounded-lg border border-[var(--neon-magenta)]/40 bg-[var(--neon-magenta)]/10 text-[var(--neon-magenta)] text-[10px] font-bold uppercase tracking-wider">📡 + Add ESPHome Light</button>
            </div>
            <textarea value={tempEntities} onChange={e => setTempEntities(e.target.value)} placeholder="light.porch&#10;light.yard&#10;light.driveway" className="w-full px-3 py-2 rounded-lg bg-white/5 border border-border text-foreground text-[11px] font-mono" rows={4} />
          </div>

          <div className="flex gap-2">
            <button onClick={save} className="flex-1 px-4 py-2 rounded-lg border border-[var(--neon-lime)]/40 bg-[var(--neon-lime)]/10 text-[var(--neon-lime)] text-[11px] font-bold">Save</button>
            <button onClick={() => setEditing(null)} className="flex-1 px-4 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-[11px] font-bold">Cancel</button>
          </div>
        </div>
      )}

      {!editing && !loading && (
        <div className="flex flex-col gap-2">
          {!groups.length && <div className="text-center text-[11px] text-muted-foreground py-6">No groups yet</div>}
          {groups.map(g => (
            <div key={g.id} className="glass-panel !p-3">
              <div className="flex justify-between items-start gap-3 mb-2">
                <div><div className="text-[12px] font-bold text-[var(--neon-lime)]">{g.name}</div><div className="text-[9px] text-muted-foreground mt-1">{g.entities.length} lights</div></div>
                <div className="flex gap-2"><button onClick={() => startEdit(g)} className="px-3 py-1 rounded text-[10px] border border-[var(--neon-lime)]/30 text-[var(--neon-lime)]">Edit</button><button onClick={() => deleteGroup(g.id)} className="px-3 py-1 rounded text-[10px] border border-red-500/30 text-red-400">Delete</button></div>
              </div>
              <div className="text-[9px] font-mono text-muted-foreground whitespace-pre-wrap">{g.entities.join('\n')}</div>
            </div>
          ))}
        </div>
      )}

      {showHAPicker && (
        <HAEntityPicker
          currentEntityId=""
          onSelect={(entityId, friendlyName) => {
            setTempEntities(prev => prev + (prev ? '\n' : '') + entityId)
            setShowHAPicker(false)
          }}
          onClose={() => setShowHAPicker(false)}
        />
      )}

      {showEspPicker && (
        <EspEntityPicker
          onSelect={(deviceId, objectId, entityKey, entityType, entityName) => {
            setTempEntities(prev => prev + (prev ? '\n' : '') + `esphome:${deviceId}:${objectId}`)
            setShowHAPicker(false)
          }}
          onClose={() => setShowEspPicker(false)}
        />
      )}
    </div>
  )
}

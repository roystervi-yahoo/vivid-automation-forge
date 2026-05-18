import { useState, useEffect, useCallback } from 'react'
import { useHA } from '../../hooks/useHA'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'

interface LightGroup {
  id: string
  name: string
  entities: string[]
}

interface DBAutomation {
  id: string; name: string; description: string
  device: string; category: string; enabled: boolean
  config?: { onTime?: string; offTime?: string; dimMin?: number; groupId?: string }
}

const TABS = [
  { id: 'all',      label: '🏠 All',      color: '#00ffff' },
  { id: 'Lights',   label: '💡 Lights',   color: '#ffee44' },
  { id: 'Security', label: '🔒 Security', color: '#ff6432' },
  { id: 'Alerts',   label: '🔔 Alerts',   color: '#00ffff' },
]

const CAT_STYLE: Record<string, { color: string; icon: string }> = {
  Lights:   { color: '#ffee44', icon: '💡' },
  Security: { color: '#ff6432', icon: '🔒' },
  Alerts:   { color: '#00ffff', icon: '🔔' },
}

async function loadAll(): Promise<DBAutomation[]> {
  try {
    const r = await fetch(`${API_BASE}/api/automations`)
    if (!r.ok) throw new Error()
    return await r.json()
  } catch { return [] }
}

async function loadGroups(): Promise<LightGroup[]> {
  try {
    const r = await fetch(`${API_BASE}/api/helpers/light-groups`)
    if (!r.ok) throw new Error()
    return await r.json()
  } catch { return [] }
}

async function saveAll(automations: DBAutomation[]): Promise<void> {
  await fetch(`${API_BASE}/api/automations`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(automations)
  })
}

function timeToHours(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number)
  return h + m / 60
}

function calcBrightness(onTime: string, offTime: string, dimMin: number): number | null {
  const now = new Date()
  const h = now.getHours(), m = now.getMinutes()
  const cur = h + m / 60.0
  const onH = timeToHours(onTime), offH = timeToHours(offTime)
  const inWindow = onH > offH ? (cur >= onH || cur < offH) : (cur >= onH && cur < offH)
  if (!inWindow) return null
  const ca = cur < onH ? cur + 24.0 : cur
  const ef = offH + 24.0
  const prog = Math.max(0, Math.min(1, (ca - onH) / (ef - onH)))
  return Math.max(dimMin, Math.min(100, Math.round(100 - prog * (100 - dimMin))))
}

function to12hr(time24: string): string {
  const [h, m] = time24.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  const h12 = h % 12 || 12
  return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`
}

export function AutomationsTab() {
  const [all,       setAll]       = useState<DBAutomation[]>([])
  const [groups,    setGroups]    = useState<LightGroup[]>([])
  const [loading,   setLoading]   = useState(true)
  const [activeTab, setActiveTab] = useState('all')
  const [editingOutside, setEditingOutside] = useState(false)
  const [tempConfig, setTempConfig] = useState({ onTime: '20:00', offTime: '05:00', dimMin: 9, groupId: '' })

  const { getState } = useHA()
  const sunAttrs = (getState('sun.sun')?.attributes || {}) as Record<string, string>
  const sunrise  = sunAttrs.next_rising?.slice(11, 16)  || '06:30'
  const sunset   = sunAttrs.next_setting?.slice(11, 16) || '19:30'

  const load = useCallback(async () => {
    setLoading(true)
    const [autoData, groupData] = await Promise.all([loadAll(), loadGroups()])
    setAll(autoData)
    setGroups(groupData)
    const outside = autoData.find(a => a.id === 'outside_lights')
    if (outside?.config) {
      setTempConfig({
        onTime: outside.config.onTime || '20:00',
        offTime: outside.config.offTime || '05:00',
        dimMin: outside.config.dimMin || 9,
        groupId: outside.config.groupId || ''
      })
    }
    setLoading(false)
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = async (id: string) => {
    const updated = all.map(a => a.id === id ? { ...a, enabled: !a.enabled } : a)
    setAll(updated)
    await saveAll(updated)
  }

  const saveOutsideConfig = async () => {
    if (!tempConfig.groupId) {
      alert('Please select a light group')
      return
    }
    const updated = all.map(a => 
      a.id === 'outside_lights' 
        ? { ...a, config: { onTime: tempConfig.onTime, offTime: tempConfig.offTime, dimMin: tempConfig.dimMin, groupId: tempConfig.groupId } }
        : a
    )
    setAll(updated)
    await saveAll(updated)
    setEditingOutside(false)
  }

  const filtered = activeTab === 'all' ? all : all.filter(a => a.category === activeTab)
  const counts: Record<string, number> = {}
  all.forEach(a => { counts[a.category] = (counts[a.category] || 0) + 1 })

  const outsideAuto = all.find(a => a.id === 'outside_lights')
  const onTime = outsideAuto?.config?.onTime || '20:00'
  const offTime = outsideAuto?.config?.offTime || '05:00'
  const dimMin = outsideAuto?.config?.dimMin || 9
  const groupId = outsideAuto?.config?.groupId || ''
  const selectedGroup = groups.find(g => g.id === groupId)
  const brightness = calcBrightness(onTime, offTime, dimMin)

  return (
    <div className="flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-[12px] font-black text-[var(--neon-cyan)] uppercase tracking-wider">🤖 Automation Manager</div>
          <div className="text-[9px] text-muted-foreground mt-0.5">{all.length} automations · {all.filter(a=>a.enabled).length} active</div>
        </div>
      </div>

      {/* Sun times */}
      <div className="flex gap-3 px-3 py-2 rounded-lg bg-[var(--neon-amber)]/5 border border-[var(--neon-amber)]/15 flex-wrap items-center">
        <span className="text-[9px] text-[var(--neon-amber)]">🌅 {sunrise}</span>
        <span className="text-[9px] text-[var(--neon-amber)]">🌇 {sunset}</span>
        {brightness !== null
          ? <span className="text-[9px] text-[var(--neon-lime)] ml-auto">💡 Outside: {brightness}% now</span>
          : <span className="text-[9px] text-muted-foreground ml-auto">Outside lights off-window</span>}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1.5 flex-wrap p-2 rounded-xl bg-black/30 border border-[var(--neon-cyan)]/10">
        {TABS.map(tab => {
          const count = tab.id === 'all' ? all.length : (counts[tab.id] || 0)
          const isActive = activeTab === tab.id
          return (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '6px 14px', borderRadius: 20, cursor: 'pointer', fontSize: 12, fontWeight: 700,
                border: `1px solid ${isActive ? tab.color : 'rgba(255,255,255,.1)'}`,
                background: isActive ? 'rgba(255,255,255,.08)' : 'transparent',
                color: isActive ? tab.color : '#555', transition: 'all .2s'
              }}>
              {tab.label}
              {count > 0 && (
                <span style={{ marginLeft: 6, padding: '1px 6px', borderRadius: 10,
                  background: 'rgba(255,255,255,.08)', fontSize: 10,
                  color: isActive ? tab.color : '#444' }}>{count}</span>
              )}
            </button>
          )
        })}
      </div>

      {/* Stats */}
      <div className="flex gap-4 px-3 py-2 rounded-lg bg-black/20 border border-[var(--neon-cyan)]/8 text-[11px]" style={{ color: '#00ffff' }}>
        <span>📊 {filtered.length} shown</span>
        <span>✅ {filtered.filter(a => a.enabled).length} active</span>
        <span>⏸️ {filtered.filter(a => !a.enabled).length} paused</span>
      </div>

      {loading && <div className="text-[10px] text-muted-foreground text-center py-6">Loading automations…</div>}

      {/* Cards grid */}
      {!loading && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
          {filtered.length === 0 && (
            <div className="col-span-2 text-center py-8 text-[11px] text-muted-foreground">No automations in this category</div>
          )}
          {filtered.sort((a,b)=>a.name.localeCompare(b.name)).map(auto => {
            const cs = CAT_STYLE[auto.category] || { color: '#888888', icon: '⚙️' }
            const isOutside = auto.id === 'outside_lights'

            return (
              <div key={auto.id} style={{
                background: auto.enabled ? `${cs.color}08` : 'rgba(0,0,0,.15)',
                border: `2px solid ${auto.enabled ? `${cs.color}30` : 'rgba(255,255,255,.06)'}`,
                borderRadius: 14, padding: 14, display: 'flex', flexDirection: 'column', gap: 10,
                opacity: auto.enabled ? 1 : 0.65, transition: 'all .2s'
              }}>
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px',
                      borderRadius: 20, background: `${cs.color}18`, border: `1px solid ${cs.color}40`, marginBottom: 6 }}>
                      <span style={{ fontSize: 9 }}>{cs.icon}</span>
                      <span style={{ fontSize: 9, fontWeight: 900, color: cs.color, textTransform: 'uppercase', letterSpacing: 1 }}>{auto.category}</span>
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: auto.enabled ? '#fff' : '#777' }}>{auto.name}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,.65)', marginTop: 3, lineHeight: 1.4 }}>{auto.description}</div>
                  </div>
                  <div onClick={() => toggle(auto.id)} style={{ display: 'flex', alignItems: 'center', gap: 5,
                    cursor: 'pointer', flexShrink: 0, padding: '4px 12px', borderRadius: 20,
                    background: auto.enabled ? 'rgba(68,255,136,.15)' : 'rgba(255,100,100,.1)',
                    border: `1px solid ${auto.enabled ? 'rgba(68,255,136,.4)' : 'rgba(255,100,100,.3)'}` }}>
                    <div style={{ width: 7, height: 7, borderRadius: '50%',
                      background: auto.enabled ? '#44ff88' : '#ff6666',
                      boxShadow: auto.enabled ? '0 0 6px #44ff88' : 'none' }}/>
                    <span style={{ fontSize: 10, fontWeight: 900, color: auto.enabled ? '#44ff88' : '#ff6666' }}>
                      {auto.enabled ? 'ON' : 'OFF'}
                    </span>
                  </div>
                </div>

                {/* Outside lights schedule */}
                {isOutside && (
                  <>
                    {!editingOutside ? (
                      <div style={{ padding: '8px 12px', borderRadius: 8, background: 'rgba(0,0,0,.2)',
                        border: '1px solid rgba(255,238,68,.15)', cursor: 'pointer' }} onClick={() => setEditingOutside(true)}>
                        <div style={{ fontSize: 10, color: 'rgba(255,238,68,.7)', marginBottom: 4 }}>⏰ Schedule</div>
                        <div style={{ fontSize: 11, color: '#ffee44', fontWeight: 700 }}>
                          {to12hr(onTime)} → {to12hr(offTime)}
                        </div>
                        <div style={{ fontSize: 9, color: 'rgba(255,255,255,.2)', marginTop: 2 }}>
                          100% @ {to12hr(onTime)} → {dimMin}% @ {to12hr(offTime)}
                        </div>
                        {selectedGroup && (
                          <div style={{ fontSize: 9, color: 'rgba(255,238,68,.5)', marginTop: 3 }}>💡 Group: {selectedGroup.name} ({selectedGroup.entities.length} lights)</div>
                        )}
                        {!selectedGroup && (
                          <div style={{ fontSize: 9, color: 'rgba(255,100,100,.6)', marginTop: 3 }}>⚠️ No light group selected</div>
                        )}
                        {brightness !== null && (
                          <div style={{ fontSize: 9, color: 'rgba(68,255,136,.6)', marginTop: 3 }}>Now: {brightness}%</div>
                        )}
                      </div>
                    ) : (
                      <div style={{ padding: '12px', borderRadius: 8, background: 'rgba(0,0,0,.4)', border: '1px solid rgba(255,238,68,.3)', maxHeight: '350px', overflow: 'auto' }}>
                        {/* Time inputs */}
                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 9, color: 'rgba(255,238,68,.5)', marginBottom: 3, fontWeight: 700 }}>⏰ ON TIME (24hr format)</div>
                          <input type="time" value={tempConfig.onTime}
                            onChange={e => setTempConfig({...tempConfig, onTime: e.target.value})}
                            style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid rgba(255,238,68,.4)',
                              background: 'rgba(0,0,0,.5)', color: '#ffee44', fontSize: 12, fontWeight: 700 }}/>
                          <div style={{ fontSize: 8, color: 'rgba(255,238,68,.4)', marginTop: 2 }}>e.g., 20:00 for 8PM</div>
                        </div>

                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 9, color: 'rgba(255,238,68,.5)', marginBottom: 3, fontWeight: 700 }}>⏰ OFF TIME (24hr format)</div>
                          <input type="time" value={tempConfig.offTime}
                            onChange={e => setTempConfig({...tempConfig, offTime: e.target.value})}
                            style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid rgba(255,238,68,.4)',
                              background: 'rgba(0,0,0,.5)', color: '#ffee44', fontSize: 12, fontWeight: 700 }}/>
                          <div style={{ fontSize: 8, color: 'rgba(255,238,68,.4)', marginTop: 2 }}>e.g., 05:00 for 5AM</div>
                        </div>

                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 9, color: 'rgba(255,238,68,.5)', marginBottom: 3, fontWeight: 700 }}>💡 MIN BRIGHTNESS %</div>
                          <input type="number" min={1} max={100} value={tempConfig.dimMin}
                            onChange={e => setTempConfig({...tempConfig, dimMin: Math.max(1, Math.min(100, parseInt(e.target.value) || 9))})}
                            style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid rgba(255,238,68,.4)',
                              background: 'rgba(0,0,0,.5)', color: '#ffee44', fontSize: 12, fontWeight: 700, textAlign: 'center' }}/>
                        </div>

                        <div style={{ marginBottom: 10 }}>
                          <div style={{ fontSize: 9, color: 'rgba(255,238,68,.5)', marginBottom: 3, fontWeight: 700 }}>📊 LIGHT GROUP</div>
                          <select value={tempConfig.groupId}
                            onChange={e => setTempConfig({...tempConfig, groupId: e.target.value})}
                            style={{ width: '100%', padding: '8px', borderRadius: 6, border: '1px solid rgba(255,238,68,.4)',
                              background: 'rgba(0,0,0,.5)', color: '#ffee44', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                            <option value="">-- Select a light group --</option>
                            {groups.map(g => (
                              <option key={g.id} value={g.id}>{g.name} ({g.entities.length} lights)</option>
                            ))}
                          </select>
                          {groups.length === 0 && (
                            <div style={{ fontSize: 8, color: 'rgba(255,100,100,.6)', marginTop: 4 }}>No light groups. Create one in Settings → Helpers</div>
                          )}
                        </div>

                        {/* Save/Cancel buttons */}
                        <div className="flex gap-2">
                          <button onClick={saveOutsideConfig}
                            style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid rgba(68,255,136,.4)',
                              background: 'rgba(68,255,136,.1)', color: '#44ff88', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            💾 Save Config
                          </button>
                          <button onClick={() => setEditingOutside(false)}
                            style={{ flex: 1, padding: '8px', borderRadius: 6, border: '1px solid rgba(255,100,100,.3)',
                              background: 'rgba(255,100,100,.08)', color: '#ff6666', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                            ✕ Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Enable/Disable button */}
                <button onClick={() => toggle(auto.id)} style={{
                  padding: '8px 14px', borderRadius: 9, fontWeight: 900, fontSize: 12,
                  cursor: 'pointer', width: '100%', transition: 'all .2s',
                  background: auto.enabled ? 'rgba(255,100,100,.12)' : 'rgba(68,255,136,.12)',
                  color: auto.enabled ? '#ff6666' : '#44ff88',
                  border: auto.enabled ? '1px solid rgba(255,100,100,.35)' : '1px solid rgba(68,255,136,.35)'
                }}>
                  {auto.enabled ? '⏸ Disable' : '▶ Enable'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

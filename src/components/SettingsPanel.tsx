import { useState, useEffect } from 'react'
import {
  X, Settings, Palette, Database, Info, Save, Zap,
  RefreshCw, Trash2, Download, Upload, Wifi,
  Server, Camera, Cpu, Shield, Bell
} from 'lucide-react'
import { LightGroups } from './Helpers/LightGroups'
import { AutomationsTab } from './Automations/AutomationsTab'
import { listBackups, createBackup, restoreBackup, deleteBackup, exportAllData, importAllData } from '../services/dbService'

interface Props {
  refreshInterval: number
  onRefreshIntervalChange: (v: number) => void
  theme: string
  onThemeChange: (v: string) => void
  notifications: boolean
  onNotificationsChange: (v: boolean) => void
  autoBackup: boolean
  onAutoBackupChange: (v: boolean) => void
  editMode: boolean
  onEditModeChange: (v: boolean) => void
  onClose: () => void
}

type Tab = 'general' | 'appearance' | 'connections' | 'camera' | 'backup' | 'automations' | 'helpers' | 'about'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{className?:string}> }[] = [
  { id: 'general',     label: 'General',     icon: Settings  },
  { id: 'appearance',  label: 'Appearance',  icon: Palette   },
  { id: 'connections', label: 'Connections', icon: Wifi      },
  { id: 'camera',      label: 'Cameras',     icon: Camera    },
  { id: 'backup',      label: 'Backup',      icon: Database  },
  { id: 'automations', label: 'Automations', icon: Zap       },
  { id: 'helpers',     label: 'Helpers',     icon: Zap       },
  { id: 'about',       label: 'About',       icon: Info      },
]

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-border/30">
      <div>
        <div className="text-sm font-semibold text-foreground/90">{label}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-0.5">{sub}</div>}
      </div>
      <div className="shrink-0 ml-4">{children}</div>
    </div>
  )
}

function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <div onClick={() => onChange(!on)} className="cursor-pointer" >
      <div className={`w-10 h-5 rounded-full relative transition-colors duration-200 ${on ? 'bg-primary' : 'bg-white/15'}`}>
        <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200 ${on ? 'left-5 bg-black' : 'left-0.5 bg-white/40'}`} />
      </div>
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mt-6 mb-2">
      <span className="text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--neon-cyan)]">{children}</span>
      <div className="h-px flex-1 bg-gradient-to-r from-[var(--neon-cyan)]/40 to-transparent" />
    </div>
  )
}


const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'

function ConnectionsTab() {
  const [haUrl,    setHaUrl]    = useState('')
  const [haToken,  setHaToken]  = useState('')
  const [status,   setStatus]   = useState('')
  const [testing,  setTesting]  = useState(false)
  const [saving,   setSaving]   = useState(false)
  const [go2rtcUrl,     setGo2rtcUrl]     = useState('')
  const [go2rtcStatus,  setGo2rtcStatus]  = useState('')
  const [go2rtcTesting, setGo2rtcTesting] = useState(false)
  const [go2rtcSaving,  setGo2rtcSaving]  = useState(false)

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/go2rtc`)
      .then(r => r.json())
      .then(d => setGo2rtcUrl(d.url || ''))
      .catch(() => {})
  }, [])

  const saveGo2rtc = async () => {
    setGo2rtcSaving(true)
    await fetch(`${API_BASE}/api/settings/go2rtc`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: go2rtcUrl }),
    })
    setGo2rtcStatus('✓ Saved!')
    setGo2rtcSaving(false)
    setTimeout(() => setGo2rtcStatus(''), 2500)
  }

  const testGo2rtc = async () => {
    setGo2rtcTesting(true); setGo2rtcStatus('Testing...')
    const r = await fetch(`${API_BASE}/api/settings/go2rtc/test`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url: go2rtcUrl }),
    }).then(r => r.json()).catch(e => ({ success: false, message: e.message }))
    setGo2rtcStatus(r.success ? `✓ ${r.message}` : `✗ ${r.message}`)
    setGo2rtcTesting(false)
    setTimeout(() => setGo2rtcStatus(''), 4000)
  }

  useEffect(() => {
    fetch(`${API_BASE}/api/settings/ha-connection`)
      .then(r => r.json())
      .then(d => { setHaUrl(d.url || ''); setHaToken(d.token ? '••••••••' : ''); })
      .catch(() => {})
  }, [])

  const save = async () => {
    setSaving(true)
    const body: any = { url: haUrl }
    if (haToken && haToken !== '••••••••') body.token = haToken
    await fetch(`${API_BASE}/api/settings/ha-connection`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    setStatus('✓ Saved!')
    setSaving(false)
    setTimeout(() => setStatus(''), 2500)
  }

  const test = async () => {
    setTesting(true); setStatus('Testing...')
    const body: any = { url: haUrl }
    if (haToken && haToken !== '••••••••') body.token = haToken
    const r = await fetch(`${API_BASE}/api/settings/ha-connection/test`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    }).then(r => r.json()).catch(e => ({ success: false, message: e.message }))
    setStatus(r.success ? `✓ ${r.message}` : `✗ ${r.message}`)
    setTesting(false)
    setTimeout(() => setStatus(''), 4000)
  }

  const inputCls = "w-full bg-white/5 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"

  return (
    <div className="flex flex-col gap-4">
      <SectionLabel>Home Assistant</SectionLabel>

      {status && (
        <div className={`px-3 py-2 rounded-lg text-[11px] font-bold border ${status.startsWith('✓') ? 'border-[var(--neon-lime)]/30 bg-[var(--neon-lime)]/5 text-[var(--neon-lime)]' : status.startsWith('✗') ? 'border-red-500/30 bg-red-500/5 text-red-400' : 'border-primary/30 bg-primary/5 text-primary'}`}>
          {status}
        </div>
      )}

      <div className="flex flex-col gap-3">
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">HA URL</div>
          <input className={inputCls} placeholder="http://192.168.1.8:8123"
            value={haUrl} onChange={e => setHaUrl(e.target.value)} />
        </div>
        <div>
          <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">Long-Lived Access Token</div>
          <input className={inputCls} type="password" placeholder="Paste your HA token here"
            value={haToken} onChange={e => setHaToken(e.target.value)}
            onFocus={e => { if (e.target.value === '••••••••') setHaToken('') }} />
          <div className="text-[9px] text-muted-foreground mt-1">HA → Profile → Long-lived access tokens → Create</div>
        </div>
      </div>

      <div className="flex gap-2 mt-1">
        <button onClick={test} disabled={testing || !haUrl}
          className="flex-1 py-2 rounded-lg border border-border/40 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:border-primary/60 hover:text-primary transition disabled:opacity-40">
          {testing ? 'Testing...' : 'Test Connection'}
        </button>
        <button onClick={save} disabled={saving || !haUrl}
          className="flex-1 py-2 rounded-lg border border-primary/50 bg-primary/10 text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 transition disabled:opacity-40">
          {saving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <SectionLabel>go2rtc Camera Server</SectionLabel>
      {go2rtcStatus && (
        <div className={`px-3 py-2 rounded-lg text-[11px] font-bold border ${go2rtcStatus.startsWith('✓') ? 'border-[var(--neon-lime)]/30 bg-[var(--neon-lime)]/5 text-[var(--neon-lime)]' : go2rtcStatus.startsWith('✗') ? 'border-red-500/30 bg-red-500/5 text-red-400' : 'border-primary/30 bg-primary/5 text-primary'}`}>
          {go2rtcStatus}
        </div>
      )}
      <div>
        <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-1.5">go2rtc URL</div>
        <input className={inputCls} placeholder="http://192.168.1.4:1984"
          value={go2rtcUrl} onChange={e => setGo2rtcUrl(e.target.value)} />
        <div className="text-[9px] text-muted-foreground mt-1">Camera streaming server address</div>
      </div>
      <div className="flex gap-2">
        <button onClick={testGo2rtc} disabled={go2rtcTesting || !go2rtcUrl}
          className="flex-1 py-2 rounded-lg border border-border/40 bg-white/5 text-[11px] font-bold uppercase tracking-widest text-muted-foreground hover:border-primary/60 hover:text-primary transition disabled:opacity-40">
          {go2rtcTesting ? 'Testing...' : 'Test Connection'}
        </button>
        <button onClick={saveGo2rtc} disabled={go2rtcSaving || !go2rtcUrl}
          className="flex-1 py-2 rounded-lg border border-primary/50 bg-primary/10 text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary/20 transition disabled:opacity-40">
          {go2rtcSaving ? 'Saving...' : 'Save'}
        </button>
      </div>

      <SectionLabel>ESPHome Backend</SectionLabel>
      <Row label="Backend API" sub="Node.js engine">
        <span className="digit-font text-[11px] text-[var(--neon-cyan)]">{API_BASE}</span>
      </Row>
    </div>
  )
}


function CameraTab() {
  const [cameras,    setCameras]    = useState<any[]>([])
  const [go2rtcUrl,  setGo2rtcUrl]  = useState("")
  const [saving,     setSaving]     = useState(false)
  const [status,     setStatus]     = useState("")
  const [showAdd,    setShowAdd]    = useState(false)
  const [newCam,     setNewCam]     = useState({ name: "", stream: "" })

  useEffect(() => {
    fetch(`${API_BASE}/api/camera-settings`)
      .then(r => r.json())
      .then(d => { setCameras(d.cameras || []); setGo2rtcUrl(d.url || "") })
      .catch(() => {})
  }, [])

  const save = async (cams: any[]) => {
    setSaving(true)
    await fetch(`${API_BASE}/api/camera-settings`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cameras: cams }),
    })
    setSaving(false); setStatus("✓ Saved!"); setTimeout(() => setStatus(""), 2500)
  }

  const toggle   = (id: number) => { const c = cameras.map(x => x.id === id ? { ...x, disabled: !x.disabled } : x); setCameras(c); save(c) }
  const remove   = (id: number) => { const c = cameras.filter(x => x.id !== id); setCameras(c); save(c) }
  const addCam   = () => {
    if (!newCam.name || !newCam.stream) return
    const c = [...cameras, { id: Date.now(), name: newCam.name, stream: newCam.stream, disabled: false }]
    setCameras(c); save(c); setNewCam({ name: "", stream: "" }); setShowAdd(false)
  }

  const inputCls = "w-full bg-white/5 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"

  return (
    <div className="flex flex-col gap-4">
      <SectionLabel>Camera Feeds</SectionLabel>
      {status && <div className="px-3 py-2 rounded-lg text-[11px] font-bold border border-[var(--neon-lime)]/30 bg-[var(--neon-lime)]/5 text-[var(--neon-lime)]">{status}</div>}
      <div className="text-[9px] text-muted-foreground">go2rtc: <span className="text-[var(--neon-cyan)] font-mono">{go2rtcUrl}</span></div>
      <div className="flex flex-col gap-2">
        {cameras.map(cam => (
          <div key={cam.id} className={`flex items-center justify-between px-3 py-2 rounded-lg border transition ${ cam.disabled ? "border-border/20 bg-white/2 opacity-50" : "border-border/30 bg-white/5" }`}>
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wide text-foreground">{cam.name}</div>
              <div className="font-mono text-[9px] text-muted-foreground">{cam.stream}</div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => toggle(cam.id)} className={`px-2 py-1 rounded text-[9px] font-bold uppercase border transition ${ cam.disabled ? "border-[var(--neon-lime)]/40 text-[var(--neon-lime)] bg-[var(--neon-lime)]/10" : "border-[var(--neon-amber)]/40 text-[var(--neon-amber)] bg-[var(--neon-amber)]/10" }`}>
                {cam.disabled ? "Enable" : "Disable"}
              </button>
              <button onClick={() => remove(cam.id)} className="px-2 py-1 rounded text-[9px] font-bold uppercase border border-red-500/40 text-red-400 bg-red-500/10 hover:bg-red-500/20 transition">Del</button>
            </div>
          </div>
        ))}
      </div>
      {showAdd ? (
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-primary/20 bg-white/3">
          <div className="text-[10px] font-bold uppercase tracking-widest text-primary">Add Camera</div>
          <input className={inputCls} placeholder="Display name (e.g. Front Door)" value={newCam.name} onChange={e => setNewCam(p => ({ ...p, name: e.target.value }))} />
          <input className={inputCls} placeholder="Stream ID (e.g. camera_150)" value={newCam.stream} onChange={e => setNewCam(p => ({ ...p, stream: e.target.value }))} />
          <div className="flex gap-2">
            <button onClick={addCam} className="flex-1 py-2 rounded-lg border border-primary/50 bg-primary/10 text-[11px] font-bold uppercase text-primary hover:bg-primary/20 transition">Add</button>
            <button onClick={() => setShowAdd(false)} className="px-4 py-2 rounded-lg border border-border/40 text-[11px] text-muted-foreground">Cancel</button>
          </div>
        </div>
      ) : (
        <button onClick={() => setShowAdd(true)} className="py-2 rounded-lg border border-primary/30 bg-primary/5 text-[11px] font-bold uppercase tracking-widest text-primary hover:bg-primary/10 transition">+ Add Camera</button>
      )}
    </div>
  )
}

export function SettingsPanel({ onClose, editMode, onEditModeChange, refreshInterval, onRefreshIntervalChange, theme, onThemeChange, notifications, onNotificationsChange, autoBackup, onAutoBackupChange }: Props) {
  const [tab,           setTab]           = useState<Tab>('general')
  const [saved,         setSaved]         = useState(false)

  const handleSave = () => {
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const ActiveTab = () => {
    switch (tab) {

      case 'general': return (
        <div>
          <SectionLabel>Dashboard</SectionLabel>
          <Row label="Edit Mode" sub="Show gear icons on all cards">
            <Toggle on={editMode} onChange={onEditModeChange} />
          </Row>
          <Row label="Refresh Interval" sub="How often to fetch HA data">
            <div className="flex items-center gap-2">
              <input
                type="range" min={10} max={300} step={10}
                value={refreshInterval}
                onChange={e => onRefreshIntervalChange(Number(e.target.value))}
                className="w-24 accent-primary cursor-pointer"
              />
              <span className="digit-font text-[11px] text-[var(--neon-cyan)] w-10 text-right">{refreshInterval}s</span>
            </div>
          </Row>
          <Row label="Notifications" sub="System alerts and warnings">
            <Toggle on={notifications} onChange={onNotificationsChange} />
          </Row>
          <Row label="Auto Backup" sub="Daily automatic backup">
            <Toggle on={autoBackup} onChange={onAutoBackupChange} />
          </Row>

          <SectionLabel>System</SectionLabel>
          <Row label="Dashboard Version" sub="Current build">
            <span className="digit-font text-[11px] text-[var(--neon-magenta)]">v8.0.0</span>
          </Row>
          <Row label="React" sub="Frontend framework">
            <span className="digit-font text-[11px] text-muted-foreground">19.x + Vite 8</span>
          </Row>
          <Row label="Storage" sub="IndexedDB local storage">
            <span className="digit-font text-[11px] text-[var(--neon-lime)]">Active</span>
          </Row>
        </div>
      )

      case 'appearance': return (
        <div>
          <SectionLabel>Theme</SectionLabel>
          <div className="grid grid-cols-3 gap-3 mt-2">
            {[
              { id: 'dark',  label: 'Dark',  bg: 'oklch(0.16 0.05 260)', accent: 'oklch(0.82 0.16 210)' },
              { id: 'neon',  label: 'Neon',  bg: 'oklch(0.10 0.05 280)', accent: 'oklch(0.85 0.17 205)' },
              { id: 'amber', label: 'Amber', bg: 'oklch(0.14 0.05 260)', accent: 'oklch(0.82 0.17 75)'  },
            ].map(t => (
              <button key={t.id} onClick={() => onThemeChange(t.id)}
                className={`p-3 rounded-xl border transition flex flex-col gap-2 ${theme === t.id ? 'border-primary bg-primary/10' : 'border-border/40 bg-white/3 hover:border-primary/40'}`}>
                <div className="h-8 rounded-lg" style={{ background: t.bg, border: `2px solid ${t.accent}` }} />
                <span className="text-[11px] font-bold uppercase tracking-widest text-foreground/80">{t.label}</span>
                {theme === t.id && <span className="text-[9px] text-primary digit-font">ACTIVE</span>}
              </button>
            ))}
          </div>

          <SectionLabel>Layout</SectionLabel>
          <Row label="Carousel Cards" sub="Visible at once">
            <div className="flex gap-1">
              {[2, 3, 4].map(n => (
                <button key={n} className="h-7 w-7 rounded-lg border border-border/40 text-[11px] font-bold hover:border-primary/60 transition text-muted-foreground hover:text-primary">
                  {n}
                </button>
              ))}
            </div>
          </Row>
          <Row label="Compact Mode" sub="Reduce padding and spacing">
            <Toggle on={false} onChange={() => {}} />
          </Row>
        </div>
      )

            case 'connections': return (
        <ConnectionsTab />
      )

      case 'automations': return (<AutomationsTab />)
      case 'helpers': return (<LightGroups />)
      case 'backup': return <BackupTab autoBackup={autoBackup} onAutoBackupChange={onAutoBackupChange} />
      case 'camera': return <CameraTab />

      case 'about': return (
        <div>
          <SectionLabel>Dashboard</SectionLabel>
          <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
            <div className="text-3xl neon-text font-black tracking-widest mb-1">HA DASH</div>
            <div className="digit-font text-[var(--neon-magenta)] text-sm">v8.0.0</div>
            <div className="text-[11px] text-muted-foreground mt-2">3D Futuristic Home Assistant Dashboard</div>
          </div>

          <SectionLabel>Stack</SectionLabel>
          {[
            { label: 'React 19',          value: 'Frontend framework'         },
            { label: 'Vite 8',            value: 'Build tool'                 },
            { label: 'TypeScript',        value: 'Type safety'                },
            { label: 'Tailwind v4',       value: 'Styling'                    },
            { label: 'Embla Carousel',    value: 'Swipeable cards'            },
            { label: 'IndexedDB',         value: 'Local persistence'          },
            { label: 'Node.js backend',   value: 'Engines + ESPHome API'      },
            { label: 'ESPHome Native API','value': 'Direct device control'    },
            { label: 'go2rtc',            value: 'Camera streaming'           },
          ].map(s => (
            <Row key={s.label} label={s.label} sub={s.value}>
              <span className="digit-font text-[10px] text-[var(--neon-cyan)]">✓</span>
            </Row>
          ))}

          <SectionLabel>Privacy</SectionLabel>
          <div className="text-[11px] text-muted-foreground leading-relaxed mt-2">
            All data stays local. No cloud. No telemetry. No ads. Your HA token never leaves your network.
          </div>
        </div>
      )

      default: return null
    }
  }

  return (
    <div className="fixed inset-0 z-[9999] flex" onClick={onClose}>
      <div
        className="relative m-auto w-full h-full max-w-[1400px] glass-panel flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-4 border-b border-border/40 shrink-0">
          <div className="flex items-center gap-3">
            <Settings className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-black tracking-[0.2em] neon-text uppercase">Settings</h2>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSave}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition text-[11px] font-bold uppercase tracking-widest ${saved ? 'border-[var(--neon-lime)]/60 bg-[var(--neon-lime)]/10 text-[var(--neon-lime)]' : 'border-primary/50 bg-primary/10 text-primary hover:bg-primary/20'}`}>
              <Save className="h-3.5 w-3.5" />
              {saved ? 'Saved!' : 'Save'}
            </button>
            <button onClick={onClose}
              className="h-9 w-9 rounded-lg bg-white/5 border border-border flex items-center justify-center hover:border-primary/60 transition">
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 min-h-0">
          {/* Sidebar tabs */}
          <div className="w-48 border-r border-border/40 flex flex-col gap-1 p-3 shrink-0">
            {TABS.map(t => {
              const Icon = t.icon
              const active = tab === t.id
              return (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition ${active ? 'bg-primary/15 border border-primary/40 text-primary' : 'text-muted-foreground hover:bg-white/5 hover:text-foreground border border-transparent'}`}>
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="text-[12px] font-semibold tracking-wide">{t.label}</span>
                </button>
              )
            })}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto px-8 py-4">
            <ActiveTab />
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Backup Tab ─────────────────────────────────────────────────────────────
function BackupTab({ autoBackup, onAutoBackupChange }: { autoBackup: boolean, onAutoBackupChange: (v: boolean) => void }) {
  const [backups,       setBackups]       = useState<any[]>([])
  const [loading,       setLoading]       = useState(true)
  const [saving,        setSaving]        = useState(false)
  const [backupName,    setBackupName]    = useState('')
  const [status,        setStatus]        = useState('')
  const [restoreTarget, setRestoreTarget] = useState<any>(null)
  const [deleteTarget,  setDeleteTarget]  = useState<any>(null)

  const load = async () => {
    setLoading(true)
    const list = await listBackups()
    setBackups(Array.isArray(list) ? list : (list?.backups || []))
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  const flash = (msg: string) => { setStatus(msg); setTimeout(() => setStatus(''), 3000) }

  const handleCreate = async () => {
    setSaving(true)
    await createBackup(backupName || `Manual Backup - ${new Date().toLocaleString()}`)
    setBackupName('')
    await load()
    flash('✓ Backup created!')
    setSaving(false)
  }

  const handleExport = async () => {
    flash('⏳ Exporting...')
    await exportAllData()
    flash('✓ Exported!')
  }

  const handleImport = () => {
    const input = document.createElement('input')
    input.type = 'file'; input.accept = 'application/json'
    input.onchange = async (e: any) => {
      const file = e.target.files[0]; if (!file) return
      flash('⏳ Importing...')
      await importAllData(file)
      flash('✓ Imported! Reload to apply.')
    }
    input.click()
  }

  const handleRestore = async () => {
    if (!restoreTarget) return
    await restoreBackup(restoreTarget.file)
    setRestoreTarget(null)
    flash('✓ Restored! Reload to apply.')
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    await deleteBackup(deleteTarget.file)
    setDeleteTarget(null)
    await load()
    flash('✓ Deleted')
  }

  return (
    <div>
      {/* Status */}
      {status && (
        <div className="mb-3 px-3 py-2 rounded-lg border border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/5 text-[var(--neon-cyan)] text-[11px] font-bold">
          {status}
        </div>
      )}

      {/* Create + Export/Import */}
      <SectionLabel>Backup &amp; Restore</SectionLabel>
      <div className="flex gap-2 mt-3 mb-2">
        <input
          className="flex-1 glass-panel !px-3 !py-2 text-[12px] text-foreground bg-transparent outline-none border border-border/40 rounded-lg"
          value={backupName}
          onChange={e => setBackupName(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleCreate()}
          placeholder={`Auto: ${new Date().toLocaleString()}`}
        />
        <button onClick={handleCreate} disabled={saving}
          className="px-4 py-2 rounded-lg border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] text-[11px] font-bold uppercase tracking-widest hover:bg-[var(--neon-cyan)]/20 transition disabled:opacity-50">
          {saving ? '⏳' : '💾 Backup'}
        </button>
      </div>
      <div className="grid grid-cols-2 gap-3 mt-3">
        <button onClick={handleExport}
          className="device-tile !p-4 flex flex-col items-center gap-2 hover:border-primary/60">
          <Download className="h-6 w-6 text-[var(--neon-cyan)]" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Export JSON</span>
          <span className="text-[9px] text-muted-foreground text-center">Download all settings</span>
        </button>
        <button onClick={handleImport}
          className="device-tile !p-4 flex flex-col items-center gap-2 hover:border-primary/60">
          <Upload className="h-6 w-6 text-[var(--neon-magenta)]" />
          <span className="text-[11px] font-bold uppercase tracking-widest">Import JSON</span>
          <span className="text-[9px] text-muted-foreground text-center">Restore from file</span>
        </button>
      </div>

      {/* Backup list */}
      <SectionLabel>Saved Backups ({backups.length}/10)</SectionLabel>
      {loading && <div className="text-[11px] text-muted-foreground py-4 text-center">Loading...</div>}
      {!loading && backups.length === 0 && (
        <div className="text-[11px] text-muted-foreground py-4 text-center">No backups yet — create one above</div>
      )}
      <div className="flex flex-col gap-2 mt-2">
        {backups.map((b: any) => (
          <div key={b.file} className="glass-panel !p-3 flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-bold text-foreground truncate">{b.name || b.file}</div>
              <div className="text-[9px] text-muted-foreground mt-0.5">
                {b.createdAt ? new Date(b.createdAt).toLocaleString() : 'Unknown date'}
                {b.isHold && <span className="ml-2 text-[var(--neon-amber)]">· Protected</span>}
              </div>
            </div>
            <button onClick={() => setRestoreTarget(b)}
              className="px-2 py-1 rounded-lg border border-[var(--neon-cyan)]/30 bg-[var(--neon-cyan)]/5 text-[var(--neon-cyan)] text-[9px] font-bold hover:bg-[var(--neon-cyan)]/15 transition">
              Restore
            </button>
            <button onClick={() => setDeleteTarget(b)} disabled={b.isHold}
              className="px-2 py-1 rounded-lg border border-red-500/30 bg-red-500/5 text-red-400 text-[9px] font-bold hover:bg-red-500/15 transition disabled:opacity-30">
              Delete
            </button>
          </div>
        ))}
      </div>

      {/* Auto backup + storage info */}
      <SectionLabel>Storage</SectionLabel>
      <Row label="Backend (port 3001)" sub="JSON files on NAS">
        <span className="digit-font text-[11px] text-[var(--neon-lime)]">Active</span>
      </Row>
      <Row label="Auto Backup" sub="Daily snapshots">
        <Toggle on={autoBackup} onChange={onAutoBackupChange} />
      </Row>

      {/* Confirm restore */}
      {restoreTarget && (
        <div className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center">
          <div className="glass-panel !p-6 w-80 flex flex-col gap-4">
            <div className="text-[13px] font-bold">Restore "{restoreTarget.name || restoreTarget.file}"?</div>
            <div className="text-[11px] text-muted-foreground">This will overwrite current settings.</div>
            <div className="flex gap-3">
              <button onClick={handleRestore}
                className="flex-1 py-2 rounded-lg border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] text-[11px] font-bold">
                ✓ Restore
              </button>
              <button onClick={() => setRestoreTarget(null)}
                className="flex-1 py-2 rounded-lg border border-border/40 text-muted-foreground text-[11px]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm delete */}
      {deleteTarget && (
        <div className="fixed inset-0 z-[99999] bg-black/80 flex items-center justify-center">
          <div className="glass-panel !p-6 w-80 flex flex-col gap-4">
            <div className="text-[13px] font-bold">Delete "{deleteTarget.name || deleteTarget.file}"?</div>
            <div className="flex gap-3">
              <button onClick={handleDelete}
                className="flex-1 py-2 rounded-lg border border-red-500/40 bg-red-500/10 text-red-400 text-[11px] font-bold">
                Delete
              </button>
              <button onClick={() => setDeleteTarget(null)}
                className="flex-1 py-2 rounded-lg border border-border/40 text-muted-foreground text-[11px]">
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

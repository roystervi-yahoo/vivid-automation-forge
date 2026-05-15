import { useState, useEffect } from 'react'
import {
  X, Settings, Palette, Database, Info, Save,
  RefreshCw, Trash2, Download, Upload, Wifi,
  Server, Camera, Cpu, Shield, Bell
} from 'lucide-react'
import { haService } from '../services/haService'

interface Props {
  onClose: () => void
}

type Tab = 'general' | 'appearance' | 'connections' | 'backup' | 'about'

const TABS: { id: Tab; label: string; icon: React.ComponentType<{className?:string}> }[] = [
  { id: 'general',     label: 'General',     icon: Settings  },
  { id: 'appearance',  label: 'Appearance',  icon: Palette   },
  { id: 'connections', label: 'Connections', icon: Wifi      },
  { id: 'backup',      label: 'Backup',      icon: Database  },
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

export function SettingsPanel({ onClose }: Props) {
  const [tab,           setTab]           = useState<Tab>('general')
  const [editMode,      setEditMode]      = useState(false)
  const [autoBackup,    setAutoBackup]    = useState(true)
  const [notifications, setNotifications] = useState(true)
  const [refreshInterval, setRefreshInterval] = useState(30)
  const [theme,         setTheme]         = useState('dark')
  const [saved,         setSaved]         = useState(false)

  const [haUrl,   setHaUrl]   = useState('')
  const [haToken, setHaToken] = useState('')
  const [haStatus, setHaStatus] = useState<'unknown' | 'ok' | 'fail'>('unknown')

  useEffect(() => {
    const cfg = haService.getConfig()
    setHaUrl(cfg.url)
    setHaToken(cfg.token)
    if (cfg.token) haService.ping().then(ok => setHaStatus(ok ? 'ok' : 'fail'))
  }, [])

  const handleSave = () => {
    haService.setConfig(haUrl, haToken)
    haService.ping().then(ok => setHaStatus(ok ? 'ok' : 'fail'))
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const ActiveTab = () => {
    switch (tab) {

      case 'general': return (
        <div>
          <SectionLabel>Dashboard</SectionLabel>
          <Row label="Edit Mode" sub="Show gear icons on all cards">
            <Toggle on={editMode} onChange={setEditMode} />
          </Row>
          <Row label="Refresh Interval" sub="How often to fetch HA data">
            <div className="flex items-center gap-2">
              <input
                type="range" min={10} max={300} step={10}
                value={refreshInterval}
                onChange={e => setRefreshInterval(Number(e.target.value))}
                className="w-24 accent-primary cursor-pointer"
              />
              <span className="digit-font text-[11px] text-[var(--neon-cyan)] w-10 text-right">{refreshInterval}s</span>
            </div>
          </Row>
          <Row label="Notifications" sub="System alerts and warnings">
            <Toggle on={notifications} onChange={setNotifications} />
          </Row>
          <Row label="Auto Backup" sub="Daily automatic backup">
            <Toggle on={autoBackup} onChange={setAutoBackup} />
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
              <button key={t.id} onClick={() => setTheme(t.id)}
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
        <div>
          <SectionLabel>Home Assistant</SectionLabel>
          <Row label="HA URL" sub="REST API endpoint (e.g. http://192.168.1.8:8123)">
            <input
              type="text"
              value={haUrl}
              onChange={e => setHaUrl(e.target.value)}
              placeholder="http://192.168.1.8:8123"
              className="digit-font text-[11px] text-[var(--neon-cyan)] bg-black/30 border border-border/60 rounded px-2 py-1 w-64 focus:outline-none focus:border-primary"
            />
          </Row>
          <Row label="Token" sub="Long-lived access token (HA → Profile → Security)">
            <input
              type="password"
              value={haToken}
              onChange={e => setHaToken(e.target.value)}
              placeholder="eyJhbGc..."
              className="digit-font text-[11px] text-muted-foreground bg-black/30 border border-border/60 rounded px-2 py-1 w-64 focus:outline-none focus:border-primary"
            />
          </Row>
          <Row label="Status" sub="Press Save to test connection">
            <div className="flex items-center gap-1.5">
              <span className={`pulse-dot ${haStatus === 'ok' ? '' : 'off'}`} />
              <span className={`digit-font text-[11px] ${
                haStatus === 'ok'   ? 'text-[var(--neon-lime)]'
                : haStatus === 'fail' ? 'text-red-400'
                : 'text-muted-foreground'
              }`}>
                {haStatus === 'ok' ? 'CONNECTED' : haStatus === 'fail' ? 'FAILED' : 'UNKNOWN'}
              </span>
            </div>
          </Row>

          <SectionLabel>go2rtc — Cameras</SectionLabel>
          <Row label="Server URL" sub="Camera streaming server">
            <span className="digit-font text-[11px] text-[var(--neon-cyan)]">192.168.1.4:1984</span>
          </Row>
          <Row label="Status" sub="Stream health">
            <div className="flex items-center gap-1.5">
              <span className="pulse-dot" />
              <span className="digit-font text-[11px] text-[var(--neon-lime)]">ONLINE</span>
            </div>
          </Row>

          <SectionLabel>ESPHome</SectionLabel>
          <Row label="Backend API" sub="Node.js engine">
            <span className="digit-font text-[11px] text-[var(--neon-cyan)]">192.168.1.4:3001</span>
          </Row>
          <Row label="Dashboard URL" sub="OTA update server">
            <span className="digit-font text-[11px] text-[var(--neon-cyan)]">192.168.1.4:6052</span>
          </Row>

          <SectionLabel>Backend Engines</SectionLabel>
          {[
            { label: 'ESPHome Engine',     icon: Cpu,    status: 'running' },
            { label: 'Auto-Arm Engine',    icon: Shield, status: 'running' },
            { label: 'Automations Engine', icon: RefreshCw, status: 'running' },
            { label: 'Lights Engine',      icon: Bell,   status: 'running' },
          ].map(e => (
            <Row key={e.label} label={e.label}>
              <div className="flex items-center gap-1.5">
                <span className="pulse-dot" />
                <span className="digit-font text-[11px] text-[var(--neon-lime)] uppercase">{e.status}</span>
              </div>
            </Row>
          ))}
        </div>
      )

      case 'backup': return (
        <div>
          <SectionLabel>Backup &amp; Restore</SectionLabel>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <button className="device-tile !p-4 flex flex-col items-center gap-2 hover:border-primary/60">
              <Download className="h-6 w-6 text-[var(--neon-cyan)]" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Export Backup</span>
              <span className="text-[9px] text-muted-foreground text-center">Download all settings as JSON</span>
            </button>
            <button className="device-tile !p-4 flex flex-col items-center gap-2 hover:border-primary/60">
              <Upload className="h-6 w-6 text-[var(--neon-magenta)]" />
              <span className="text-[11px] font-bold uppercase tracking-widest">Import Backup</span>
              <span className="text-[9px] text-muted-foreground text-center">Restore from JSON file</span>
            </button>
          </div>

          <SectionLabel>Storage</SectionLabel>
          <Row label="IndexedDB" sub="Browser local storage">
            <span className="digit-font text-[11px] text-[var(--neon-lime)]">Active</span>
          </Row>
          <Row label="Auto Backup" sub="Daily snapshots">
            <Toggle on={autoBackup} onChange={setAutoBackup} />
          </Row>

          <SectionLabel>Danger Zone</SectionLabel>
          <button className="mt-2 w-full py-3 rounded-xl border border-red-500/40 bg-red-500/5 text-red-400 text-[11px] font-bold uppercase tracking-widest hover:bg-red-500/15 transition flex items-center justify-center gap-2">
            <Trash2 className="h-4 w-4" />
            Clear All Data
          </button>
        </div>
      )

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

import { useState, useEffect } from 'react'
import { Github, GitBranch, CheckCircle2 } from 'lucide-react'

const ghStyles = `
.gh-sync {
  display: inline-flex; align-items: center; gap: 8px;
  padding: 4px 10px; border-radius: 8px;
  background: linear-gradient(135deg, oklch(0.22 0.06 260 / 0.7), oklch(0.16 0.05 260 / 0.7));
  border: 1px solid oklch(0.82 0.16 210 / 0.3);
  box-shadow: 0 0 12px oklch(0.82 0.16 210 / 0.15), inset 0 1px 0 oklch(1 0 0 / 0.05);
  font-family: 'Orbitron', monospace;
}
.gh-sync__dot {
  width: 6px; height: 6px; border-radius: 999px;
  background: var(--neon-lime, #84ff66);
  box-shadow: 0 0 8px var(--neon-lime, #84ff66);
  animation: gh-pulse 2s ease-in-out infinite;
}
@keyframes gh-pulse { 0%,100% { opacity: 1 } 50% { opacity: 0.4 } }
.gh-sync__sep { width: 1px; height: 14px; background: oklch(1 0 0 / 0.1); }
.gh-sync__repo { font-size: 10px; font-weight: 700; letter-spacing: 0.1em; color: oklch(0.95 0.02 260); }
.gh-sync__branch { font-size: 9px; color: var(--neon-cyan, #6cf); display: inline-flex; align-items: center; gap: 3px; letter-spacing: 0.08em; }
.gh-sync__time { font-size: 9px; color: oklch(0.7 0.02 260); letter-spacing: 0.05em; }
.gh-sync__check { color: var(--neon-lime, #84ff66); }
`

function timeAgo(d: Date) {
  const s = Math.floor((Date.now() - d.getTime()) / 1000)
  if (s < 60) return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

interface Props {
  repo?: string
  branch?: string
  lastSync?: Date
  connected?: boolean
}

export function GitHubSyncStatus({
  repo = 'ha-dash',
  branch = 'main',
  lastSync = new Date(Date.now() - 1000 * 60 * 3),
  connected = true,
}: Props) {
  const [, force] = useState(0)
  useEffect(() => {
    const t = setInterval(() => force(n => n + 1), 30000)
    return () => clearInterval(t)
  }, [])

  return (
    <>
      <style>{ghStyles}</style>
      <div className="gh-sync" title={connected ? `Synced ${lastSync.toLocaleString()}` : 'Disconnected'}>
        <Github className="h-3.5 w-3.5 text-foreground/80" />
        <span className="gh-sync__repo">{repo}</span>
        <span className="gh-sync__sep" />
        <span className="gh-sync__branch">
          <GitBranch className="h-3 w-3" />
          {branch}
        </span>
        <span className="gh-sync__sep" />
        <span className="gh-sync__dot" style={connected ? {} : { background: '#f55', boxShadow: '0 0 8px #f55' }} />
        <span className="gh-sync__time">{connected ? timeAgo(lastSync) : 'OFFLINE'}</span>
        {connected && <CheckCircle2 className="gh-sync__check h-3 w-3" />}
      </div>
    </>
  )
}
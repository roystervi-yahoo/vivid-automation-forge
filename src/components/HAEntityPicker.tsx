import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { useHA } from '../hooks/useHA'

interface Props {
  currentEntityId?: string
  onSelect: (entityId: string, friendlyName: string) => void
  onClose: () => void
}

export function HAEntityPicker({ currentEntityId, onSelect, onClose }: Props) {
  const { entities } = useHA()
  const [search,       setSearch]       = useState('')
  const [filterDomain, setFilterDomain] = useState('all')

  const allEntities = Object.values(entities || {}) as any[]

  const domains = ['all', ...new Set(allEntities.map(e => e.entity_id.split('.')[0]))]
    .slice(0, 14)

  const filtered = allEntities
    .filter(e => filterDomain === 'all' || e.entity_id.startsWith(filterDomain + '.'))
    .filter(e => {
      const t = search.toLowerCase()
      return !t || e.entity_id.toLowerCase().includes(t) ||
        (e.attributes?.friendly_name || '').toLowerCase().includes(t)
    })
    .slice(0, 80)

  return createPortal(
    <div className="fixed inset-0 z-[999999] flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,.8)', backdropFilter: 'blur(8px)' }}
      onClick={onClose}>
      <div className="w-full max-w-lg max-h-[80vh] flex flex-col glass-panel rounded-t-2xl sm:rounded-2xl overflow-hidden"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-3 border-b border-border/40 shrink-0">
          <span className="text-[11px] font-black uppercase tracking-[0.3em] text-[var(--neon-cyan)]">
            🏠 Pick HA Entity
          </span>
          <div className="flex items-center gap-2">
            <span className="digit-font text-[10px] text-muted-foreground">{filtered.length} / {allEntities.length}</span>
            <button onClick={onClose} className="h-7 w-7 rounded-lg bg-white/5 border border-border flex items-center justify-center hover:border-primary/60 transition text-muted-foreground text-sm">✕</button>
          </div>
        </div>

        {/* Search */}
        <div className="px-4 py-2 shrink-0 border-b border-border/20">
          <input autoFocus
            className="w-full bg-white/5 border border-border/40 rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60"
            placeholder="Search entity ID or name..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        {/* Domain pills */}
        <div className="flex gap-1.5 px-4 py-2 overflow-x-auto shrink-0 border-b border-border/20">
          {domains.map(d => (
            <button key={d} onClick={() => setFilterDomain(d)}
              className={`px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider whitespace-nowrap transition ${filterDomain === d ? 'bg-primary/20 border border-primary/50 text-primary' : 'bg-white/5 border border-border/30 text-muted-foreground hover:border-primary/30'}`}>
              {d === 'all' ? 'All' : d}
            </button>
          ))}
        </div>

        {/* Entity list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 && (
            <div className="p-8 text-center text-muted-foreground text-sm">
              {allEntities.length === 0 ? 'HA not connected' : `No results for "${search}"`}
            </div>
          )}
          {filtered.map(e => {
            const name = e.attributes?.friendly_name || e.entity_id.split('.')[1]
            const isCurrent = e.entity_id === currentEntityId
            return (
              <div key={e.entity_id}
                onClick={() => { onSelect(e.entity_id, name); onClose() }}
                className={`flex items-center gap-3 px-4 py-2.5 cursor-pointer transition hover:bg-white/5 border-b border-border/10 ${isCurrent ? 'bg-primary/10' : ''}`}>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-foreground/90 truncate">
                    {name} {isCurrent && <span className="text-[var(--neon-lime)] ml-1">✓</span>}
                  </div>
                  <div className="digit-font text-[10px] text-muted-foreground truncate">{e.entity_id}</div>
                </div>
                <div className={`digit-font text-[10px] px-2 py-0.5 rounded-full border ${e.state === 'on' || e.state === 'playing' ? 'border-[var(--neon-lime)]/40 text-[var(--neon-lime)] bg-[var(--neon-lime)]/10' : 'border-border/30 text-muted-foreground'}`}>
                  {e.state}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>,
    document.body
  )
}

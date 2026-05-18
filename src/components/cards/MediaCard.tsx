import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Volume2, VolumeX, SkipBack, SkipForward, Play, Pause,
  Shuffle, Repeat, Repeat1, ChevronDown, ChevronUp,
  FolderOpen, Music, Network, List, X,
} from 'lucide-react'
import { useHA } from '../../hooks/useHA'
import { haService } from '../../services/haService'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'
const HA_URL   = import.meta.env.VITE_HA_URL    || 'http://192.168.1.8:8123'

// ─── Utility (borrowed from homeii-music-flow) ────────────────────────────────
function fmt(s: number) {
  if (!s || isNaN(s)) return '0:00'
  const m = Math.floor(s / 60)
  return `${m}:${String(Math.floor(s % 60)).padStart(2, '0')}`
}

function resolveArtUrl(attrs: Record<string, unknown>): string | null {
  const pic = attrs.entity_picture as string | null
  if (!pic) return null
  if (/^https?:/.test(pic)) return pic
  return `${HA_URL}${pic}`
}

function qualityBadge(attrs: Record<string, unknown>): string {
  const hay = [attrs.media_content_type, attrs.source, attrs.app_name]
    .join(' ').toLowerCase()
  if (/(flac|alac|wav|lossless|24.bit|hi.res)/.test(hay)) return 'Lossless'
  return ''
}

// ─── Player config ────────────────────────────────────────────────────────────
const HA_PLAYERS = [
  { id: 'media_player.volumio',                          name: 'Volumio'      },
  { id: 'media_player.living_room',                      name: 'Living Room'  },
  { id: 'media_player.bobby',                            name: 'Bobby'        },
  { id: 'media_player.laundry',                          name: 'Laundry'      },
  { id: 'media_player.esp32_s3_automations_speaker',     name: 'Automations'  },
]

// Supported features bitmask
const SF = { PREV: 16, NEXT: 32, SEEK: 2, MUTE: 8, SHUFFLE: 4096, REPEAT: 32768, VOLUME: 4 }

// ─── Network Browser sub-component ───────────────────────────────────────────
function NetworkBrowser({ onAdd }: { onAdd: (files: {name:string;url:string;path:string}[]) => void }) {
  const [path,     setPath]     = useState<string | null>(null)
  const [contents, setContents] = useState<{parent:string|null;folders:{name:string;path:string}[];files:{name:string;path:string}[]} | null>(null)
  const [loading,  setLoading]  = useState(false)
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const browse = useCallback(async (p: string | null) => {
    setLoading(true)
    try {
      const url = p
        ? `${API_BASE}/api/music/browse?path=${encodeURIComponent(p)}`
        : `${API_BASE}/api/music/browse`
      const r = await fetch(url)
      const d = await r.json()
      setContents(d); setPath(d.current); setSelected(new Set())
    } catch { /* ignore */ }
    setLoading(false)
  }, [])

  useEffect(() => { browse(null) }, [browse])

  const toggle = (p: string) => setSelected(prev => {
    const n = new Set(prev); n.has(p) ? n.delete(p) : n.add(p); return n
  })

  const addSelected = () => {
    if (!contents) return
    onAdd(contents.files
      .filter(f => selected.has(f.path))
      .map(f => ({ name: f.name, url: `${API_BASE}/api/music/stream?file=${encodeURIComponent(f.path)}`, path: f.path })))
    setSelected(new Set())
  }

  const addAll = async () => {
    if (!path) return
    const r = await fetch(`${API_BASE}/api/music/folder-files?path=${encodeURIComponent(path)}`)
    const d = await r.json()
    onAdd(d.files.map((f: {name:string;path:string}) => ({
      name: f.name,
      url: `${API_BASE}/api/music/stream?file=${encodeURIComponent(f.path)}`,
      path: f.path,
    })))
  }

  const folderName = path ? path.split('/').filter(Boolean).pop() : 'Music'

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[9px] font-bold uppercase tracking-widest text-[var(--neon-cyan)] truncate max-w-[120px]">
          📁 {folderName}
        </span>
        {selected.size > 0 && (
          <button onClick={addSelected}
            className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/20 transition">
            + Add {selected.size}
          </button>
        )}
        <button onClick={addAll}
          className="px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider border border-[var(--neon-lime)]/40 bg-[var(--neon-lime)]/10 text-[var(--neon-lime)] hover:bg-[var(--neon-lime)]/20 transition">
          + All
        </button>
      </div>

      <div className="flex flex-col gap-0.5 max-h-[120px] overflow-y-auto bg-black/20 rounded-lg border border-border p-1.5">
        {loading && <div className="text-[9px] text-muted-foreground text-center py-2">Loading…</div>}

        {contents?.parent && (
          <div onClick={() => browse(contents.parent)}
            className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-[var(--neon-cyan)]/60 hover:bg-white/5 text-[10px] font-bold">
            📁 ..
          </div>
        )}
        {(contents?.folders || []).map(f => (
          <div key={f.path} onClick={() => browse(f.path)}
            className="flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-[var(--neon-amber)] hover:bg-white/5 text-[10px] truncate">
            📁 {f.name}
          </div>
        ))}
        {(contents?.files || []).map(f => {
          const isSel = selected.has(f.path)
          return (
            <div key={f.path} onClick={() => toggle(f.path)}
              className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-[10px] truncate transition
                ${isSel ? 'bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 text-[var(--neon-cyan)]' : 'text-muted-foreground hover:bg-white/5'}`}>
              <span className="opacity-50 shrink-0">♪</span>
              <span className="flex-1 truncate">{f.name}</span>
              {isSel && <span className="text-[var(--neon-cyan)] shrink-0">✓</span>}
            </div>
          )
        })}
        {!loading && contents && !contents.folders.length && !contents.files.length && (
          <div className="text-[9px] text-muted-foreground text-center py-2">Empty folder</div>
        )}
      </div>
    </div>
  )
}

// ─── Local Player sub-component ───────────────────────────────────────────────
function LocalPlayer() {
  const audioRef      = useRef<HTMLAudioElement>(null)
  const fileInputRef  = useRef<HTMLInputElement>(null)
  const folderInputRef = useRef<HTMLInputElement>(null)

  const [playlist,    setPlaylist]   = useState<{name:string;url:string;path?:string}[]>([])
  const [currentIdx,  setCurrentIdx] = useState(0)
  const [isPlaying,   setIsPlaying]  = useState(false)
  const [position,    setPosition]   = useState(0)
  const [duration,    setDuration]   = useState(0)
  const [volume,      setVolume]     = useState(0.8)
  const [muted,       setMuted]      = useState(false)
  const [shuffle,     setShuffle]    = useState(false)
  const [repeat,      setRepeat]     = useState<'off'|'all'|'one'>('off')
  const [showList,    setShowList]   = useState(false)
  const [subMode,     setSubMode]    = useState<'device'|'network'>('device')

  const current = playlist[currentIdx]

  // Audio events
  useEffect(() => {
    const audio = audioRef.current; if (!audio) return
    const onTime  = () => setPosition(audio.currentTime)
    const onMeta  = () => setDuration(audio.duration || 0)
    const onPlay  = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)
    const onEnd   = () => handleEnded()
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('loadedmetadata', onMeta)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnd)
    return () => {
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('loadedmetadata', onMeta)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnd)
    }
  }, [playlist])

  useEffect(() => {
    const audio = audioRef.current; if (!audio || !current) return
    audio.src = current.url; audio.load()
    if (isPlaying) audio.play().catch(() => {})
  }, [currentIdx, current])

  useEffect(() => {
    if (audioRef.current) { audioRef.current.volume = volume; audioRef.current.muted = muted }
  }, [volume, muted])

  const getNextIdx = (dir = 1) => {
    if (!playlist.length) return null
    if (shuffle) {
      const avail = playlist.map((_,i) => i).filter(i => i !== currentIdx)
      if (!avail.length) return repeat === 'all' ? currentIdx : null
      return avail[Math.floor(Math.random() * avail.length)]
    }
    const next = currentIdx + dir
    if (next >= playlist.length) return repeat === 'all' ? 0 : null
    if (next < 0) return repeat === 'all' ? playlist.length - 1 : null
    return next
  }

  const handleEnded = () => {
    if (repeat === 'one') { audioRef.current?.play().catch(() => {}); return }
    const next = getNextIdx(); if (next !== null) playTrack(next); else setIsPlaying(false)
  }

  const playTrack = (idx: number) => {
    setCurrentIdx(idx); setIsPlaying(true)
    setTimeout(() => audioRef.current?.play().catch(() => {}), 50)
  }

  const togglePlay = () => {
    if (!current) return
    if (isPlaying) audioRef.current?.pause()
    else audioRef.current?.play().catch(() => {})
  }

  const addFiles = (files: FileList | null) => {
    if (!files) return
    const tracks = Array.from(files)
      .filter(f => f.type.startsWith('audio/') || /\.(mp3|flac|wav|ogg|aac|m4a)$/i.test(f.name))
      .map(f => ({ name: f.name.replace(/\.[^/.]+$/, ''), url: URL.createObjectURL(f) }))
    if (!tracks.length) return
    setPlaylist(prev => {
      const names = new Set(prev.map(p => p.name))
      return [...prev, ...tracks.filter(t => !names.has(t.name))]
    })
    setShowList(true)
  }

  const addNetworkFiles = (files: {name:string;url:string;path:string}[]) => {
    setPlaylist(prev => {
      const paths = new Set(prev.map(p => p.path || p.name))
      return [...prev, ...files.filter(f => !paths.has(f.path || f.name))]
    })
    setShowList(true); setSubMode('device')
  }

  const removeTrack = (idx: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setPlaylist(prev => prev.filter((_,i) => i !== idx))
    if (idx === currentIdx && idx >= playlist.length - 1) setCurrentIdx(Math.max(0, idx - 1))
  }

  const cycleRepeat = () => setRepeat(r => r === 'off' ? 'all' : r === 'all' ? 'one' : 'off')
  const repeatIcon  = repeat === 'one' ? <Repeat1 className="h-3.5 w-3.5" /> : <Repeat className="h-3.5 w-3.5" />

  return (
    <div className="flex flex-col gap-2 flex-1">
      <audio ref={audioRef} preload="metadata" />
      <input ref={fileInputRef} type="file" accept="audio/*" multiple hidden onChange={e => addFiles(e.target.files)} />
      <input ref={folderInputRef} type="file" accept="audio/*" multiple hidden
        {...{ webkitdirectory: '', directory: '' } as Record<string,string>}
        onChange={e => addFiles(e.target.files)} />

      {/* Sub-mode tabs */}
      <div className="flex items-center gap-1.5">
        <div className="flex rounded-lg overflow-hidden border border-border">
          <button onClick={() => setSubMode('device')}
            className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition
              ${subMode === 'device' ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]' : 'bg-white/5 text-muted-foreground'}`}>
            <Music className="h-3 w-3" />
          </button>
          <button onClick={() => setSubMode('network')}
            className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition
              ${subMode === 'network' ? 'bg-[var(--neon-lime)]/20 text-[var(--neon-lime)]' : 'bg-white/5 text-muted-foreground'}`}>
            <Network className="h-3 w-3" />
          </button>
        </div>
        {subMode === 'device' && <>
          <button onClick={() => fileInputRef.current?.click()}
            className="px-2 py-1 rounded text-[9px] font-bold uppercase border border-[var(--neon-cyan)]/40 bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)] hover:bg-[var(--neon-cyan)]/20 transition">
            + Songs
          </button>
          <button onClick={() => folderInputRef.current?.click()}
            className="px-2 py-1 rounded text-[9px] font-bold uppercase border border-[var(--neon-lime)]/40 bg-[var(--neon-lime)]/10 text-[var(--neon-lime)] hover:bg-[var(--neon-lime)]/20 transition">
            <FolderOpen className="h-3 w-3" />
          </button>
          {playlist.length > 0 && (
            <button onClick={() => setShowList(s => !s)}
              className="px-2 py-1 rounded text-[9px] font-bold uppercase border border-[var(--neon-amber)]/40 bg-[var(--neon-amber)]/10 text-[var(--neon-amber)] hover:bg-[var(--neon-amber)]/20 transition ml-auto">
              <List className="h-3 w-3" />
            </button>
          )}
        </>}
      </div>

      {/* Network Browser */}
      {subMode === 'network' && <NetworkBrowser onAdd={addNetworkFiles} />}

      {/* Playlist */}
      {subMode === 'device' && showList && playlist.length > 0 && (
        <div className="flex flex-col gap-0.5 max-h-[90px] overflow-y-auto bg-black/20 rounded-lg border border-border p-1.5">
          {playlist.map((t, i) => (
            <div key={i} onClick={() => playTrack(i)}
              className={`flex items-center gap-2 px-2 py-1 rounded cursor-pointer text-[10px] transition
                ${i === currentIdx ? 'bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/30 text-[var(--neon-cyan)]' : 'text-muted-foreground hover:bg-white/5'}`}>
              <span className="text-[9px] min-w-[14px]">{i === currentIdx && isPlaying ? '▶' : i + 1}</span>
              <span className="flex-1 truncate">{t.name}</span>
              <button onClick={e => removeTrack(i, e)} className="text-muted-foreground/50 hover:text-red-400 transition shrink-0">
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Track info */}
      <div className="text-center">
        <div className="text-[11px] font-bold truncate">{current?.name || 'No file loaded'}</div>
        <div className="text-[9px] text-muted-foreground">{playlist.length ? `${playlist.length} track${playlist.length > 1 ? 's' : ''}` : 'Add files to play'}</div>
      </div>

      {/* Progress */}
      {current && (
        <div>
          <div className="flex justify-between mb-1">
            <span className="text-[9px] digit-font text-muted-foreground">{fmt(position)}</span>
            <span className="text-[9px] digit-font text-muted-foreground">{fmt(duration)}</span>
          </div>
          <div className="h-1 rounded-full bg-white/5 overflow-hidden relative">
            <div className="h-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)]" style={{ width: `${duration > 0 ? (position / duration) * 100 : 0}%` }} />
            <input type="range" min={0} max={duration || 0} step="0.1" value={position}
              onChange={e => { const t = parseFloat(e.target.value); setPosition(t); if (audioRef.current) audioRef.current.currentTime = t }}
              className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
          </div>
        </div>
      )}

      {/* Controls */}
      <div className="flex items-center justify-center gap-2">
        <button onClick={() => setShuffle(s => !s)}
          className={`h-8 w-8 rounded-xl border flex items-center justify-center transition
            ${shuffle ? 'border-[var(--neon-cyan)]/60 text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10' : 'border-border bg-white/5 text-muted-foreground'}`}>
          <Shuffle className="h-3 w-3" />
        </button>
        <button onClick={() => { const idx = getNextIdx(-1); if (idx !== null) playTrack(idx) }} disabled={!current}
          className="h-8 w-8 rounded-xl border border-border bg-white/5 flex items-center justify-center disabled:opacity-30 hover:border-primary/70 transition text-muted-foreground">
          <SkipBack className="h-3.5 w-3.5" />
        </button>
        <button onClick={togglePlay} disabled={!current}
          className="h-10 w-10 rounded-xl border border-primary/60 bg-primary/15 flex items-center justify-center disabled:opacity-30 hover:border-primary transition">
          {isPlaying ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary" />}
        </button>
        <button onClick={() => { const idx = getNextIdx(1); if (idx !== null) playTrack(idx) }} disabled={!current}
          className="h-8 w-8 rounded-xl border border-border bg-white/5 flex items-center justify-center disabled:opacity-30 hover:border-primary/70 transition text-muted-foreground">
          <SkipForward className="h-3.5 w-3.5" />
        </button>
        <button onClick={cycleRepeat}
          className={`h-8 w-8 rounded-xl border flex items-center justify-center transition
            ${repeat !== 'off' ? 'border-[var(--neon-cyan)]/60 text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10' : 'border-border bg-white/5 text-muted-foreground'}`}>
          {repeatIcon}
        </button>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-2 mt-auto">
        <button onClick={() => setMuted(m => !m)}>
          {muted ? <VolumeX className="h-3.5 w-3.5 text-muted-foreground" /> : <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />}
        </button>
        <input type="range" min={0} max={1} step="0.02" value={muted ? 0 : volume}
          onChange={e => { setVolume(parseFloat(e.target.value)); setMuted(false) }}
          className="flex-1 accent-primary cursor-pointer h-1" />
        <span className="text-[9px] digit-font text-[var(--neon-cyan)] w-8 text-right">{Math.round((muted ? 0 : volume) * 100)}%</span>
      </div>
    </div>
  )
}

// ─── Main MediaCard ───────────────────────────────────────────────────────────
export function MediaCard() {
  const { getState, optimisticUpdate } = useHA()

  const [sourceMode,    setSourceMode]    = useState<'ha'|'local'>('ha')
  const [activeIdx,     setActiveIdx]     = useState(0)
  const [dropdownOpen,  setDropdownOpen]  = useState(false)

  const active = HA_PLAYERS[activeIdx] || HA_PLAYERS[0]
  const player = getState(active.id)
  const attrs  = (player?.attributes || {}) as Record<string, unknown>
  const sf     = (attrs.supported_features as number) || 0

  const state     = player?.state || 'idle'
  const isPlaying = state === 'playing'
  const isOff     = state === 'off' || state === 'unavailable'
  const title     = (attrs.media_title   as string) || (isOff ? 'Offline' : state === 'idle' ? 'Idle' : 'Nothing playing')
  const artist    = (attrs.media_artist  as string) || active.name
  const album     = (attrs.media_album_name as string) || ''
  const volume    = (attrs.volume_level  as number) ?? 0.35
  const isMuted   = (attrs.is_volume_muted as boolean) || false
  const position  = (attrs.media_position as number) || 0
  const duration  = (attrs.media_duration as number) || 0
  const shuffle   = (attrs.shuffle       as boolean) || false
  const repeat    = (attrs.repeat        as string)  || 'off'
  const imgUrl    = resolveArtUrl(attrs)
  const badge     = qualityBadge(attrs)
  const progress  = duration > 0 ? Math.min(100, (position / duration) * 100) : 0

  const canPrev    = !!(sf & SF.PREV)
  const canNext    = !!(sf & SF.NEXT)
  const canSeek    = !!(sf & SF.SEEK)
  const canMute    = !!(sf & SF.MUTE)
  const canShuffle = !!(sf & SF.SHUFFLE)
  const canRepeat  = !!(sf & SF.REPEAT)

  const call = (service: string, extra: Record<string, unknown> = {}) =>
    haService.callService('media_player', service, { entity_id: active.id, ...extra }).catch(console.error)

  const handleVolume = (v: number) => {
    optimisticUpdate(active.id, { attributes: { ...attrs, volume_level: v } as Record<string,unknown> })
    call('volume_set', { volume_level: v })
  }

  const handleSeek = (v: number) => {
    optimisticUpdate(active.id, { attributes: { ...attrs, media_position: v } as Record<string,unknown> })
    call('media_seek', { seek_position: v })
  }

  const repeatIcon = repeat === 'one'
    ? <Repeat1 className="h-3.5 w-3.5" />
    : <Repeat className="h-3.5 w-3.5" />

  const cycleRepeat = () => {
    const n = repeat === 'off' ? 'all' : repeat === 'all' ? 'one' : 'off'
    call('repeat_set', { repeat: n })
  }

  const stateColor = isPlaying ? 'bg-[var(--neon-lime)]' : isOff ? 'bg-red-500/60' : 'bg-muted-foreground'

  return (
    <div className="glass-panel p-3 flex flex-col h-full relative">

      {/* Header */}
      <div className="flex items-center justify-between mb-2 shrink-0">
        <div className="flex items-center gap-1.5">
          {/* Source toggle */}
          <div className="flex rounded-lg overflow-hidden border border-border">
            <button onClick={() => setSourceMode('ha')}
              className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition
                ${sourceMode === 'ha' ? 'bg-[var(--neon-cyan)]/20 text-[var(--neon-cyan)]' : 'bg-white/5 text-muted-foreground'}`}>
              🏠 HA
            </button>
            <button onClick={() => setSourceMode('local')}
              className={`px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider transition
                ${sourceMode === 'local' ? 'bg-[var(--neon-lime)]/20 text-[var(--neon-lime)]' : 'bg-white/5 text-muted-foreground'}`}>
              🎵 Local
            </button>
          </div>

          {/* Player selector — HA mode only */}
          {sourceMode === 'ha' && (
            <button onClick={() => setDropdownOpen(o => !o)}
              className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/5 border border-border hover:border-primary/40 transition">
              <span className="text-[10px] font-bold tracking-[0.12em] neon-text">{active.name}</span>
              {dropdownOpen ? <ChevronUp className="h-3 w-3 text-muted-foreground" /> : <ChevronDown className="h-3 w-3 text-muted-foreground" />}
            </button>
          )}
          {sourceMode === 'local' && (
            <span className="text-[10px] font-bold tracking-[0.12em] text-[var(--neon-lime)]">Local Files</span>
          )}
        </div>

        {sourceMode === 'ha' && (
          <div className="flex items-center gap-1.5">
            {badge && <span className="text-[8px] font-bold px-1.5 py-0.5 rounded border border-[var(--neon-amber)]/40 bg-[var(--neon-amber)]/10 text-[var(--neon-amber)]">{badge}</span>}
            <span className="text-[9px] digit-font text-muted-foreground flex items-center gap-1">
              <span className={`h-1.5 w-1.5 rounded-full ${stateColor}`} />
              {state.toUpperCase()}
            </span>
          </div>
        )}
      </div>

      {/* Player dropdown */}
      {sourceMode === 'ha' && dropdownOpen && (
        <div className="absolute top-10 left-3 right-3 z-50 bg-background/95 border border-[var(--neon-cyan)]/20 rounded-xl p-1.5 backdrop-blur-xl shadow-2xl">
          {HA_PLAYERS.map((p, idx) => {
            const ps = getState(p.id)
            const pState = ps?.state || 'unavailable'
            const isActive = pState === 'playing'
            return (
              <div key={p.id} onClick={() => { setActiveIdx(idx); setDropdownOpen(false) }}
                className={`flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer transition
                  ${idx === activeIdx ? 'bg-[var(--neon-cyan)]/10 text-[var(--neon-cyan)]' : 'text-muted-foreground hover:bg-white/5'}`}>
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-[var(--neon-lime)]' : 'bg-muted-foreground/30'}`} />
                  <span className="text-[11px] font-bold">{p.name}</span>
                </div>
                <span className="text-[9px] opacity-50">{p.id.replace('media_player.', '')}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* LOCAL MODE */}
      {sourceMode === 'local' && <LocalPlayer />}

      {/* HA MODE */}
      {sourceMode === 'ha' && <>
        {/* Album art + track info */}
        <div className="flex gap-3 mb-2 shrink-0">
          <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-primary/30 shrink-0 bg-white/5 flex items-center justify-center">
            {imgUrl
              ? <img src={imgUrl} alt="album" className="w-full h-full object-cover" />
              : <span className="text-2xl">{isOff ? '🔇' : isPlaying ? '🎵' : '⏸'}</span>
            }
            {isPlaying && !imgUrl && (
              <div className="absolute inset-0 rounded-lg border-2 border-[var(--neon-cyan)]/30 animate-pulse" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-foreground truncate">{title}</div>
            <div className="text-[10px] uppercase tracking-widest text-[var(--neon-cyan)] mt-0.5 truncate">{artist}</div>
            {album && <div className="text-[9px] text-muted-foreground mt-0.5 truncate">{album}</div>}
          </div>
        </div>

        {/* Progress */}
        {duration > 0 && (
          <div className="mb-2 shrink-0">
            <div className="flex justify-between mb-1">
              <span className="text-[9px] digit-font text-muted-foreground">{fmt(position)}</span>
              <span className="text-[9px] digit-font text-muted-foreground">{fmt(duration)}</span>
            </div>
            <div className="h-1 rounded-full bg-white/5 overflow-hidden relative">
              <div className="h-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)]" style={{ width: `${progress}%` }} />
              {canSeek && (
                <input type="range" min={0} max={duration} value={position}
                  onChange={e => handleSeek(parseFloat(e.target.value))}
                  className="absolute inset-0 w-full opacity-0 cursor-pointer h-full" />
              )}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex items-center justify-center gap-2 mb-2 shrink-0">
          {canShuffle && (
            <button onClick={() => call('shuffle_set', { shuffle: !shuffle })}
              className={`h-8 w-8 rounded-xl border flex items-center justify-center transition
                ${shuffle ? 'border-[var(--neon-cyan)]/60 text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10' : 'border-border bg-white/5 text-muted-foreground'}`}>
              <Shuffle className="h-3 w-3" />
            </button>
          )}
          <button onClick={() => call('media_previous_track')} disabled={!canPrev || isOff}
            className="h-8 w-8 rounded-xl border border-border bg-white/5 flex items-center justify-center disabled:opacity-30 hover:border-primary/70 transition text-muted-foreground">
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          <button onClick={() => call(isPlaying ? 'media_pause' : 'media_play')} disabled={isOff}
            className="h-10 w-10 rounded-xl border border-primary/60 bg-primary/15 flex items-center justify-center disabled:opacity-30 hover:border-primary transition">
            {isPlaying ? <Pause className="h-4 w-4 text-primary" /> : <Play className="h-4 w-4 text-primary" />}
          </button>
          <button onClick={() => call('media_next_track')} disabled={!canNext || isOff}
            className="h-8 w-8 rounded-xl border border-border bg-white/5 flex items-center justify-center disabled:opacity-30 hover:border-primary/70 transition text-muted-foreground">
            <SkipForward className="h-3.5 w-3.5" />
          </button>
          {canRepeat && (
            <button onClick={cycleRepeat}
              className={`h-8 w-8 rounded-xl border flex items-center justify-center transition
                ${repeat !== 'off' ? 'border-[var(--neon-cyan)]/60 text-[var(--neon-cyan)] bg-[var(--neon-cyan)]/10' : 'border-border bg-white/5 text-muted-foreground'}`}>
              {repeatIcon}
            </button>
          )}
        </div>

        {/* Volume */}
        <div className="flex items-center gap-2 mt-auto shrink-0">
          <button onClick={() => { if (canMute) call('volume_mute', { is_volume_muted: !isMuted }) }}>
            {isMuted
              ? <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
              : <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />}
          </button>
          <input type="range" min={0} max={1} step="0.02" value={isMuted ? 0 : volume}
            onChange={e => handleVolume(parseFloat(e.target.value))}
            className="flex-1 accent-primary cursor-pointer h-1" />
          <span className="text-[9px] digit-font text-[var(--neon-cyan)] w-8 text-right">
            {Math.round((isMuted ? 0 : volume) * 100)}%
          </span>
        </div>
      </>}
    </div>
  )
}
import { Volume2, SkipBack, SkipForward, Play, Pause, Shuffle, Repeat } from 'lucide-react'
import { useHA } from '../../hooks/useHA'
import { haService } from '../../services/haService'

export function MediaCard() {
  const { getState, optimisticUpdate } = useHA()
  const player = getState('media_player.volumio')
  const attrs  = (player?.attributes || {}) as Record<string, unknown>

  const state     = player?.state || 'idle'
  const isPlaying = state === 'playing'
  const title     = (attrs.media_title as string)      || 'No Track'
  const artist    = (attrs.media_artist as string)     || '—'
  const album     = (attrs.media_album_name as string) || '—'
  const volume    = Math.round(((attrs.volume_level as number) || 0) * 100)
  const position  = (attrs.media_position as number)   || 0
  const duration  = (attrs.media_duration as number)   || 1
  const imgUrl    = (attrs.entity_picture as string)   || null
  const progress  = Math.min(100, (position / duration) * 100)

  const fmt = (s: number) => `${Math.floor(s/60)}:${Math.floor(s%60).toString().padStart(2,'0')}`

  const press = (service: string, newState?: string) => {
    if (newState) optimisticUpdate('media_player.volumio', { state: newState })
    haService.callService('media_player', service, { entity_id: 'media_player.volumio' }).catch(console.error)
  }

  const setVol = (v: number) => {
    optimisticUpdate('media_player.volumio', {
      attributes: { ...attrs, volume_level: v / 100 } as Record<string,unknown>
    })
    haService.callService('media_player', 'volume_set', {
      entity_id: 'media_player.volumio', volume_level: v / 100
    }).catch(console.error)
  }

  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[9px] digit-font bg-[var(--neon-amber)]/15 border border-[var(--neon-amber)]/40 text-[var(--neon-amber)]">HA</span>
          <span className="px-2 py-0.5 rounded text-[9px] digit-font bg-white/5 border border-border text-muted-foreground">LOCAL</span>
          <span className="text-sm font-bold tracking-[0.15em] neon-text ml-1">VOLUMIO</span>
        </div>
        <span className="text-[10px] digit-font text-muted-foreground flex items-center gap-1.5">
          <span className={`h-1.5 w-1.5 rounded-full ${isPlaying ? 'bg-[var(--neon-lime)]' : 'bg-muted-foreground'}`} />
          {state.toUpperCase()}
        </span>
      </div>

      <div className="flex gap-3 mb-3">
        <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-primary/30 shrink-0 bg-white/5 flex items-center justify-center">
          {imgUrl
            ? <img src={`http://192.168.1.8:8123${imgUrl}`} alt="album" className="w-full h-full object-cover" />
            : <span className="text-3xl">🎵</span>
          }
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-foreground truncate">{title}</div>
          <div className="text-[11px] uppercase tracking-widest text-[var(--neon-cyan)] mt-1 truncate">{artist}</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{album}</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] digit-font text-muted-foreground">{fmt(position)}</span>
          <span className="text-[9px] digit-font text-muted-foreground">{fmt(duration)}</span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)]" style={{ width: `${progress}%` }} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-3">
        <button onClick={() => press('shuffle_set')} className="h-9 w-9 bg-white/5 border border-border rounded-xl flex items-center justify-center hover:border-primary/70 transition">
          <Shuffle className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => press('media_previous_track')} className="h-9 w-9 bg-white/5 border border-border rounded-xl flex items-center justify-center hover:border-primary/70 transition">
          <SkipBack className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => press(isPlaying ? 'media_pause' : 'media_play', isPlaying ? 'paused' : 'playing')}
          className="h-11 w-11 bg-primary/15 border border-primary/60 rounded-xl flex items-center justify-center hover:border-primary transition">
          {isPlaying ? <Pause className="h-5 w-5 text-primary" /> : <Play className="h-5 w-5 text-primary" />}
        </button>
        <button onClick={() => press('media_next_track')} className="h-9 w-9 bg-white/5 border border-border rounded-xl flex items-center justify-center hover:border-primary/70 transition">
          <SkipForward className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <button onClick={() => press('repeat_set')} className="h-9 w-9 bg-white/5 border border-border rounded-xl flex items-center justify-center hover:border-primary/70 transition">
          <Repeat className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
        <input type="range" min={0} max={100} value={volume}
          onChange={e => setVol(Number(e.target.value))}
          className="flex-1 accent-primary cursor-pointer h-1" />
        <span className="text-[9px] digit-font text-[var(--neon-cyan)] w-8 text-right">{volume}%</span>
      </div>
    </div>
  )
}

import { useState, useEffect, useRef } from 'react'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'

const DEFAULT_CHANNELS = [
  { id:1, name:'TLC', category:'Live', isDefault:true, hidden:false,
    url:'https://dlstreams.com/casting/stream-337.php',
    logo:'https://upload.wikimedia.org/wikipedia/commons/thumb/0/0e/TLC_2022.svg/200px-TLC_2022.svg.png'
  },
]

const isDirectStream = (url: string) => url && (
  url.includes('.m3u8') || url.includes('.mp4') ||
  url.includes('.ts')   || url.includes('/hls/') ||
  (url.includes('/live/') && url.includes('playlist'))
)

export default function LiveTVCard() {
  const [channels,   setChannels]   = useState(DEFAULT_CHANNELS)
  const [activeIdx,  setActiveIdx]  = useState(0)
  const [menuOpen,   setMenuOpen]   = useState(false)
  const [reloadKey,  setReloadKey]  = useState(0)
  const [error,      setError]      = useState(false)
  const [playing,    setPlaying]    = useState(false)
  const [disabled,   setDisabled]   = useState(false)
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    fetch(`${API_BASE}/api/tv-settings`).then(r=>r.json())
      .then(d => { if (d) setDisabled(!!d.disabled) }).catch(()=>{})
    fetch(`${API_BASE}/api/tv-channels`).then(r=>r.json())
      .then(d => {
        if (Array.isArray(d) && d.length > 0) {
          setChannels(d)
          const def = d.findIndex((c:any) => c.isDefault && !c.hidden)
          setActiveIdx(def >= 0 ? def : 0)
        }
      }).catch(()=>{})
  }, [])

  const visible = channels.filter(c => !c.hidden)
  const active  = visible[activeIdx] || visible[0]
  const isDirect = isDirectStream(active?.url)

  const switchChannel = (idx: number) => {
    setActiveIdx(idx); setMenuOpen(false)
    setError(false); setPlaying(false); setReloadKey(k=>k+1)
  }

  if (disabled) return (
    <div className="glass-panel h-full flex flex-col items-center justify-center gap-3">
      <div className="text-4xl">📺</div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Live TV Disabled</div>
      <div className="text-[9px] text-muted-foreground/50">Enable in Settings → Live TV</div>
    </div>
  )

  return (
    <div className="glass-panel h-full flex flex-col overflow-hidden relative">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-border/30 shrink-0 cursor-pointer"
        onClick={() => setMenuOpen(o=>!o)}>
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"/>
          <span className="text-[9px] font-black uppercase tracking-[0.2em] text-red-400">Live TV</span>
          {active?.logo && <img src={active.logo} alt={active.name} className="h-4 object-contain" onError={e=>(e.currentTarget.style.display='none')}/>}
          <span className="text-[12px] font-black uppercase tracking-wide bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] bg-clip-text text-transparent">{active?.name}</span>
          <span className="text-[9px] text-muted-foreground/40">{menuOpen?'▲':'▼'}</span>
        </div>
        <div className="flex gap-1.5">
          <button className="h-7 w-7 glass-panel rounded-lg flex items-center justify-center text-sm hover:border-primary/60 transition"
            onClick={e=>{e.stopPropagation();setReloadKey(k=>k+1);setError(false);setPlaying(false)}}>🔄</button>
          <button className="h-7 w-7 glass-panel rounded-lg flex items-center justify-center text-sm hover:border-primary/60 transition"
            onClick={e=>{e.stopPropagation();document.getElementById('tv-wrap')?.requestFullscreen?.()}}>⛶</button>
        </div>
      </div>

      {/* Dropdown */}
      {menuOpen && (
        <div className="absolute top-[44px] left-3 right-3 glass-panel z-50 rounded-xl overflow-hidden"
          onClick={e=>e.stopPropagation()}>
          {visible.map((ch,idx) => (
            <div key={ch.id} onClick={()=>switchChannel(idx)}
              className={`flex items-center gap-2 px-3 py-2 cursor-pointer hover:bg-white/5 border-b border-border/10 ${idx===activeIdx?'bg-[var(--neon-cyan)]/10':''}`}>
              {ch.logo && <img src={ch.logo} alt={ch.name} className="h-4 w-8 object-contain" onError={e=>(e.currentTarget.style.display='none')}/>}
              <span className="text-[9px] text-muted-foreground uppercase">{ch.category}</span>
              <span className="text-[11px] font-bold uppercase text-foreground">{ch.name}</span>
              {ch.isDefault && <span className="ml-auto text-[8px] text-[var(--neon-cyan)]/60">DEFAULT</span>}
            </div>
          ))}
        </div>
      )}

      {/* Player */}
      <div className="flex-1 relative bg-black min-h-0" id="tv-wrap">
        {!playing && !error && (
          <button onClick={()=>setPlaying(true)}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-[var(--neon-magenta)] flex items-center justify-center z-10 animate-pulse">
            <span style={{width:0,height:0,borderStyle:'solid',borderWidth:'8px 0 8px 14px',borderColor:'transparent transparent transparent #fff',marginLeft:3}}/>
          </button>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-20 bg-black/90">
            <div className="text-2xl">📡</div>
            <div className="text-[10px] uppercase tracking-widest text-red-400">Stream Unavailable</div>
            <button onClick={()=>{setReloadKey(k=>k+1);setError(false);setPlaying(false)}}
              className="px-3 py-1 rounded-lg border border-red-500/40 text-red-400 text-[10px] uppercase tracking-wider">🔄 Retry</button>
          </div>
        )}
        {playing && !error && (
          isDirect
            ? <video key={active?.url+reloadKey} ref={videoRef} src={active?.url} autoPlay controls
                className="absolute inset-0 w-full h-full" onError={()=>setError(true)}/>
            : <iframe key={active?.url+reloadKey} src={active?.url} allowFullScreen allow="autoplay;fullscreen"
                title={active?.name} className="absolute inset-0 w-full h-full border-0" onError={()=>setError(true)}/>
        )}
        <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black to-transparent pointer-events-none z-5"/>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-1.5 p-2 shrink-0 border-t border-border/20">
        {[
          { label: 'Channel', val: active?.id||'--', color: 'var(--neon-cyan)' },
          { label: 'Quality', val: 'HD',             color: 'var(--neon-lime)' },
          { label: 'Source',  val: active?.category||'DDL', color: 'var(--neon-magenta)' },
        ].map(s => (
          <div key={s.label} className="glass-panel !p-1.5 text-center">
            <div className="text-[7px] uppercase tracking-widest text-muted-foreground">{s.label}</div>
            <div className="digit-font text-[11px] font-black mt-0.5" style={{color:`var(--${s.color})`}}>{s.val}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

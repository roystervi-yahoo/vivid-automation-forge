import { useState, useEffect, useRef } from 'react'
import { Camera, ChevronLeft, ChevronRight, Maximize2, Activity, Gauge } from 'lucide-react'

const API_BASE = import.meta.env.VITE_API_BASE      || 'http://192.168.1.4:3001'
const CAM_URL  = import.meta.env.VITE_GO2RTC_SERVER || 'http://192.168.1.4:1984'

const DEFAULT_CAMERAS = [
  { id:1, name:'Camera 150',  stream:'camera_150',   disabled:false },
  { id:2, name:'Camera 152',  stream:'camera_152',   disabled:false },
  { id:3, name:'Camera 153',  stream:'camera_153',   disabled:false },
  { id:4, name:'Camera 154',  stream:'camera_154',   disabled:false },
  { id:5, name:'Camera 155',  stream:'camera_155',   disabled:false },
  { id:6, name:'Camera 60',   stream:'camera_60',    disabled:false },
  { id:7, name:'Axis M3046',  stream:'camera_m3046', disabled:false },
  { id:8, name:'Axis M3047',  stream:'camera_m3047', disabled:false },
  { id:9, name:'Axis M3048',  stream:'camera_m3048', disabled:false },
]

export function CameraCard() {
  const [cameras,       setCameras]       = useState(DEFAULT_CAMERAS)
  const [camUrl,        setCamUrl]        = useState(CAM_URL)
  const [idx,           setIdx]           = useState(0)
  const [disabled,      setDisabled]      = useState(false)
  const [autoAdvance,   setAutoAdvance]   = useState(true)
  const [interval,      setInterval_]     = useState(8000)
  const [connected,     setConnected]     = useState(false)
  const [error,         setError]         = useState(false)
  const [loading,       setLoading]       = useState(true)
  const [ts,            setTs]            = useState(Date.now())

  const imgRef    = useRef<HTMLImageElement>(null)
  const frameRef  = useRef<HTMLDivElement>(null)
  const timerRef  = useRef<any>(null)
  const advRef    = useRef<any>(null)

  const active = cameras.filter(c => !c.disabled)
  const cam    = active[idx] || active[0]

  // Load settings
  useEffect(() => {
    fetch(`${API_BASE}/api/camera-settings`).then(r => r.json()).then(d => {
      if (d.cameras)   setCameras(d.cameras)
      if (d.url)       setCamUrl(d.url)
      if (d.disabled)  setDisabled(d.disabled)
      if (d.autoAdvance !== undefined) setAutoAdvance(d.autoAdvance)
      if (d.interval)  setInterval_(d.interval)
    }).catch(() => {})
  }, [])

  // MJPEG polling
  useEffect(() => {
    if (!cam) return
    setLoading(true); setError(false)
    if (timerRef.current) clearInterval(timerRef.current)
    const stream = cam.stream
    const base   = `${camUrl}/api/frame.jpeg?src=${stream}`
    setTs(Date.now())
    timerRef.current = setInterval(() => setTs(Date.now()), 500)
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [cam?.stream, camUrl])

  // Auto-advance
  useEffect(() => {
    if (advRef.current) clearInterval(advRef.current)
    if (!autoAdvance) return
    advRef.current = setInterval(() => {
      setIdx(prev => {
        const a = cameras.filter(c => !c.disabled)
        return a.length > 1 ? (prev + 1) % a.length : prev
      })
    }, interval)
    return () => { if (advRef.current) clearInterval(advRef.current) }
  }, [autoAdvance, interval, cameras])

  const goTo = (newIdx: number) => {
    const a = cameras.filter(c => !c.disabled)
    if (!a.length) return
    const safe = ((newIdx % a.length) + a.length) % a.length
    setIdx(safe)
    // Reset auto-advance timer
    if (advRef.current) clearInterval(advRef.current)
    if (autoAdvance) {
      advRef.current = setInterval(() => {
        setIdx(prev => {
          const aa = cameras.filter(c => !c.disabled)
          return aa.length > 1 ? (prev + 1) % aa.length : prev
        })
      }, interval)
    }
  }

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) frameRef.current?.requestFullscreen().catch(() => {})
    else document.exitFullscreen().catch(() => {})
  }

  if (disabled) return (
    <div className="glass-panel p-3 flex flex-col h-full items-center justify-center gap-3">
      <Camera className="h-8 w-8 text-muted-foreground/40" />
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Camera Disabled</div>
    </div>
  )

  const src = cam ? `${camUrl}/api/frame.jpeg?src=${cam.stream}&_=${ts}` : ''

  return (
    <div className="glass-panel p-3 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Camera className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase neon-text">Live Feed</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-destructive/40 bg-destructive/10">
          <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
          <span className="digit-font text-[9px] text-red-400">LIVE</span>
        </div>
      </div>

      <div ref={frameRef} className="relative flex-1 rounded-lg overflow-hidden border border-primary/30 min-h-0 bg-black/40">
        <div className="scanline" />
        {['top-1.5 left-1.5 border-t border-l','top-1.5 right-1.5 border-t border-r',
          'bottom-1.5 left-1.5 border-b border-l','bottom-1.5 right-1.5 border-b border-r'].map((c,i) => (
          <div key={i} className={`absolute ${c} border-primary w-4 h-4`} />
        ))}
        {loading && !error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10">
            <div className="h-8 w-8 rounded-full border-2 border-primary/20 border-t-primary animate-spin" />
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Connecting...</span>
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 z-10">
            <Camera className="h-8 w-8 text-muted-foreground/40" />
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--neon-amber)]">Feed Interrupted</span>
          </div>
        )}
        <img ref={imgRef} src={src} alt={cam?.name || 'Camera'}
          className="w-full h-full object-cover"
          onLoad={() => { setConnected(true); setLoading(false); setError(false) }}
          onError={() => { setConnected(false); setError(true) }}
          style={{ display: error ? 'none' : 'block' }}
        />
      </div>

      <div className="flex items-center justify-between mt-2 gap-2">
        <button onClick={() => goTo(idx - 1)}
          className="h-8 w-8 rounded-full bg-black/40 border border-primary/40 flex items-center justify-center hover:border-primary transition">
          <ChevronLeft className="h-3.5 w-3.5 text-primary" />
        </button>
        <span className="digit-font text-[10px] text-foreground/80 px-2 py-1 rounded bg-black/30 border border-primary/30">
          {cam?.name || '—'} · {idx + 1}/{active.length}
        </span>
        <div className="flex gap-1.5">
          <button onClick={() => goTo(idx + 1)}
            className="h-8 w-8 rounded-full bg-black/40 border border-primary/40 flex items-center justify-center hover:border-primary transition">
            <ChevronRight className="h-3.5 w-3.5 text-primary" />
          </button>
          <button onClick={toggleFullscreen}
            className="h-8 w-8 rounded-full bg-black/40 border border-primary/40 flex items-center justify-center hover:border-primary transition">
            <Maximize2 className="h-3.5 w-3.5 text-primary" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="device-tile !p-2">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-[var(--neon-lime)]" />
            <div>
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Status</div>
              <div className="text-[10px] digit-font">{connected ? 'Connected' : 'Searching'}</div>
            </div>
          </div>
        </div>
        <div className="device-tile !p-2">
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
            <div>
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Interval</div>
              <div className="text-[10px] digit-font">{interval / 1000}s</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

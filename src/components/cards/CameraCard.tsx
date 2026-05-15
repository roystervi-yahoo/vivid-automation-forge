import { Camera, ChevronLeft, ChevronRight, Maximize2, Activity, Gauge } from 'lucide-react'

const GO2RTC = import.meta.env.VITE_GO2RTC_SERVER || 'http://192.168.1.4:1984'

export function CameraCard() {
  return (
    <div className="glass-panel p-4 flex flex-col h-full">
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

      <div className="relative flex-1 rounded-lg overflow-hidden border border-primary/30 min-h-0 bg-black/40">
        <img
          src={`${GO2RTC}/api/frame.jpeg?src=Axis_M3047`}
          alt="Live camera feed"
          className="w-full h-full object-cover"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
        />
        <div className="scanline" />
        {['top-1.5 left-1.5 border-t border-l','top-1.5 right-1.5 border-t border-r','bottom-1.5 left-1.5 border-b border-l','bottom-1.5 right-1.5 border-b border-r'].map((c, i) => (
          <div key={i} className={`absolute ${c} border-primary w-4 h-4`} />
        ))}
      </div>

      <div className="flex items-center justify-between mt-2 gap-2">
        <button className="h-8 w-8 rounded-full bg-black/40 border border-primary/40 flex items-center justify-center hover:border-primary">
          <ChevronLeft className="h-3.5 w-3.5 text-primary" />
        </button>
        <span className="digit-font text-[10px] text-foreground/80 px-2 py-1 rounded bg-black/30 border border-primary/30">Axis M3047 · 8/9</span>
        <div className="flex gap-1.5">
          <button className="h-8 w-8 rounded-full bg-black/40 border border-primary/40 flex items-center justify-center hover:border-primary"><ChevronRight className="h-3.5 w-3.5 text-primary" /></button>
          <button className="h-8 w-8 rounded-full bg-black/40 border border-primary/40 flex items-center justify-center hover:border-primary"><Maximize2 className="h-3.5 w-3.5 text-primary" /></button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 mt-2">
        <div className="device-tile !p-2">
          <div className="flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-[var(--neon-lime)]" />
            <div>
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Connection</div>
              <div className="text-[10px] digit-font">Optimized</div>
            </div>
          </div>
        </div>
        <div className="device-tile !p-2">
          <div className="flex items-center gap-1.5">
            <Gauge className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
            <div>
              <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Interval</div>
              <div className="text-[10px] digit-font">8s</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

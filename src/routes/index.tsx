import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home, Power, Wifi, Battery, Volume2, Maximize2, RefreshCw, Play,
  DoorOpen, Droplets, Shirt, Wind, Flame, Bot, Thermometer, Gauge,
  Camera, Lock, Shield, Car, Lightbulb, Fan, Plus, Snowflake,
  ChevronLeft, ChevronRight, Minus, Settings, Activity, Zap,
  SkipBack, SkipForward, Shuffle, Repeat, Sun,
  Tv, Plane, Globe, Box, Cast, AlertTriangle, ShieldCheck
} from "lucide-react";
import cameraFeed from "@/assets/camera-feed.jpg";
import album from "@/assets/album.jpg";
import { CardCarousel } from "@/components/CardCarousel";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "HA Dash — Futuristic Smart Home Control" },
      { name: "description", content: "A futuristic 3D home automation dashboard for climate, security, lighting, media and devices." },
    ],
  }),
});

type Status = "on" | "off" | "open" | "offline" | "unavailable";
type Accent = "cyan" | "magenta" | "amber" | "lime" | "violet";

interface Device {
  id: string; name: string; sub?: string; status: Status;
  icon: React.ComponentType<{ className?: string }>; accent?: Accent;
}

const devices: Device[] = [
  { id: "den", name: "Den", sub: "Window", status: "open", icon: DoorOpen, accent: "amber" },
  { id: "recirc", name: "Recirc Pump", status: "on", icon: Droplets, accent: "cyan" },
  { id: "washer", name: "Washer", status: "off", icon: Shirt },
  { id: "dryer", name: "Dryer", status: "offline", icon: Wind },
  { id: "hotwater", name: "Hot Water", status: "offline", icon: Flame },
  { id: "purifier1", name: "Air Purifier", sub: "Living Rm", status: "off", icon: Wind },
  { id: "purifier2", name: "Air Purifier", sub: "Master", status: "off", icon: Wind },
  { id: "vacuum", name: "L10S Vacuum", status: "off", icon: Bot, accent: "lime" },
];

const bottomDevices: Device[] = [
  { id: "denone", name: "Den One", status: "off", icon: Lightbulb },
  { id: "wh", name: "Water Heater", status: "off", icon: Flame, accent: "amber" },
  { id: "denfan", name: "Den Fan", status: "on", icon: Fan, accent: "cyan" },
  { id: "lights", name: "Inside Lights", sub: "100%", status: "on", icon: Lightbulb, accent: "amber" },
  { id: "garage", name: "Garage Door", status: "off", icon: Car },
  { id: "new", name: "New Device", status: "off", icon: Plus },
];

function accentClass(a?: Accent) {
  switch (a) {
    case "cyan": return "text-[var(--neon-cyan)]";
    case "magenta": return "text-[var(--neon-magenta)]";
    case "amber": return "text-[var(--neon-amber)]";
    case "lime": return "text-[var(--neon-lime)]";
    case "violet": return "text-[var(--neon-violet)]";
    default: return "text-muted-foreground";
  }
}

function statusDot(s: Status) {
  if (s === "on" || s === "open") return "pulse-dot";
  if (s === "offline" || s === "unavailable") return "pulse-dot warn";
  return "pulse-dot off";
}

function Tile({ d }: { d: Device }) {
  const Icon = d.icon;
  const active = d.status === "on" || d.status === "open";
  return (
    <button className={`device-tile text-left w-full !p-2.5 ${active ? "active" : ""}`}>
      <div className="flex items-center gap-2">
        <div className={`relative h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${active ? "bg-primary/15" : "bg-white/5"}`}>
          <Icon className={`h-4 w-4 ${active ? accentClass(d.accent) || "text-primary" : "text-muted-foreground"}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.15em] text-foreground/90 truncate font-semibold">{d.name}</div>
          {d.sub && <div className="text-[9px] text-muted-foreground/70 truncate">{d.sub}</div>}
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className={statusDot(d.status)} />
            <span className="digit-font text-[9px] text-foreground/70">{d.status.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const u = () => {
      const d = new Date();
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, "0");
      const ap = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setTime(`${h.toString().padStart(2, "0")}:${m} ${ap}`);
    };
    u(); const t = setInterval(u, 30000); return () => clearInterval(t);
  }, []);
  return (
    <div className="glass-panel px-6 py-2 flex items-center gap-3">
      <div className="pulse-dot" />
      <span className="digit-font text-xl neon-text font-bold">{time || "—"}</span>
    </div>
  );
}

function TBtn({ icon: Icon, danger }: { icon: any; danger?: boolean }) {
  return (
    <button className={`h-9 w-9 glass-panel flex items-center justify-center hover:border-primary/60 transition !rounded-lg`}>
      <Icon className={`h-4 w-4 ${danger ? "text-destructive" : "text-primary"}`} />
    </button>
  );
}

function SectionHeader({ title }: { title: string }) {
  return (
    <div className="flex items-center gap-3 mb-2">
      <h2 className="text-[10px] font-bold tracking-[0.3em] uppercase text-[var(--neon-cyan)]">{title}</h2>
      <div className="h-px flex-1 bg-gradient-to-r from-[var(--neon-cyan)]/60 via-primary/20 to-transparent" />
    </div>
  );
}

function StatTile({ icon: Icon, label, value, unit, accent, footer }: { icon: any; label: string; value: string; unit?: string; accent: Accent; footer?: string }) {
  return (
    <div className="device-tile !p-3 relative">
      <div className="flex items-start justify-between">
        <Icon className={`h-4 w-4 ${accentClass(accent)}`} />
        {footer && <span className="text-[9px] digit-font text-muted-foreground/60 uppercase">{footer}</span>}
      </div>
      <div className="mt-1.5 flex items-baseline gap-1">
        <span className="digit-font text-2xl text-foreground/95 font-bold">{value}</span>
        {unit && <span className="text-[10px] text-muted-foreground digit-font">{unit}</span>}
      </div>
      <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70 mt-0.5">{label}</div>
      <div className={`absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-current to-transparent ${accentClass(accent)} opacity-50`} />
    </div>
  );
}

function DreameTile() {
  return (
    <div className="device-tile !p-3 col-span-2">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full border-2 border-[var(--neon-violet)]/50 flex items-center justify-center bg-[var(--neon-violet)]/10">
          <Bot className="h-5 w-5 text-[var(--neon-violet)]" />
        </div>
        <div className="flex-1">
          <div className="text-[11px] font-bold uppercase tracking-[0.18em] text-foreground/90">Dreame</div>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="pulse-dot warn" />
            <span className="text-[9px] digit-font text-muted-foreground">UNAVAILABLE</span>
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button className="px-2.5 py-1 rounded-md bg-[var(--neon-lime)]/10 border border-[var(--neon-lime)]/40 flex items-center gap-1 hover:bg-[var(--neon-lime)]/20">
            <Play className="h-3 w-3 text-[var(--neon-lime)]" />
            <span className="text-[9px] digit-font text-[var(--neon-lime)]">START</span>
          </button>
          <button className="px-2.5 py-1 rounded-md bg-white/5 border border-border flex items-center gap-1 hover:border-primary/50">
            <Home className="h-3 w-3 text-muted-foreground" />
            <span className="text-[9px] digit-font text-muted-foreground">HOME</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SaraiyahRoom() {
  return (
    <div className="device-tile !p-3 col-span-2 relative">
      <div className="absolute top-2 right-3 flex items-center gap-1.5">
        <span className="pulse-dot" />
        <span className="text-[9px] digit-font text-[var(--neon-lime)]">HOME</span>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-center">
          <div className="text-[10px] uppercase tracking-[0.18em] text-foreground/90 font-bold">Saraiyah</div>
          <div className="digit-font text-2xl text-[var(--neon-amber)] font-bold mt-0.5">28°</div>
          <div className="flex items-center justify-center gap-1 mt-1">
            <button className="h-5 w-5 rounded bg-white/5 border border-border flex items-center justify-center"><Minus className="h-2.5 w-2.5 text-muted-foreground" /></button>
            <span className="text-[9px] digit-font text-muted-foreground">85°</span>
            <button className="h-5 w-5 rounded bg-white/5 border border-border flex items-center justify-center"><Plus className="h-2.5 w-2.5 text-muted-foreground" /></button>
          </div>
        </div>
        <div className="flex-1 grid grid-cols-2 gap-2">
          <div className="rounded-lg bg-white/5 border border-border p-2">
            <div className="flex items-center gap-1.5"><Sun className="h-3 w-3 text-[var(--neon-amber)]" /><span className="text-[9px] uppercase tracking-widest text-muted-foreground">Light</span></div>
            <div className="text-[10px] digit-font text-foreground/80 mt-1">OFF</div>
          </div>
          <div className="rounded-lg bg-white/5 border border-border p-2">
            <div className="flex items-center gap-1.5"><Fan className="h-3 w-3 text-[var(--neon-cyan)]" /><span className="text-[9px] uppercase tracking-widest text-muted-foreground">Fan</span></div>
            <div className="text-[10px] digit-font text-foreground/80 mt-1">OFF</div>
          </div>
        </div>
      </div>
      <div className="absolute left-0 right-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[var(--neon-lime)] to-transparent opacity-60" />
    </div>
  );
}

function Volumio() {
  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded text-[9px] digit-font bg-[var(--neon-amber)]/15 border border-[var(--neon-amber)]/40 text-[var(--neon-amber)]">HA</span>
          <span className="px-2 py-0.5 rounded text-[9px] digit-font bg-white/5 border border-border text-muted-foreground">LOCAL</span>
          <span className="text-sm font-bold tracking-[0.15em] neon-text ml-1">VOLUMIO</span>
        </div>
        <span className="text-[10px] digit-font text-muted-foreground flex items-center gap-1.5"><span className="h-1.5 w-1.5 rounded-full bg-muted-foreground" />PAUSED</span>
      </div>

      <div className="flex gap-3 mb-3">
        <div className="relative h-20 w-20 rounded-lg overflow-hidden border border-primary/30 shrink-0 shadow-[0_0_20px_oklch(0.82_0.16_210/0.25)]">
          <img src={album} alt="album" width={80} height={80} loading="lazy" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-bold text-foreground truncate">Be of Good Courage</div>
          <div className="text-[11px] uppercase tracking-widest text-[var(--neon-cyan)] mt-1 truncate">Terry Ganzie</div>
          <div className="text-[10px] text-muted-foreground mt-0.5 truncate">7 Times Rise Riddim</div>
        </div>
      </div>

      <div className="mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-[9px] digit-font text-muted-foreground">0:03:35</span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full w-[35%] bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] shadow-[0_0_8px_oklch(0.82_0.16_210/0.6)]" />
        </div>
      </div>

      <div className="flex items-center justify-center gap-2 mb-3">
        {[Shuffle, SkipBack, Play, SkipForward, Repeat].map((I, i) => (
          <button key={i} className={`${i === 2 ? "h-11 w-11 bg-primary/15 border-primary/60" : "h-9 w-9 bg-white/5 border-border"} rounded-xl border flex items-center justify-center hover:border-primary/70 transition`}>
            <I className={`${i === 2 ? "h-5 w-5 text-primary" : "h-3.5 w-3.5 text-muted-foreground"}`} />
          </button>
        ))}
      </div>

      <div className="flex items-center gap-2 mt-auto">
        <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
        <div className="flex-1 h-1 rounded-full bg-white/5 overflow-hidden">
          <div className="h-full w-full bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-cyan)]/40" />
        </div>
        <span className="text-[9px] digit-font text-[var(--neon-cyan)]">100%</span>
      </div>
    </div>
  );
}

function Thermostat() {
  const [temp, setTemp] = useState(87);
  const pct = Math.min(1, Math.max(0, (temp - 60) / 30));
  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-start justify-between">
        <button className="h-8 w-8 rounded-lg bg-white/5 border border-border flex items-center justify-center hover:border-primary/50">
          <Settings className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
        <div className="text-right">
          <div className="text-[9px] uppercase tracking-[0.2em] text-muted-foreground/70">Climate Zone</div>
          <div className="text-xs font-bold tracking-wide neon-text">HOUSE</div>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center my-2">
        <div className="relative w-44 h-44">
          <div className="absolute inset-0 rounded-full border border-primary/20" />
          <div className="absolute inset-1 rounded-full"
            style={{
              background: `conic-gradient(from 220deg, var(--neon-cyan) 0deg, var(--neon-magenta) ${pct * 280}deg, oklch(0.3 0.05 260 / 0.4) ${pct * 280}deg, oklch(0.3 0.05 260 / 0.4) 280deg, transparent 280deg)`,
              mask: "radial-gradient(circle, transparent 64%, #000 66%, #000 72%, transparent 73%)",
              WebkitMask: "radial-gradient(circle, transparent 64%, #000 66%, #000 72%, transparent 73%)",
              filter: "drop-shadow(0 0 10px oklch(0.82 0.16 210 / 0.5))",
            }}
          />
          <div className="absolute inset-6 rounded-full bg-gradient-to-br from-[oklch(0.22_0.06_260)] to-[oklch(0.14_0.05_260)] shadow-[inset_0_6px_20px_oklch(0_0_0/0.6),inset_0_-2px_8px_oklch(0.5_0.18_220/0.2)] flex flex-col items-center justify-center">
            <div className="digit-font text-4xl font-bold text-foreground tracking-tight">
              {temp}<span className="text-lg align-top text-primary">°</span>
            </div>
            <Snowflake className="h-3.5 w-3.5 text-[var(--neon-cyan)] mt-1" />
            <div className="text-[8px] uppercase tracking-[0.3em] text-muted-foreground mt-0.5">Set Point</div>
          </div>
          <button onClick={() => setTemp(t => Math.max(60, t - 1))} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-1.5 h-9 w-9 rounded-full bg-[oklch(0.22_0.06_260)] border border-primary/30 flex items-center justify-center hover:border-primary hover:shadow-[0_0_15px_oklch(0.82_0.16_210/0.4)]">
            <Minus className="h-3.5 w-3.5 text-primary" />
          </button>
          <button onClick={() => setTemp(t => Math.min(90, t + 1))} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1.5 h-9 w-9 rounded-full bg-[oklch(0.22_0.06_260)] border border-primary/30 flex items-center justify-center hover:border-primary hover:shadow-[0_0_15px_oklch(0.82_0.16_210/0.4)]">
            <Plus className="h-3.5 w-3.5 text-primary" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-1.5 mb-2">
        {[
          { l: "Off", i: Power },
          { l: "Heat", i: Flame, color: "text-[var(--neon-amber)]" },
          { l: "Cool", i: Snowflake, color: "text-[var(--neon-cyan)]", active: true },
          { l: "Auto", i: RefreshCw },
        ].map((m) => {
          const Mi = m.i;
          return (
            <button key={m.l} className={`py-2 rounded-lg flex flex-col items-center gap-0.5 border transition ${m.active ? "bg-primary/10 border-primary/50 shadow-[0_0_15px_oklch(0.82_0.16_210/0.25)]" : "bg-white/5 border-white/5 hover:border-primary/30"}`}>
              <Mi className={`h-3.5 w-3.5 ${m.color || (m.active ? "text-primary" : "text-muted-foreground")}`} />
              <span className="text-[8px] uppercase tracking-widest text-muted-foreground">{m.l}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-2 pt-2 border-t border-border/50">
        {[{ l: "Indoor", v: "85°" }, { l: "Humidity", v: "49%" }, { l: "Outside", v: "—" }].map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
            <div className="digit-font text-sm text-foreground/90 mt-0.5">{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CameraCard() {
  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Camera className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase neon-text">Live Feed</span>
        </div>
        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full border border-destructive/40 bg-destructive/10">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
          <span className="digit-font text-[9px] text-destructive">LIVE</span>
        </div>
      </div>

      <div className="relative flex-1 rounded-lg overflow-hidden border border-primary/30 shadow-[0_0_25px_oklch(0.82_0.16_210/0.2),inset_0_0_50px_oklch(0_0_0/0.4)] min-h-0">
        <img src={cameraFeed} alt="Live camera feed" width={1024} height={640} loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 0%, transparent 70%, oklch(0.05 0.05 260 / 0.6) 100%)" }} />
        <div className="scanline" />
        {["top-1.5 left-1.5 border-t border-l", "top-1.5 right-1.5 border-t border-r", "bottom-1.5 left-1.5 border-b border-l", "bottom-1.5 right-1.5 border-b border-r"].map((c, i) => (
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
  );
}

/* ============ Featured Carousel Cards ============ */

function SecurityCard() {
  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lock className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs font-bold tracking-[0.15em] uppercase neon-text">Security System</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-md text-[9px] digit-font bg-[var(--neon-cyan)]/10 border border-[var(--neon-cyan)]/40 text-[var(--neon-cyan)] flex items-center gap-1">
            <Settings className="h-2.5 w-2.5" /> AUTO-ARM
          </span>
          <span className="text-[10px] digit-font text-[var(--neon-cyan)] flex items-center gap-1.5">
            <span className="pulse-dot" /> DISARMED
          </span>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-[var(--neon-cyan)]/30 bg-gradient-to-br from-[var(--neon-cyan)]/5 to-transparent flex flex-col items-center justify-center min-h-0 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 50% 60%, var(--neon-cyan) 0%, transparent 50%)" }} />
        <AlertTriangle className="h-5 w-5 text-[var(--neon-amber)] mb-1 relative" />
        <div className="digit-font text-[11px] tracking-[0.2em] text-[var(--neon-amber)] font-bold relative">SYSTEM NOT READY</div>
        <button className="mt-3 px-4 py-1.5 rounded-md bg-black/30 border border-border text-[10px] uppercase tracking-widest text-foreground/80 hover:border-primary relative">Den Window</button>
      </div>

      <div className="grid grid-cols-3 gap-2 mt-3">
        {[{ l: "Home", i: Home }, { l: "Away", i: Plane }, { l: "Disarm", i: Lock }].map((b) => {
          const Bi = b.i;
          return (
            <button key={b.l} className="device-tile !p-2 flex flex-col items-center gap-1 hover:border-[var(--neon-cyan)]/60">
              <Bi className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
              <span className="text-[9px] digit-font tracking-widest text-foreground/80">{b.l.toUpperCase()}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function LiveTVCard() {
  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.2em] text-destructive font-bold">LIVE TV</span>
          <span className="text-xs font-bold tracking-wide neon-text">TLC</span>
        </div>
        <div className="flex gap-1">
          <button className="h-6 w-6 rounded bg-white/5 border border-border flex items-center justify-center"><Cast className="h-3 w-3 text-primary" /></button>
          <button className="h-6 w-6 rounded bg-white/5 border border-border flex items-center justify-center"><Maximize2 className="h-3 w-3 text-primary" /></button>
        </div>
      </div>
      <div className="relative flex-1 rounded-lg overflow-hidden border border-primary/30 min-h-0 bg-gradient-to-br from-[oklch(0.25_0.08_320)] to-[oklch(0.18_0.06_260)] flex items-center justify-center">
        <Tv className="h-12 w-12 text-primary/50" />
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "repeating-linear-gradient(0deg, transparent 0, transparent 3px, oklch(0 0 0 / 0.08) 3px, oklch(0 0 0 / 0.08) 4px)" }} />
        <button className="absolute h-12 w-12 rounded-full bg-[oklch(0.7_0.18_50)] flex items-center justify-center shadow-[0_0_20px_oklch(0.7_0.18_50/0.6)] hover:scale-110 transition">
          <Play className="h-5 w-5 text-white fill-white" />
        </button>
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between text-[10px] text-white">
          <div>
            <div className="font-bold">One Day in My Body</div>
            <div className="text-[9px] text-white/70">NEXT · Daddylive</div>
          </div>
          <span className="px-1.5 py-0.5 bg-destructive text-white text-[8px] font-bold rounded">TLC</span>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2 mt-2">
        <div className="device-tile !p-2 text-center">
          <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Channel</div>
          <div className="digit-font text-[11px] text-[var(--neon-cyan)]">280</div>
        </div>
        <div className="device-tile !p-2 text-center">
          <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Quality</div>
          <div className="digit-font text-[11px] text-[var(--neon-lime)]">HD</div>
        </div>
        <div className="device-tile !p-2 text-center">
          <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Source</div>
          <div className="digit-font text-[11px] text-[var(--neon-magenta)]">DDL</div>
        </div>
      </div>
    </div>
  );
}

function CryptoCard() {
  const coins = [
    { n: "Jasmy", p: "$0.006539", c: "-4.69%", up: false },
    { n: "Shiba", p: "$0.00000629", c: "-1.91%", up: false },
    { n: "Doge", p: "$0.113429", c: "+3.09%", up: true },
    { n: "Cronos", p: "$0.075042", c: "-4.11%", up: false },
    { n: "Algo", p: "$0.118363", c: "-3.24%", up: false },
    { n: "XRP", p: "$1.43", c: "-0.66%", up: false },
  ];
  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-lg bg-[var(--neon-cyan)]/15 border border-[var(--neon-cyan)]/40 flex items-center justify-center">
            <Box className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
          </div>
          <div>
            <div className="text-xs font-bold tracking-[0.15em] uppercase neon-text">Crypto</div>
            <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Live Market</div>
          </div>
        </div>
        <div className="text-right">
          <div className="digit-font text-sm text-[var(--neon-lime)] font-bold">$1,219.77</div>
        </div>
      </div>
      <div className="flex-1 min-h-0 overflow-y-auto space-y-1.5 pr-1">
        {coins.map((c) => (
          <div key={c.n} className="device-tile !p-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`h-6 w-6 rounded-full border ${c.up ? "border-[var(--neon-lime)]/40 bg-[var(--neon-lime)]/10" : "border-destructive/30 bg-destructive/5"} flex items-center justify-center text-[8px] font-bold digit-font`}>
                {c.n[0]}
              </div>
              <div>
                <div className="text-[10px] font-bold text-foreground/90">{c.n}</div>
              </div>
            </div>
            <div className="text-right">
              <div className="digit-font text-[10px] text-foreground/90">{c.p}</div>
              <div className={`digit-font text-[8px] ${c.up ? "text-[var(--neon-lime)]" : "text-destructive"}`}>{c.c}</div>
            </div>
          </div>
        ))}
      </div>
      <div className="text-center text-[8px] uppercase tracking-widest text-muted-foreground/70 mt-2">Updated · CoinGecko</div>
    </div>
  );
}

function FlightsCard() {
  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Plane className="h-3.5 w-3.5 text-primary" />
          <div>
            <div className="text-xs font-bold tracking-[0.15em] uppercase neon-text">Flights</div>
            <div className="text-[9px] digit-font text-muted-foreground tracking-widest">JAX · STX · STT · SKB</div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[8px] uppercase tracking-widest text-destructive">API 230/230</div>
          <div className="h-0.5 w-16 bg-destructive mt-0.5 ml-auto rounded" />
        </div>
      </div>
      <div className="flex-1 rounded-xl border border-destructive/20 bg-gradient-to-br from-destructive/5 to-transparent flex flex-col items-center justify-center min-h-0 relative overflow-hidden">
        <div className="h-12 w-12 rounded-full bg-destructive/15 border-2 border-destructive/50 flex items-center justify-center mb-2">
          <span className="block h-0.5 w-6 bg-destructive rotate-45 absolute" />
          <Plane className="h-5 w-5 text-destructive" />
        </div>
        <div className="text-[11px] font-bold text-destructive uppercase tracking-widest">Monthly limit reached</div>
        <div className="text-[9px] digit-font text-muted-foreground mt-1">Resets 6/1/2026</div>
      </div>
      <div className="text-center text-[8px] uppercase tracking-widest text-muted-foreground/70 mt-2">SerpAPI · Google Flights</div>
    </div>
  );
}

function HydrationCard() {
  return (
    <div className="glass-panel p-4 flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="h-3.5 w-3.5 text-[var(--neon-cyan)]" />
          <div>
            <div className="text-xs font-bold tracking-[0.15em] uppercase neon-text">Hydration</div>
            <div className="text-[9px] uppercase tracking-widest text-muted-foreground">Sprinkler System</div>
          </div>
        </div>
        <span className="px-2 py-0.5 rounded-md text-[9px] digit-font bg-destructive/10 border border-destructive/40 text-destructive flex items-center gap-1">
          <span className="h-1.5 w-1.5 rounded-full bg-destructive" /> STANDBY
        </span>
      </div>
      <div className="flex-1 flex items-center justify-center min-h-0 relative">
        <div className="relative w-32 h-32">
          {[0, 60, 120, 180, 240, 300].map((deg, i) => {
            const colors = ["var(--neon-cyan)", "var(--neon-amber)", "var(--neon-amber)", "var(--neon-lime)", "var(--neon-magenta)", "var(--neon-violet)"];
            return (
              <div
                key={i}
                className="absolute h-3 w-3 rounded-full border-2"
                style={{
                  borderColor: colors[i],
                  top: `${50 - 45 * Math.cos((deg * Math.PI) / 180)}%`,
                  left: `${50 + 45 * Math.sin((deg * Math.PI) / 180)}%`,
                  transform: "translate(-50%, -50%)",
                  boxShadow: `0 0 8px ${colors[i]}`,
                }}
              />
            );
          })}
          <div className="absolute inset-1/4 rounded-full bg-[var(--neon-cyan)]/20 border-2 border-[var(--neon-cyan)] flex items-center justify-center shadow-[0_0_30px_var(--neon-cyan)]">
            <Droplets className="h-6 w-6 text-[var(--neon-cyan)]" />
          </div>
        </div>
      </div>
      <div className="text-center text-[11px] font-bold mt-1">Standby</div>
      <div className="grid grid-cols-3 gap-1.5 mt-2">
        <div className="device-tile !p-1.5 text-center">
          <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Start/Stop</div>
          <div className="digit-font text-[10px] text-[var(--neon-lime)]">START</div>
        </div>
        <div className="device-tile !p-1.5 text-center">
          <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Zone Left</div>
          <div className="digit-font text-[10px]">--</div>
        </div>
        <div className="device-tile !p-1.5 text-center">
          <div className="text-[8px] uppercase tracking-widest text-muted-foreground">Power</div>
          <div className="digit-font text-[10px] text-destructive">STANDBY</div>
        </div>
      </div>
    </div>
  );
}

function SystemCoreCard() {
  const nodes = [
    { i: Car, c: "var(--destructive)", x: 25, y: 20 },
    { i: Globe, c: "var(--neon-cyan)", x: 80, y: 25 },
    { i: Box, c: "var(--neon-cyan)", x: 50, y: 35 },
    { i: Lock, c: "var(--neon-amber)", x: 18, y: 55 },
    { i: Bot, c: "var(--neon-magenta)", x: 78, y: 65 },
    { i: Zap, c: "var(--neon-lime)", x: 90, y: 80 },
  ];
  return (
    <div className="glass-panel p-4 flex flex-col h-full relative overflow-hidden">
      <div className="flex items-center justify-between mb-2 z-10">
        <div className="flex items-center gap-2">
          <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground font-bold">SYSTEM CORE</span>
          <span className="text-[9px] digit-font text-[var(--neon-lime)] flex items-center gap-1">
            <span className="pulse-dot" /> LIVE
          </span>
        </div>
        <div className="digit-font text-lg neon-text font-bold">0.21<span className="text-[10px] ml-0.5">kW</span></div>
      </div>
      <div className="relative flex-1 min-h-0">
        {nodes.map((n, i) => {
          const Ni = n.i;
          return (
            <div
              key={i}
              className="absolute h-9 w-9 rounded-full border-2 flex items-center justify-center bg-black/40"
              style={{ left: `${n.x}%`, top: `${n.y}%`, transform: "translate(-50%, -50%)", borderColor: n.c, boxShadow: `0 0 15px ${n.c}` }}
            >
              <Ni className="h-3.5 w-3.5" style={{ color: n.c }} />
            </div>
          );
        })}
        <div className="absolute h-20 w-20 rounded-full flex items-center justify-center" style={{ left: "55%", top: "65%", transform: "translate(-50%, -50%)", background: "radial-gradient(circle, var(--neon-cyan), oklch(0.6 0.2 200 / 0.4))", boxShadow: "0 0 60px var(--neon-cyan), inset 0 0 20px oklch(1 0 0 / 0.2)" }}>
          <Home className="h-8 w-8 text-white" />
        </div>
        <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.4 }}>
          {nodes.map((n, i) => (
            <line key={i} x1="55%" y1="65%" x2={`${n.x}%`} y2={`${n.y}%`} stroke={n.c} strokeWidth="1" strokeDasharray="2 4" />
          ))}
        </svg>
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <main className="h-screen w-screen p-3 flex flex-col gap-3 overflow-hidden max-w-[1920px] mx-auto">
      {/* TOP BAR */}
      <header className="glass-panel px-4 py-2 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button className="h-9 w-9 rounded-lg bg-white/5 border border-border flex items-center justify-center hover:border-primary">
            <div className="flex flex-col gap-1">
              <span className="block w-3.5 h-0.5 bg-primary" />
              <span className="block w-3.5 h-0.5 bg-primary" />
              <span className="block w-3.5 h-0.5 bg-primary" />
            </div>
          </button>
          <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-magenta)]/20 border border-primary/40 flex items-center justify-center shadow-[0_0_15px_oklch(0.82_0.16_210/0.3)]">
            <Home className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-[0.2em] neon-text leading-none">HA DASH</h1>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[9px] digit-font text-[var(--neon-magenta)]">v197.0</span>
              <span className="h-px w-24 bg-gradient-to-r from-primary/60 to-transparent" />
            </div>
          </div>
        </div>

        <Clock />

        <div className="flex items-center gap-1.5">
          <TBtn icon={RefreshCw} />
          <TBtn icon={Maximize2} />
          <TBtn icon={Play} />
          <TBtn icon={Wifi} />
          <div className="h-9 px-2.5 glass-panel flex items-center gap-1.5 !rounded-lg">
            <Battery className="h-3.5 w-3.5 text-[var(--neon-lime)]" />
            <Zap className="h-3 w-3 text-[var(--neon-lime)]" />
            <span className="digit-font text-[10px] text-[var(--neon-lime)]">100%</span>
          </div>
          <TBtn icon={Volume2} />
          <button className="h-9 px-3 rounded-lg bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] text-primary-foreground font-bold tracking-[0.2em] text-[10px] shadow-[0_0_20px_oklch(0.82_0.16_210/0.5)] hover:shadow-[0_0_35px_oklch(0.82_0.16_210/0.7)] transition">
            BUILD
          </button>
          <TBtn icon={Power} danger />
        </div>
      </header>

      {/* DEVICES & CONDITIONS */}
      <section className="shrink-0">
        <SectionHeader title="Devices & Conditions" />
        <div className="grid grid-cols-8 gap-2">
          {devices.map((d) => <Tile key={d.id} d={d} />)}
        </div>
        <div className="grid grid-cols-8 gap-2 mt-2">
          <StatTile icon={Thermometer} label="Hot Water" value="—" unit="°F" accent="magenta" />
          <StatTile icon={Zap} label="Energy" value="1.17" unit="kW" accent="amber" footer="tap for details" />
          <DreameTile />
          <SaraiyahRoom />
          <StatTile icon={Droplets} label="Humidity" value="—" unit="%" accent="cyan" />
        </div>
      </section>

      {/* FEATURED */}
      <section className="flex-1 min-h-0 flex flex-col">
        <SectionHeader title="Featured Controls" />
        <CardCarousel>
          {[
            <Volumio key="v" />,
            <Thermostat key="t" />,
            <CameraCard key="c" />,
            <SecurityCard key="s" />,
            <LiveTVCard key="tv" />,
            <CryptoCard key="cr" />,
            <FlightsCard key="f" />,
            <HydrationCard key="h" />,
            <SystemCoreCard key="sc" />,
          ]}
        </CardCarousel>
      </section>

      {/* QUICK ACTIONS */}
      <section className="shrink-0">
        <div className="grid grid-cols-8 gap-2">
          {bottomDevices.map((d) => <Tile key={d.id} d={d} />)}
          <button className="device-tile !p-2.5 flex flex-col items-center justify-center gap-1 border-dashed">
            <Plus className="h-4 w-4 text-primary" />
            <span className="text-[9px] uppercase tracking-widest text-muted-foreground">Add Device</span>
          </button>
          <div className="glass-panel !p-2.5 flex items-center justify-around">
            <div className="text-center">
              <div className="text-[8px] text-muted-foreground tracking-widest uppercase">Devices</div>
              <div className="digit-font text-base text-primary font-bold">6</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-muted-foreground tracking-widest uppercase">Online</div>
              <div className="digit-font text-base text-[var(--neon-lime)] font-bold">3</div>
            </div>
            <div className="text-center">
              <div className="text-[8px] text-muted-foreground tracking-widest uppercase">System</div>
              <div className="digit-font text-base text-[var(--neon-cyan)] font-bold">OK</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

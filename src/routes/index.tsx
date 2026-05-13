import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Home, Power, Wifi, Battery, Volume2, Maximize2, RefreshCw, Play,
  DoorOpen, Droplets, Shirt, Wind, Flame, Bot, Thermometer, Gauge,
  Camera, Lock, Shield, Car, Lightbulb, Fan, Plus, Snowflake, Sun,
  ChevronLeft, ChevronRight, Minus, Settings, Activity, AlertTriangle
} from "lucide-react";
import cameraFeed from "@/assets/camera-feed.jpg";

export const Route = createFileRoute("/")({
  component: Dashboard,
  head: () => ({
    meta: [
      { title: "HA Dash — Futuristic Smart Home Control" },
      { name: "description", content: "A futuristic 3D-style home automation dashboard for climate, security, lighting and devices." },
    ],
  }),
});

type Status = "on" | "off" | "open" | "offline" | "unavailable";

interface Device {
  id: string;
  name: string;
  sub?: string;
  status: Status;
  icon: React.ComponentType<{ className?: string }>;
  accent?: "cyan" | "magenta" | "amber" | "lime" | "violet";
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

const sensors = [
  { label: "Hot Water", value: "—", unit: "°F", icon: Thermometer, accent: "magenta" },
  { label: "Dreame", value: "Unavailable", icon: Bot, accent: "violet" },
  { label: "Humidity", value: "—", unit: "%", icon: Droplets, accent: "cyan" },
  { label: "Laundry", value: "—", unit: "°F", icon: Thermometer, accent: "amber" },
];

const bottomDevices: Device[] = [
  { id: "denone", name: "Den One", status: "off", icon: Lightbulb },
  { id: "wh", name: "Water Heater", status: "off", icon: Flame, accent: "amber" },
  { id: "denfan", name: "Den Fan", status: "on", icon: Fan, accent: "cyan" },
  { id: "lights", name: "Inside Lights", sub: "100%", status: "on", icon: Lightbulb, accent: "amber" },
  { id: "garage", name: "Garage Door", status: "off", icon: Car },
  { id: "new", name: "New Device", status: "off", icon: Plus },
];

function accentClass(a?: Device["accent"]) {
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

function statusLabel(s: Status) {
  return s.toUpperCase();
}

function Tile({ d }: { d: Device }) {
  const Icon = d.icon;
  const active = d.status === "on" || d.status === "open";
  return (
    <button className={`device-tile text-left w-full ${active ? "active" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`relative h-11 w-11 rounded-xl flex items-center justify-center ${active ? "bg-primary/15" : "bg-white/5"}`}>
          <Icon className={`h-5 w-5 ${active ? accentClass(d.accent) || "text-primary" : "text-muted-foreground"}`} />
          {active && <div className="absolute inset-0 rounded-xl ring-1 ring-primary/40 shadow-[0_0_20px_oklch(0.82_0.16_210/0.45)]" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground/80 truncate">{d.name}</div>
          {d.sub && <div className="text-[10px] text-muted-foreground/60 truncate">{d.sub}</div>}
        </div>
      </div>
      <div className="mt-3 flex items-center gap-2">
        <span className={statusDot(d.status)} />
        <span className="digit-font text-[10px] text-foreground/80">{statusLabel(d.status)}</span>
      </div>
    </button>
  );
}

function SensorTile({ s }: { s: typeof sensors[number] }) {
  const Icon = s.icon;
  return (
    <div className="device-tile">
      <div className="flex items-start justify-between">
        <Icon className={`h-5 w-5 ${accentClass(s.accent as Device["accent"])}`} />
        <span className="text-[10px] digit-font text-muted-foreground/60">LIVE</span>
      </div>
      <div className="mt-4 flex items-baseline gap-1">
        <span className="digit-font text-3xl text-foreground/90">{s.value}</span>
        {s.unit && <span className="text-xs text-muted-foreground">{s.unit}</span>}
      </div>
      <div className="text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70 mt-1">{s.label}</div>
    </div>
  );
}

function Clock() {
  const [time, setTime] = useState("");
  useEffect(() => {
    const update = () => {
      const d = new Date();
      let h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, "0");
      const ampm = h >= 12 ? "PM" : "AM";
      h = h % 12 || 12;
      setTime(`${h.toString().padStart(2, "0")}:${m} ${ampm}`);
    };
    update();
    const t = setInterval(update, 30_000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="glass-panel px-8 py-3 flex items-center gap-3">
      <div className="pulse-dot" />
      <span className="digit-font text-2xl neon-text font-bold">{time || "—"}</span>
    </div>
  );
}

function TopBarButton({ icon: Icon, label, danger }: { icon: any; label?: string; danger?: boolean }) {
  return (
    <button className={`h-11 min-w-11 px-3 glass-panel flex items-center justify-center gap-2 hover:border-primary/60 transition ${danger ? "hover:border-destructive/60" : ""}`}>
      <Icon className={`h-4 w-4 ${danger ? "text-destructive" : "text-primary"}`} />
      {label && <span className="digit-font text-xs text-foreground/80">{label}</span>}
    </button>
  );
}

function Thermostat() {
  const [temp, setTemp] = useState(72);
  const pct = ((temp - 60) / 30) * 100;
  return (
    <div className="glass-panel p-6 flex flex-col h-full">
      <div className="flex items-start justify-between">
        <button className="h-9 w-9 rounded-lg bg-white/5 flex items-center justify-center hover:bg-white/10">
          <Settings className="h-4 w-4 text-muted-foreground" />
        </button>
        <div className="text-right">
          <div className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">Climate Zone</div>
          <div className="text-sm font-semibold tracking-wide neon-text">HOUSE</div>
        </div>
      </div>

      <div className="relative flex-1 flex items-center justify-center my-4">
        {/* Outer ring */}
        <div className="relative w-64 h-64">
          <div className="absolute inset-0 rounded-full border border-primary/20" />
          <div
            className="absolute inset-2 rounded-full"
            style={{
              background: `conic-gradient(from 220deg, var(--neon-cyan) 0deg, var(--neon-magenta) ${pct * 2.8}deg, oklch(0.3 0.05 260 / 0.4) ${pct * 2.8}deg, oklch(0.3 0.05 260 / 0.4) 280deg, transparent 280deg)`,
              mask: "radial-gradient(circle, transparent 64%, #000 66%, #000 72%, transparent 73%)",
              WebkitMask: "radial-gradient(circle, transparent 64%, #000 66%, #000 72%, transparent 73%)",
              filter: "drop-shadow(0 0 12px oklch(0.82 0.16 210 / 0.5))",
            }}
          />
          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-[oklch(0.22_0.06_260)] to-[oklch(0.14_0.05_260)] shadow-[inset_0_8px_30px_oklch(0_0_0/0.6),inset_0_-2px_10px_oklch(0.5_0.18_220/0.2)] flex flex-col items-center justify-center">
            <Snowflake className="h-5 w-5 text-[var(--neon-cyan)] mb-1" />
            <div className="digit-font text-6xl font-bold text-foreground tracking-tight">
              {temp}<span className="text-2xl align-top text-primary">°</span>
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mt-1">Set Point</div>
          </div>

          <button onClick={() => setTemp(t => Math.max(60, t - 1))} className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 h-11 w-11 rounded-full bg-[oklch(0.22_0.06_260)] border border-primary/30 flex items-center justify-center hover:border-primary hover:shadow-[0_0_20px_oklch(0.82_0.16_210/0.4)]">
            <Minus className="h-4 w-4 text-primary" />
          </button>
          <button onClick={() => setTemp(t => Math.min(90, t + 1))} className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 h-11 w-11 rounded-full bg-[oklch(0.22_0.06_260)] border border-primary/30 flex items-center justify-center hover:border-primary hover:shadow-[0_0_20px_oklch(0.82_0.16_210/0.4)]">
            <Plus className="h-4 w-4 text-primary" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2 mb-4">
        {[
          { l: "Off", i: Power },
          { l: "Heat", i: Flame, color: "text-[var(--neon-amber)]" },
          { l: "Cool", i: Snowflake, color: "text-[var(--neon-cyan)]", active: true },
          { l: "Auto", i: RefreshCw },
        ].map((m) => {
          const Mi = m.i;
          return (
            <button key={m.l} className={`py-3 rounded-xl flex flex-col items-center gap-1 border transition ${m.active ? "bg-primary/10 border-primary/50 shadow-[0_0_20px_oklch(0.82_0.16_210/0.25)]" : "bg-white/5 border-white/5 hover:border-primary/30"}`}>
              <Mi className={`h-4 w-4 ${m.color || (m.active ? "text-primary" : "text-muted-foreground")}`} />
              <span className="text-[10px] uppercase tracking-widest text-muted-foreground">{m.l}</span>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 pt-3 border-t border-border/50">
        {[
          { l: "Indoor", v: "85°" },
          { l: "Humidity", v: "49%" },
          { l: "Outside", v: "—" },
        ].map((s) => (
          <div key={s.l} className="text-center">
            <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{s.l}</div>
            <div className="digit-font text-lg text-foreground/90 mt-1">{s.v}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CameraCard() {
  return (
    <div className="glass-panel p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-[0.18em] uppercase neon-text">Live Feed</span>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 rounded-full border border-destructive/40 bg-destructive/10">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          <span className="digit-font text-[10px] text-destructive">LIVE</span>
        </div>
      </div>

      <div className="relative flex-1 rounded-xl overflow-hidden border border-primary/30 shadow-[0_0_30px_oklch(0.82_0.16_210/0.2),inset_0_0_60px_oklch(0_0_0/0.4)]">
        <img src={cameraFeed} alt="Front yard camera" width={1024} height={640} loading="lazy" className="w-full h-full object-cover" />
        <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(180deg, transparent 0%, transparent 70%, oklch(0.05 0.05 260 / 0.6) 100%)" }} />
        <div className="scanline" />
        {/* Corner brackets */}
        {["top-2 left-2 border-t border-l", "top-2 right-2 border-t border-r", "bottom-2 left-2 border-b border-l", "bottom-2 right-2 border-b border-r"].map((c, i) => (
          <div key={i} className={`absolute ${c} border-primary w-5 h-5`} />
        ))}
        <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between">
          <button className="h-8 w-8 rounded-full bg-black/60 backdrop-blur border border-primary/40 flex items-center justify-center hover:border-primary">
            <ChevronLeft className="h-4 w-4 text-primary" />
          </button>
          <span className="digit-font text-xs text-foreground/90 px-3 py-1 rounded-full bg-black/60 backdrop-blur border border-primary/30">Camera 150 · 1/9</span>
          <div className="flex gap-2">
            <button className="h-8 w-8 rounded-full bg-black/60 backdrop-blur border border-primary/40 flex items-center justify-center hover:border-primary">
              <ChevronRight className="h-4 w-4 text-primary" />
            </button>
            <button className="h-8 w-8 rounded-full bg-black/60 backdrop-blur border border-primary/40 flex items-center justify-center hover:border-primary">
              <Maximize2 className="h-4 w-4 text-primary" />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mt-4">
        <div className="device-tile !p-3">
          <div className="flex items-center gap-2">
            <Activity className="h-4 w-4 text-[var(--neon-lime)]" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Connection</div>
              <div className="text-sm digit-font">Optimized</div>
            </div>
          </div>
        </div>
        <div className="device-tile !p-3">
          <div className="flex items-center gap-2">
            <Gauge className="h-4 w-4 text-[var(--neon-cyan)]" />
            <div>
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Interval</div>
              <div className="text-sm digit-font">8s</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SecurityCard() {
  return (
    <div className="glass-panel p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <span className="text-sm font-semibold tracking-[0.18em] uppercase neon-text">Security System</span>
        </div>
        <div className="flex items-center gap-3">
          <button className="px-3 py-1 rounded-full border border-[var(--neon-lime)]/50 text-[var(--neon-lime)] text-[10px] digit-font flex items-center gap-1 hover:bg-[var(--neon-lime)]/10">
            <Settings className="h-3 w-3" /> AUTO-ARM
          </button>
          <span className="flex items-center gap-2 text-[var(--neon-cyan)]">
            <span className="h-2 w-2 rounded-full bg-[var(--neon-cyan)] shadow-[0_0_10px_var(--neon-cyan)]" />
            <span className="digit-font text-xs">DISARMED</span>
          </span>
        </div>
      </div>

      <div className="flex-1 rounded-xl border border-destructive/30 bg-gradient-to-br from-destructive/10 to-transparent p-6 flex flex-col items-center justify-center text-center mb-4">
        <AlertTriangle className="h-8 w-8 text-destructive mb-3" />
        <div className="text-destructive font-semibold tracking-[0.2em] uppercase text-sm">System Not Ready</div>
        <div className="mt-3 px-4 py-1.5 rounded-full border border-destructive/40 bg-destructive/10">
          <span className="digit-font text-xs text-destructive">DEN WINDOW</span>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { l: "Home", i: Home, color: "text-[var(--neon-cyan)]" },
          { l: "Away", i: Car, color: "text-[var(--neon-amber)]" },
          { l: "Disarm", i: Lock, color: "text-[var(--neon-lime)]" },
        ].map((b) => {
          const Bi = b.i;
          return (
            <button key={b.l} className="device-tile !p-4 flex flex-col items-center gap-2 hover:border-primary/50">
              <Bi className={`h-5 w-5 ${b.color}`} />
              <span className="text-[11px] uppercase tracking-widest text-foreground/80">{b.l}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Dashboard() {
  return (
    <main className="min-h-screen p-4 md:p-6 lg:p-8 max-w-[1800px] mx-auto">
      {/* TOP BAR */}
      <header className="glass-panel px-5 py-3 flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button className="h-11 w-11 rounded-xl bg-white/5 border border-border flex items-center justify-center hover:border-primary">
            <div className="flex flex-col gap-1">
              <span className="block w-4 h-0.5 bg-primary" />
              <span className="block w-4 h-0.5 bg-primary" />
              <span className="block w-4 h-0.5 bg-primary" />
            </div>
          </button>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-[var(--neon-cyan)]/20 to-[var(--neon-magenta)]/20 border border-primary/40 flex items-center justify-center shadow-[0_0_20px_oklch(0.82_0.16_210/0.3)]">
              <Home className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-black tracking-[0.2em] neon-text">HA DASH</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-[10px] digit-font text-[var(--neon-magenta)]">v197.0</span>
                <span className="h-px flex-1 w-32 bg-gradient-to-r from-primary/60 to-transparent" />
              </div>
            </div>
          </div>
        </div>

        <Clock />

        <div className="flex items-center gap-2">
          <TopBarButton icon={RefreshCw} />
          <TopBarButton icon={Maximize2} />
          <TopBarButton icon={Play} />
          <TopBarButton icon={Wifi} />
          <div className="h-11 px-3 glass-panel flex items-center gap-2">
            <Battery className="h-4 w-4 text-[var(--neon-lime)]" />
            <span className="digit-font text-xs text-[var(--neon-lime)]">100%</span>
          </div>
          <TopBarButton icon={Volume2} />
          <button className="h-11 px-4 rounded-xl bg-gradient-to-r from-[var(--neon-cyan)] to-[var(--neon-magenta)] text-primary-foreground font-bold tracking-[0.2em] text-xs shadow-[0_0_25px_oklch(0.82_0.16_210/0.5)] hover:shadow-[0_0_40px_oklch(0.82_0.16_210/0.7)] transition">
            BUILD
          </button>
          <TopBarButton icon={Power} danger />
        </div>
      </header>

      {/* DEVICES & CONDITIONS */}
      <section className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xs font-semibold tracking-[0.3em] uppercase text-[var(--neon-cyan)]">Devices & Conditions</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--neon-cyan)]/60 via-primary/20 to-transparent" />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-8 gap-3">
          {devices.map((d) => <Tile key={d.id} d={d} />)}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
          {sensors.map((s) => <SensorTile key={s.label} s={s} />)}
        </div>
      </section>

      {/* FEATURED CONTROLS */}
      <section className="mb-6">
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xs font-semibold tracking-[0.3em] uppercase text-[var(--neon-cyan)]">Featured Controls</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--neon-cyan)]/60 via-primary/20 to-transparent" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <Thermostat />
          <CameraCard />
          <SecurityCard />
        </div>
      </section>

      {/* QUICK ACTIONS */}
      <section>
        <div className="flex items-center gap-3 mb-3">
          <h2 className="text-xs font-semibold tracking-[0.3em] uppercase text-[var(--neon-cyan)]">Quick Actions</h2>
          <div className="h-px flex-1 bg-gradient-to-r from-[var(--neon-cyan)]/60 via-primary/20 to-transparent" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-3 items-stretch">
          {bottomDevices.map((d) => <Tile key={d.id} d={d} />)}
          <div className="glass-panel p-4 flex flex-col justify-center items-center text-center">
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mb-2">System</div>
            <div className="grid grid-cols-3 gap-3 w-full">
              <div>
                <div className="text-[9px] text-muted-foreground tracking-widest">DEV</div>
                <div className="digit-font text-lg text-primary">6</div>
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground tracking-widest">ON</div>
                <div className="digit-font text-lg text-[var(--neon-lime)]">3</div>
              </div>
              <div>
                <div className="text-[9px] text-muted-foreground tracking-widest">STAT</div>
                <div className="digit-font text-lg text-[var(--neon-cyan)]">OK</div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

import {
  DoorOpen, Droplets, Shirt, Wind, Flame, Bot, Thermometer, Zap,
  Play, Home, Minus, Plus, Sun, Fan,
} from "lucide-react";

/* ============================================================
   Component-scoped styles (kept inside this file by request)
   ============================================================ */
const dcStyles = `
.dc-section { display: flex; flex-direction: column; gap: 0.5rem; }
.dc-header { display: flex; align-items: center; gap: 0.75rem; margin-bottom: 0.5rem; }
.dc-header h2 {
  font-size: 10px; font-weight: 700; letter-spacing: 0.3em;
  text-transform: uppercase; color: var(--neon-cyan);
}
.dc-header .dc-rule {
  height: 1px; flex: 1;
  background: linear-gradient(90deg, color-mix(in oklab, var(--neon-cyan) 60%, transparent),
    color-mix(in oklab, var(--primary) 20%, transparent), transparent);
}
.dc-grid { display: grid; grid-template-columns: repeat(8, minmax(0, 1fr)); gap: 0.5rem; }

.dc-tile {
  position: relative; border-radius: 1rem; padding: 0.625rem;
  background: linear-gradient(160deg, oklch(0.24 0.06 260 / 0.85), oklch(0.18 0.05 260 / 0.6));
  border: 1px solid oklch(0.4 0.08 230 / 0.35);
  box-shadow: 0 20px 60px -20px oklch(0.05 0.05 260 / 0.8), inset 0 1px 0 oklch(1 0 0 / 0.05);
  transition: all 0.4s cubic-bezier(0.4,0,0.2,1);
  text-align: left; width: 100%; overflow: hidden; cursor: pointer;
}
.dc-tile:hover {
  transform: translateY(-2px);
  border-color: oklch(0.82 0.16 210 / 0.6);
}
.dc-tile.active {
  border-color: oklch(0.82 0.16 210 / 0.7);
  box-shadow: 0 0 0 1px oklch(0.82 0.16 210 / 0.5),
    0 0 30px oklch(0.82 0.16 210 / 0.25);
}
.dc-tile .dc-icon-wrap {
  position: relative; height: 2.25rem; width: 2.25rem; border-radius: 0.5rem;
  display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  background: oklch(1 0 0 / 0.05);
}
.dc-tile.active .dc-icon-wrap { background: color-mix(in oklab, var(--primary) 15%, transparent); }
.dc-row { display: flex; align-items: center; gap: 0.5rem; }
.dc-name {
  font-size: 10px; text-transform: uppercase; letter-spacing: 0.15em;
  color: oklch(from var(--foreground) l c h / 0.9);
  font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.dc-sub { font-size: 9px; color: oklch(from var(--muted-foreground) l c h / 0.7); }
.dc-status { display: flex; align-items: center; gap: 0.375rem; margin-top: 0.125rem; }
.dc-status span.txt { font-size: 9px; color: oklch(from var(--foreground) l c h / 0.7); font-family: 'Orbitron', monospace; letter-spacing: 0.1em; }

.dc-dot {
  width: 8px; height: 8px; border-radius: 999px;
  background: var(--neon-lime);
  box-shadow: 0 0 10px var(--neon-lime), 0 0 20px var(--neon-lime);
  animation: dc-pulse 2s ease-in-out infinite;
}
.dc-dot.off { background: oklch(0.5 0.04 260); box-shadow: none; animation: none; }
.dc-dot.warn { background: var(--neon-amber); box-shadow: 0 0 10px var(--neon-amber); animation: none; }
@keyframes dc-pulse {
  0%,100% { opacity: 1; transform: scale(1); }
  50% { opacity: 0.6; transform: scale(1.15); }
}

.dc-stat { padding: 0.75rem !important; position: relative; }
.dc-stat .dc-stat-head { display: flex; align-items: flex-start; justify-content: space-between; }
.dc-stat .dc-stat-val {
  margin-top: 0.375rem; display: flex; align-items: baseline; gap: 0.25rem;
  font-family: 'Orbitron', monospace; letter-spacing: 0.1em;
}
.dc-stat .dc-stat-val .v { font-size: 1.5rem; font-weight: 700; color: oklch(from var(--foreground) l c h / 0.95); }
.dc-stat .dc-stat-val .u { font-size: 10px; color: var(--muted-foreground); }
.dc-stat .dc-stat-label {
  font-size: 9px; text-transform: uppercase; letter-spacing: 0.2em;
  color: oklch(from var(--muted-foreground) l c h / 0.7); margin-top: 0.125rem;
}
.dc-stat .dc-underline {
  position: absolute; left: 0; right: 0; bottom: 0; height: 1px;
  background: linear-gradient(90deg, transparent, currentColor, transparent);
  opacity: 0.5;
}

.dc-cyan { color: var(--neon-cyan); }
.dc-magenta { color: var(--neon-magenta); }
.dc-amber { color: var(--neon-amber); }
.dc-lime { color: var(--neon-lime); }
.dc-violet { color: var(--neon-violet); }
.dc-muted { color: var(--muted-foreground); }
`;

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

function accentClass(a?: Accent) {
  switch (a) {
    case "cyan": return "dc-cyan";
    case "magenta": return "dc-magenta";
    case "amber": return "dc-amber";
    case "lime": return "dc-lime";
    case "violet": return "dc-violet";
    default: return "dc-muted";
  }
}

function statusDot(s: Status) {
  if (s === "on" || s === "open") return "dc-dot";
  if (s === "offline" || s === "unavailable") return "dc-dot warn";
  return "dc-dot off";
}

export function Tile({ d }: { d: Device }) {
  const Icon = d.icon;
  const active = d.status === "on" || d.status === "open";
  return (
    <button className={`dc-tile ${active ? "active" : ""}`}>
      <div className="dc-row">
        <div className="dc-icon-wrap">
          <Icon className={`h-4 w-4 ${active ? accentClass(d.accent) : "dc-muted"}`} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="dc-name">{d.name}</div>
          {d.sub && <div className="dc-sub">{d.sub}</div>}
          <div className="dc-status">
            <span className={statusDot(d.status)} />
            <span className="txt">{d.status.toUpperCase()}</span>
          </div>
        </div>
      </div>
    </button>
  );
}

function StatTile({ icon: Icon, label, value, unit, accent, footer }: { icon: any; label: string; value: string; unit?: string; accent: Accent; footer?: string }) {
  return (
    <div className={`dc-tile dc-stat ${accentClass(accent)}`}>
      <div className="dc-stat-head">
        <Icon className="h-4 w-4" />
        {footer && <span style={{ fontSize: 9, fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em", color: "oklch(from var(--muted-foreground) l c h / 0.6)", textTransform: "uppercase" }}>{footer}</span>}
      </div>
      <div className="dc-stat-val">
        <span className="v">{value}</span>
        {unit && <span className="u">{unit}</span>}
      </div>
      <div className="dc-stat-label">{label}</div>
      <div className="dc-underline" />
    </div>
  );
}

function DreameTile() {
  return (
    <div className="dc-tile" style={{ padding: "0.75rem", gridColumn: "span 2" }}>
      <div className="dc-row" style={{ gap: "0.75rem" }}>
        <div style={{ height: 40, width: 40, borderRadius: 999, border: "2px solid color-mix(in oklab, var(--neon-violet) 50%, transparent)", display: "flex", alignItems: "center", justifyContent: "center", background: "color-mix(in oklab, var(--neon-violet) 10%, transparent)" }}>
          <Bot className="h-5 w-5 dc-violet" />
        </div>
        <div style={{ flex: 1 }}>
          <div className="dc-name" style={{ fontSize: 11 }}>Dreame</div>
          <div className="dc-status">
            <span className="dc-dot warn" />
            <span className="txt">UNAVAILABLE</span>
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <button style={{ padding: "4px 10px", borderRadius: 6, background: "color-mix(in oklab, var(--neon-lime) 10%, transparent)", border: "1px solid color-mix(in oklab, var(--neon-lime) 40%, transparent)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <Play className="h-3 w-3 dc-lime" />
            <span className="txt dc-lime">START</span>
          </button>
          <button style={{ padding: "4px 10px", borderRadius: 6, background: "oklch(1 0 0 / 0.05)", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
            <Home className="h-3 w-3 dc-muted" />
            <span className="txt dc-muted">HOME</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function SaraiyahRoom() {
  return (
    <div className="dc-tile" style={{ padding: "0.75rem", gridColumn: "span 2", position: "relative" }}>
      <div style={{ position: "absolute", top: 8, right: 12, display: "flex", alignItems: "center", gap: 6 }}>
        <span className="dc-dot" />
        <span className="txt dc-lime" style={{ fontFamily: "'Orbitron', monospace", fontSize: 9, letterSpacing: "0.1em" }}>HOME</span>
      </div>
      <div className="dc-row" style={{ gap: 12 }}>
        <div style={{ textAlign: "center" }}>
          <div className="dc-name">Saraiyah</div>
          <div className="dc-amber" style={{ fontFamily: "'Orbitron', monospace", fontSize: "1.5rem", fontWeight: 700, marginTop: 2 }}>28°</div>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 4, marginTop: 4 }}>
            <button style={{ height: 20, width: 20, borderRadius: 4, background: "oklch(1 0 0 / 0.05)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Minus className="h-3 w-3 dc-muted" /></button>
            <span className="txt dc-muted" style={{ fontFamily: "'Orbitron', monospace", fontSize: 9 }}>85°</span>
            <button style={{ height: 20, width: 20, borderRadius: 4, background: "oklch(1 0 0 / 0.05)", border: "1px solid var(--border)", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}><Plus className="h-3 w-3 dc-muted" /></button>
          </div>
        </div>
        <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          <div style={{ borderRadius: 8, background: "oklch(1 0 0 / 0.05)", border: "1px solid var(--border)", padding: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Sun className="h-3 w-3 dc-amber" /><span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--muted-foreground)" }}>Light</span></div>
            <div style={{ fontSize: 10, fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em", color: "oklch(from var(--foreground) l c h / 0.8)", marginTop: 4 }}>OFF</div>
          </div>
          <div style={{ borderRadius: 8, background: "oklch(1 0 0 / 0.05)", border: "1px solid var(--border)", padding: 8 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}><Fan className="h-3 w-3 dc-cyan" /><span style={{ fontSize: 9, textTransform: "uppercase", letterSpacing: "0.15em", color: "var(--muted-foreground)" }}>Fan</span></div>
            <div style={{ fontSize: 10, fontFamily: "'Orbitron', monospace", letterSpacing: "0.1em", color: "oklch(from var(--foreground) l c h / 0.8)", marginTop: 4 }}>OFF</div>
          </div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 0, right: 0, bottom: 0, height: 1, background: "linear-gradient(90deg, transparent, var(--neon-lime), transparent)", opacity: 0.6 }} />
    </div>
  );
}

export function DevicesConditions() {
  return (
    <>
      <style>{dcStyles}</style>
      <section className="dc-section" style={{ flexShrink: 0 }}>
        <div className="dc-header">
          <h2>Devices &amp; Conditions</h2>
          <div className="dc-rule" />
        </div>
        <div className="dc-grid">
          {devices.map((d) => <Tile key={d.id} d={d} />)}
        </div>
        <div className="dc-grid" style={{ marginTop: 8 }}>
          <StatTile icon={Thermometer} label="Hot Water" value="—" unit="°F" accent="magenta" />
          <StatTile icon={Zap} label="Energy" value="1.17" unit="kW" accent="amber" footer="tap for details" />
          <DreameTile />
          <SaraiyahRoom />
          <StatTile icon={Droplets} label="Humidity" value="—" unit="%" accent="cyan" />
        </div>
      </section>
    </>
  );
}

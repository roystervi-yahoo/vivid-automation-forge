// /home/react-dash/dashboard/src/components/esphome/ESPHomeDashboard.jsx
// Full-screen ESPHome page — device list + device detail, covers 100vw × 100vh
import React, { useState, useEffect, useCallback } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001';

const TYPE_ICON  = {
  Sensor:'📊', BinarySensor:'🔵', Switch:'🔌', Light:'💡',
  Fan:'🌀', Button:'🔘', MediaPlayer:'🔊', TextSensor:'📝',
  Climate:'🌡️', Number:'🔢', Select:'📋', Cover:'🪟',
  Lock:'🔒', Text:'✏️', Siren:'🚨',
};
const TYPE_COLOR = {
  Sensor:'#00ffff', BinarySensor:'#44aaff', Switch:'#44ff88', Light:'#ffee44',
  Fan:'#00ccff', Button:'#ffaa44', MediaPlayer:'#aa44ff', TextSensor:'#00ffaa',
  Climate:'#ff6644', Number:'#ff88ff', Select:'#88ffaa', Cover:'#ffcc44',
  Lock:'#ff4488', Text:'#88ccff', Siren:'#ff4444',
};
const CONTROLLABLE = new Set(['Switch','Light','Button','Fan','Climate','Cover','Number','Select','Lock','MediaPlayer','Siren','Text']);
const TYPE_ORDER   = ['Button','Switch','Light','Fan','Cover','Climate','Number','Select','Lock','MediaPlayer','Siren','Text','BinarySensor','Sensor','TextSensor'];
const statusColor  = s => s === 'online' ? '#44ff88' : s === 'connecting' ? '#ffaa44' : '#ff4444';

// ─────────────────────────────────────────────────────────────
// Root — decides which view to show
// ─────────────────────────────────────────────────────────────
function ESPHomeDashboard({ activeDevice, onOpenDevice, onBack }) {
  const [globalDashUrl, setGlobalDashUrl] = useState('');

  useEffect(() => {
    fetch(`${API_BASE}/api/esp/settings`)
      .then(r => r.json())
      .then(d => setGlobalDashUrl(d.dashboardUrl || ''))
      .catch(() => {});
  }, []);

  if (activeDevice) {
    return (
      <FullScreenWrap>
        <DeviceDetailView
          device={activeDevice}
          onBack={onBack}
          hasDashboardGlobal={!!globalDashUrl}
        />
      </FullScreenWrap>
    );
  }
  return (
    <FullScreenWrap>
      <DeviceListView
        onOpenDevice={onOpenDevice}
        onBack={onBack}
      />
    </FullScreenWrap>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared full-screen wrapper
// ─────────────────────────────────────────────────────────────
function FullScreenWrap({ children }) {
  return (
    <div style={{
      position:        'fixed',
      top: 0, left: 0, right: 0, bottom: 0,
      zIndex:          9999,
      backgroundColor: '#060d1f',
      color:           '#fff',
      display:         'flex',
      flexDirection:   'column',
      fontFamily:      "'Courier New', monospace",
      overflow:        'hidden',
      backgroundImage: `
        radial-gradient(circle at 20% 20%, rgba(0,200,255,0.06) 0%, transparent 50%),
        radial-gradient(circle at 80% 80%, rgba(0,100,200,0.04) 0%, transparent 50%)
      `,
    }}>
      {children}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Shared header bar
// ─────────────────────────────────────────────────────────────
function PageHeader({ title, subtitle, onBack, backLabel = '← Back', extra }) {
  return (
    <div style={{
      padding:         '16px 28px',
      borderBottom:    '1px solid rgba(0,200,255,.2)',
      backgroundColor: 'rgba(0,0,0,.5)',
      display:         'flex',
      alignItems:      'center',
      gap:             20,
      flexShrink:      0,
      backdropFilter:  'blur(12px)',
    }}>
      <button onClick={onBack} style={{
        padding: '8px 18px', borderRadius: 9, cursor: 'pointer', flexShrink: 0,
        border: '1px solid rgba(255,255,255,.2)', background: 'rgba(255,255,255,.07)',
        color: '#fff', fontSize: 13, fontWeight: 700, letterSpacing: 0.5,
        transition: 'all .2s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.14)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.07)'}
      >{backLabel}</button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 20, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 3,
          background: 'linear-gradient(90deg, #00ffff, #0088ff)',
          WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>{title}</div>
        {subtitle && (
          <div style={{ fontSize: 11, color: 'rgba(255,255,255,.75)', marginTop: 3 }}>
            {subtitle}
          </div>
        )}
      </div>

      {extra}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Device List View
// ─────────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────────
// Device List View — table layout with tags, search, filter
// ─────────────────────────────────────────────────────────────

const TAG_COLORS = {
  Switch:       { bg:'rgba(14,165,233,.18)',  color:'#38bdf8' },
  Light:        { bg:'rgba(250,204,21,.15)',  color:'#fde047' },
  Fan:          { bg:'rgba(167,139,250,.18)', color:'#c4b5fd' },
  Sensor:       { bg:'rgba(34,197,94,.15)',   color:'#86efac' },
  BinarySensor: { bg:'rgba(248,113,113,.15)', color:'#fca5a5' },
  Cover:        { bg:'rgba(244,114,182,.15)', color:'#f9a8d4' },
  Button:       { bg:'rgba(251,146,60,.18)',  color:'#fdba74' },
  Climate:      { bg:'rgba(255,100,50,.15)',  color:'#ff8866' },
  MediaPlayer:  { bg:'rgba(170,68,255,.18)',  color:'#cc88ff' },
  TextSensor:   { bg:'rgba(0,255,170,.12)',   color:'#00ffaa' },
  Number:       { bg:'rgba(255,136,255,.15)', color:'#ff88ff' },
  Select:       { bg:'rgba(136,255,170,.12)', color:'#88ffaa' },
  Lock:         { bg:'rgba(255,68,136,.15)',  color:'#ff6699' },
};

function getTagsFromEntities(entities) {
  const types = [...new Set((entities || []).map(e => e.type))];
  return types.filter(t => t && t !== 'TextSensor');
}

function getConnectionType(entities) {
  if (!entities || entities.length === 0) return null;
  // WiFi devices always expose these entities in ESPHome
  const wifiKeywords = ['wifi', 'rssi', 'signal', 'ssid', 'bssid', 'ip_address', 'mac_address'];
  const hasWifi = entities.some(e => {
    const id   = (e.objectId || '').toLowerCase();
    const name = (e.name || '').toLowerCase();
    return wifiKeywords.some(k => id.includes(k) || name.includes(k));
  });
  // Ethernet devices expose these instead
  const ethKeywords = ['ethernet', 'eth0', 'wired'];
  const hasEth = entities.some(e => {
    const id   = (e.objectId || '').toLowerCase();
    const name = (e.name || '').toLowerCase();
    return ethKeywords.some(k => id.includes(k) || name.includes(k));
  });
  if (hasEth) return 'ethernet';
  if (hasWifi) return 'wifi';
  // Default to wifi — most ESPHome devices are WiFi
  return 'wifi';
}

function DeviceListView({ onOpenDevice, onBack }) {
  const [devices,      setDevices]      = useState([]);
  const [entityMap,    setEntityMap]    = useState({}); // { deviceId: [entities] }
  const [loading,      setLoading]      = useState(true);
  const [showAdd,      setShowAdd]      = useState(false);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState(null);
  const [newDevice,    setNewDevice]    = useState({ name:'', ip:'', port:'6053', apiKey:'' });
  const [dashboardUrl, setDashboardUrl] = useState('');
  const [urlSaved,     setUrlSaved]     = useState(false);
  const [editDevice,   setEditDevice]   = useState(null);
  const [editSaving,   setEditSaving]   = useState(false);
  const [search,       setSearch]       = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [colOrder,     setColOrder]     = useState(['ip','status','ents','tags']);
  const [dragCol,      setDragCol]      = useState(null);

  // Load column order from DB
  useEffect(() => {
    fetch(`${API_BASE}/api/settings/esp-col-order`)
      .then(r => r.json())
      .then(d => { if (Array.isArray(d)) setColOrder(d); })
      .catch(() => {});
  }, []);

  const hasDashboardGlobal = !!dashboardUrl;
  const COL_WIDTHS = { ip:'160px', status:'170px', ents:'60px', tags:'1fr' };
  const gridTemplate = `180px ${colOrder.map(c => COL_WIDTHS[c]).join(' ')} 140px`;

  const loadSettings = async () => {
    try {
      const r = await fetch(`${API_BASE}/api/esp/settings`);
      const d = await r.json();
      setDashboardUrl(d.dashboardUrl || '');
    } catch {}
  };

  const saveSettings = async () => {
    try {
      await fetch(`${API_BASE}/api/esp/settings`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dashboardUrl }),
      });
      setUrlSaved(true);
      setTimeout(() => setUrlSaved(false), 2000);
    } catch {}
  };

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/esp/devices`);
      const devs = await r.json();
      setDevices(devs);
      // Load entities for each online device to get tags
      const map = {};
      await Promise.all(devs.filter(d => d.status === 'online').map(async d => {
        try {
          const er = await fetch(`${API_BASE}/api/esp/devices/${d.id}/entities`);
          if (er.ok) map[d.id] = await er.json();
        } catch {}
      }));
      setEntityMap(map);
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); loadSettings(); }, []);

  useEffect(() => {
    const iv = setInterval(async () => {
      try {
        const r    = await fetch(`${API_BASE}/api/esp/status`);
        const data = await r.json();
        setDevices(prev => prev.map(d => {
          const s = data.devices?.find(x => x.id === d.id);
          return s ? { ...d, status: s.status, entityCount: s.entityCount } : d;
        }));
      } catch {}
    }, 8000);
    return () => clearInterval(iv);
  }, []);

  const addDevice = async () => {
    if (!newDevice.name || !newDevice.ip) { setError('Name and IP are required'); return; }
    setSaving(true); setError(null);
    try {
      const r    = await fetch(`${API_BASE}/api/esp/devices`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify(newDevice),
      });
      const data = await r.json();
      if (data.success) { setShowAdd(false); setNewDevice({ name:'', ip:'', port:'6053', apiKey:'' }); await load(); }
      else setError(data.error);
    } catch(e) { setError(e.message); }
    setSaving(false);
  };

  const removeDevice = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    await fetch(`${API_BASE}/api/esp/devices/${id}`, { method: 'DELETE' });
    load();
  };

  const saveEdit = async () => {
    if (!editDevice.name || !editDevice.ip) return;
    setEditSaving(true);
    try {
      await fetch(`${API_BASE}/api/esp/devices/${editDevice.id}`, {
        method: 'PUT', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editDevice),
      });
      setEditDevice(null);
      await load();
    } catch(e) { console.error(e); }
    setEditSaving(false);
  };

  const reconnect = async (id) => {
    await fetch(`${API_BASE}/api/esp/devices/${id}/reconnect`, { method: 'POST' });
    setTimeout(load, 2000);
  };

  // Build filter options from all entity types across all devices
  const allTypes = [...new Set(
    Object.values(entityMap).flat().map(e => e.type).filter(Boolean)
  )].sort();

  // Filter counts
  const filterCounts = {};
  allTypes.forEach(t => {
    filterCounts[t] = devices.filter(d => entityMap[d.id]?.some(e => e.type === t)).length;
  });

  // Apply search + filter
  const filtered = devices.filter(d => {
    const matchSearch = !search || d.name.toLowerCase().includes(search.toLowerCase()) || d.ip.includes(search);
    const matchFilter = activeFilter === 'All' || entityMap[d.id]?.some(e => e.type === activeFilter);
    return matchSearch && matchFilter;
  });

  const online = devices.filter(d => d.status === 'online').length;

  const inputStyle = {
    padding: '8px 12px', borderRadius: 8, border: '1px solid rgba(0,200,255,.25)',
    background: 'rgba(0,0,0,.3)', color: '#fff', fontSize: 12, outline: 'none',
    fontFamily: 'monospace',
  };

  return (
    <>
      <PageHeader
        title="ESPHome Devices"
        subtitle={`${online} of ${devices.length} online`}
        onBack={onBack}
        backLabel="✕ Close"
        extra={
          <button onClick={() => { setShowAdd(true); setError(null); }} style={{
            padding: '9px 20px', borderRadius: 9, cursor: 'pointer', fontWeight: 900,
            border: '1px solid rgba(0,200,255,.5)', background: 'rgba(0,200,255,.15)',
            color: '#00ffff', fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0,
          }}>+ Add Device</button>
        }
      />

      {/* ── OTA URL bar ── */}
      <div style={{ padding: '10px 28px', borderBottom: '1px solid rgba(255,170,68,.12)',
        background: 'rgba(255,170,68,.03)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
        <span style={{ fontSize: 10, color: '#ffaa44', fontWeight: 700, textTransform: 'uppercase',
          letterSpacing: 1, flexShrink: 0 }}>🔄 OTA URL</span>
        <input value={dashboardUrl} onChange={e => setDashboardUrl(e.target.value)}
          placeholder="http://192.168.1.69:6052"
          style={{ ...inputStyle, flex: 1 }}
          onKeyDown={e => e.key === 'Enter' && saveSettings()}
        />
        <button onClick={saveSettings} style={{
          padding: '7px 14px', borderRadius: 7, cursor: 'pointer', fontWeight: 900,
          border: '1px solid rgba(255,170,68,.4)', background: 'rgba(255,170,68,.12)',
          color: urlSaved ? '#44ff88' : '#ffaa44', fontSize: 11, letterSpacing: 1, flexShrink: 0,
        }}>{urlSaved ? '✓ Saved' : 'Save'}</button>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 28px 60px' }}>

        {error && (
          <div style={{ padding: '10px 14px', borderRadius: 10, fontSize: 12, color: '#ff6666',
            marginBottom: 16, background: 'rgba(255,60,60,.12)', border: '1px solid rgba(255,60,60,.35)' }}>
            ⚠️ {error}
          </div>
        )}

        {/* ── Add Form ── */}
        {showAdd && (
          <div style={{ background:'rgba(0,200,255,.05)', border:'1px solid rgba(0,200,255,.2)',
            borderRadius:14, padding:20, marginBottom:20, display:'flex', flexDirection:'column', gap:12 }}>
            <div style={{ fontSize:13, fontWeight:900, color:'#00ffff', textTransform:'uppercase', letterSpacing:2 }}>
              New ESPHome Device
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              {[
                { key:'name',   label:'Device Name',    placeholder:'e.g. den-fan',               type:'text'     },
                { key:'ip',     label:'IP Address',     placeholder:'e.g. 192.168.1.92',           type:'text'     },
                { key:'port',   label:'Port',           placeholder:'6053',                         type:'text'     },
                { key:'apiKey', label:'Encryption Key', placeholder:'Base64 key (blank if none)',   type:'password' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,.6)', textTransform:'uppercase',
                    letterSpacing:1, marginBottom:4 }}>{f.label}</div>
                  <input type={f.type} value={newDevice[f.key]}
                    onChange={e => setNewDevice(p => ({ ...p, [f.key]: e.target.value }))}
                    placeholder={f.placeholder}
                    style={{ ...inputStyle, width:'100%', boxSizing:'border-box', fontSize:12 }}
                  />
                </div>
              ))}
            </div>
            <div style={{ display:'flex', gap:8 }}>
              <button onClick={addDevice} disabled={saving} style={{
                flex:1, padding:'9px 0', borderRadius:8, border:'none', cursor:'pointer',
                background: saving ? 'rgba(0,200,255,.2)' : '#00ccff',
                color:'#000', fontWeight:900, fontSize:12, textTransform:'uppercase',
              }}>{saving ? 'Connecting...' : '✓ Add Device'}</button>
              <button onClick={() => { setShowAdd(false); setError(null); }} style={{
                padding:'9px 18px', borderRadius:8, cursor:'pointer', fontSize:12,
                border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.05)', color:'rgba(255,255,255,.7)',
              }}>Cancel</button>
            </div>
          </div>
        )}

        {/* ── Search + Filter bar ── */}
        <div style={{ display:'flex', alignItems:'center', gap:10, marginBottom:14, flexWrap:'wrap' }}>
          <input
            value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search devices..."
            style={{ ...inputStyle, width:200, fontSize:12 }}
          />
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', flex:1 }}>
            {['All', ...allTypes].map(f => {
              const active = activeFilter === f;
              const count  = f === 'All' ? devices.length : (filterCounts[f] || 0);
              return (
                <button key={f} onClick={() => setActiveFilter(f)} style={{
                  padding: '4px 12px', borderRadius: 20, cursor: 'pointer',
                  fontSize: 11, fontWeight: 700, border: 'none',
                  background: active ? (TAG_COLORS[f]?.bg || 'rgba(0,200,255,.2)') : 'rgba(255,255,255,.06)',
                  color: active ? (TAG_COLORS[f]?.color || '#00ffff') : 'rgba(255,255,255,.5)',
                  transition: 'all .15s',
                }}>{f} ({count})</button>
              );
            })}
          </div>
        </div>

        {/* ── Table ── */}
        {loading ? (
          <div style={{ textAlign:'center', color:'#00ffff', padding:60, fontSize:13 }}>
            <div style={{ fontSize:32, marginBottom:12 }}>📡</div>Loading devices...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign:'center', color:'rgba(255,255,255,.3)', padding:60, fontSize:13,
            border:'1px dashed rgba(255,255,255,.08)', borderRadius:14 }}>
            {search ? `No devices matching "${search}"` : 'No devices added yet.'}
          </div>
        ) : (
          <div style={{ borderRadius:14, border:'1px solid rgba(255,255,255,.08)', overflow:'hidden' }}>
            {/* Table header — Device & Actions static, middle 4 draggable */}
            <div style={{ display:'grid', gridTemplateColumns:gridTemplate,
              padding:'8px 16px', background:'rgba(0,0,0,.3)', columnGap: '12px',
              borderBottom:'1px solid rgba(255,255,255,.08)' }}>
              {/* Static: Device */}
              <div style={{ fontSize:10, fontWeight:900, color:'rgba(255,255,255,.4)',
                textTransform:'uppercase', letterSpacing:1.5 }}>Device</div>
              {/* Draggable columns */}
              {colOrder.map(col => {
                const labels = { ip:'IP', status:'Status', ents:'Ents', tags:'Entity Types' };
                return (
                  <div key={col}
                    draggable
                    onDragStart={() => setDragCol(col)}
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => {
                      if (!dragCol || dragCol === col) return;
                      const from = colOrder.indexOf(dragCol);
                      const to   = colOrder.indexOf(col);
                      const next = [...colOrder];
                      next.splice(from, 1);
                      next.splice(to, 0, dragCol);
                      setColOrder(next);
                      fetch(`${API_BASE}/api/settings/esp-col-order`, {
                        method: 'POST', headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(next),
                      }).catch(() => {});
                      setDragCol(null);
                    }}
                    style={{
                      fontSize:10, fontWeight:900, letterSpacing:1.5,
                      textTransform:'uppercase', cursor:'grab',
                      color: dragCol === col ? '#00ffff' : 'rgba(255,255,255,.4)',
                      userSelect:'none', display:'flex', alignItems:'center', gap:5,
                      borderBottom: dragCol === col ? '2px solid #00ffff' : '2px solid transparent',
                      paddingBottom:2,
                    }}>
                    ⠿ {labels[col]}
                  </div>
                );
              })}
              {/* Static: Actions */}
              <div style={{ fontSize:10, fontWeight:900, color:'rgba(255,255,255,.4)',
                textTransform:'uppercase', letterSpacing:1.5 }}>Actions</div>
            </div>

            {/* Rows */}
            {filtered.map((d, i) => {
              const clr      = d.status === 'online' ? '#44ff88' : d.status === 'connecting' ? '#ffaa44' : '#ff4444';
              const tags     = getTagsFromEntities(entityMap[d.id]);
              const connType = getConnectionType(entityMap[d.id]);
              const isLast   = i === filtered.length - 1;

              return (
                <div key={d.id}
                  onClick={() => d.status === 'online' && onOpenDevice(d)}
                  style={{
                    display:'grid', gridTemplateColumns:gridTemplate,
                    padding:'11px 16px', alignItems:'center',
                    borderBottom: isLast ? 'none' : '1px solid rgba(255,255,255,.06)',
                    cursor: d.status === 'online' ? 'pointer' : 'default',
                    transition:'background .15s', background:'transparent', columnGap: '12px',
                  }}
                  onMouseEnter={e => { if(d.status==='online') e.currentTarget.style.background='rgba(0,200,255,.06)'; }}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}
                >
                  {/* Static: Name */}
                  <div style={{ fontSize:15, fontWeight:900, color:'#fff',
                    textTransform:'uppercase', letterSpacing:0.5 }}>{d.name}</div>

                  {/* Dynamic columns in colOrder */}
                  {colOrder.map(col => {
                    if (col === 'ip') return (
                      <div key="ip" style={{ fontSize:13, color:'rgba(255,255,255,.7)', fontFamily:'monospace' }}>
                        {d.ip}:{d.port || 6053}
                      </div>
                    );
                    if (col === 'status') return (
                      <div key="status" style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap' }}>
                        <div style={{ width:8, height:8, borderRadius:'50%', background:clr,
                          boxShadow:`0 0 6px ${clr}`, flexShrink:0 }}/>
                        <span style={{ fontSize:13, fontWeight:700, color:clr,
                          textTransform:'uppercase', letterSpacing:0.5 }}>{d.status}</span>
                        {connType && (
                          <span style={{
                            fontSize:11, fontWeight:700, padding:'2px 8px', borderRadius:10,
                            background: connType === 'wifi' ? 'rgba(56,189,248,.15)' : 'rgba(148,163,184,.12)',
                            color: connType === 'wifi' ? '#38bdf8' : '#94a3b8',
                            border: `1px solid ${connType === 'wifi' ? 'rgba(56,189,248,.3)' : 'rgba(148,163,184,.2)'}`,
                            textTransform:'uppercase', letterSpacing:0.5,
                          }}>{connType === 'wifi' ? '📶 WiFi' : '🔌 Eth'}</span>
                        )}
                      </div>
                    );
                    if (col === 'ents') return (
                      <div key="ents" style={{ fontSize:14, fontWeight:700, color:'rgba(255,255,255,.7)',
                        background:'rgba(255,255,255,.07)', borderRadius:20,
                        padding:'2px 8px', textAlign:'center', width:'fit-content' }}>
                        {d.entityCount || 0}
                      </div>
                    );
                    if (col === 'tags') return (
                      <div key="tags" style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {tags.length > 0 ? (
                          <>
                            {tags.slice(0, 5).map(t => {
                              const tc = TAG_COLORS[t] || { bg:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.5)' };
                              return (
                                <span key={t} style={{
                                  padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700,
                                  background:tc.bg, color:tc.color,
                                }}>{t}</span>
                              );
                            })}
                            {tags.length > 5 && (
                              <span style={{ padding:'3px 10px', borderRadius:20, fontSize:12, fontWeight:700,
                                background:'rgba(255,255,255,.08)', color:'rgba(255,255,255,.4)' }}>
                                +{tags.length - 5}
                              </span>
                            )}
                          </>
                        ) : <span style={{ fontSize:12, color:'rgba(255,255,255,.25)' }}>—</span>}
                      </div>
                    );
                    return null;
                  })}

                  {/* Actions */}
                  <div style={{ display:'flex', gap:5 }} onClick={e => e.stopPropagation()}>
                    <OTAButton deviceId={d.id} deviceName={d.name} hasDashboard={hasDashboardGlobal} />
                    <button onClick={() => setEditDevice({ ...d, apiKey:'' })} style={{
                      padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:700,
                      border:'1px solid rgba(0,200,255,.3)', background:'rgba(0,200,255,.08)', color:'#00ffff',
                    }}>✏️</button>
                    {d.status !== 'online' && (
                      <button onClick={() => reconnect(d.id)} style={{
                        padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:700,
                        border:'1px solid rgba(255,170,68,.35)', background:'rgba(255,170,68,.08)', color:'#ffaa44',
                      }}>↺</button>
                    )}
                    <button onClick={() => removeDevice(d.id, d.name)} style={{
                      padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:700,
                      border:'1px solid rgba(255,60,60,.35)', background:'rgba(255,60,60,.08)', color:'#ff6666',
                    }}>✕</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <style>{`@keyframes esp-pulse{0%,100%{opacity:1}50%{opacity:.6}}`}</style>
      </div>

      {/* ── Edit Modal ── */}
      {editDevice && (
        <div style={{ position:'fixed', inset:0, zIndex:20000, background:'rgba(0,0,0,.8)',
          backdropFilter:'blur(10px)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setEditDevice(null)}>
          <div style={{ width:460, maxWidth:'90vw',
            background:'linear-gradient(145deg,rgba(10,22,52,.99),rgba(6,12,32,.99))',
            border:'1px solid rgba(0,200,255,.3)', borderRadius:16, overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ padding:'16px 22px', borderBottom:'1px solid rgba(0,200,255,.12)',
              background:'rgba(0,200,255,.04)', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div style={{ fontSize:13, fontWeight:900, color:'#00ffff', textTransform:'uppercase', letterSpacing:2 }}>
                ✏️ Edit — {editDevice.name}
              </div>
              <button onClick={() => setEditDevice(null)} style={{ width:26, height:26, borderRadius:5,
                border:'none', background:'rgba(255,255,255,.08)', color:'#fff', cursor:'pointer', fontSize:13 }}>✕</button>
            </div>
            <div style={{ padding:'20px 22px', display:'flex', flexDirection:'column', gap:12 }}>
              {[
                { key:'name',   label:'Device Name',    type:'text',     hint:'' },
                { key:'ip',     label:'IP Address',     type:'text',     hint:'' },
                { key:'port',   label:'Port',           type:'text',     hint:'' },
                { key:'apiKey', label:'Encryption Key', type:'password', hint:'Leave blank to keep existing' },
              ].map(f => (
                <div key={f.key}>
                  <div style={{ fontSize:9, color:'rgba(255,255,255,.6)', textTransform:'uppercase',
                    letterSpacing:1, marginBottom:4, display:'flex', justifyContent:'space-between' }}>
                    <span>{f.label}</span>
                    {f.hint && <span style={{ color:'rgba(255,255,255,.3)', fontSize:9 }}>{f.hint}</span>}
                  </div>
                  <input type={f.type} value={editDevice[f.key] || ''}
                    onChange={e => setEditDevice(p => ({ ...p, [f.key]: e.target.value }))}
                    style={{ ...inputStyle, width:'100%', boxSizing:'border-box' }}
                  />
                </div>
              ))}
              <div style={{ display:'flex', gap:8, marginTop:4 }}>
                <button onClick={saveEdit} disabled={editSaving} style={{
                  flex:1, padding:'10px 0', borderRadius:8, border:'none', cursor:'pointer',
                  background: editSaving ? 'rgba(0,200,255,.2)' : '#00ccff',
                  color:'#000', fontWeight:900, fontSize:12, textTransform:'uppercase',
                }}>{editSaving ? 'Saving...' : '✓ Save Changes'}</button>
                <button onClick={() => setEditDevice(null)} style={{
                  padding:'10px 18px', borderRadius:8, cursor:'pointer', fontSize:12,
                  border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.05)',
                  color:'rgba(255,255,255,.7)',
                }}>Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Device Detail View — full controls
// ─────────────────────────────────────────────────────────────
function DeviceDetailView({ device, onBack, hasDashboardGlobal = false }) {
  const [entities, setEntities] = useState([]);
  const [states,   setStates]   = useState({});
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);
  const [pending,  setPending]  = useState({});
  const [toast,    setToast]    = useState(null);

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const [eRes, sRes] = await Promise.all([
          fetch(`${API_BASE}/api/esp/devices/${device.id}/entities`),
          fetch(`${API_BASE}/api/esp/devices/${device.id}/states`),
        ]);
        const ents = await eRes.json();
        const sts  = await sRes.json();
        setEntities(Array.isArray(ents) ? ents : []);
        setStates(sts || {});
      } catch(e) { setError(e.message); }
      setLoading(false);
    };
    load();
    const iv = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/esp/devices/${device.id}/states`);
        if (r.ok) setStates(await r.json());
      } catch {}
    }, 2000);
    return () => clearInterval(iv);
  }, [device.id]);

  const sendCommand = useCallback(async (entity, commandData) => {
    const key = entity.key;
    setPending(p => ({ ...p, [key]: true }));
    try {
      const r = await fetch(`${API_BASE}/api/esp/devices/${device.id}/command`, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ entityKey: key, type: entity.type, ...commandData }),
      });
      const data = await r.json();
      if (!data.success) showToast(data.error || 'Command failed', false);
    } catch(e) { showToast(e.message, false); }
    finally { setPending(p => { const n = { ...p }; delete n[key]; return n; }); }
  }, [device.id]);

  const getStateVal       = e => states[e.objectId];
  const getBoolState      = e => {
    const sv = getStateVal(e);
    if (!sv) return false;
    if (typeof sv.state === 'boolean') return sv.state;
    const s = String(sv.state ?? '');
    return s === 'on' || s === 'true' || s === '1';
  };
  const getNumericDisplay = e => {
    const sv = getStateVal(e);
    if (!sv) return '—';
    const n = parseFloat(sv.state);
    if (isNaN(n)) return String(sv.state ?? '—').slice(0, 24);
    return `${Math.round(n * 10) / 10}${sv.unitOfMeasurement || ''}`;
  };

  const byType = entities.reduce((acc, e) => {
    (acc[e.type] = acc[e.type] || []).push(e); return acc;
  }, {});
  const sortedTypes = Object.keys(byType).sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a); const bi = TYPE_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  const clr = statusColor(device.status);

  return (
    <>
      <PageHeader
        title={device.name}
        subtitle={`${device.ip}  ·  ${device.status?.toUpperCase()}  ·  ${entities.length} entities`}
        onBack={onBack}
        backLabel="← Devices"
        extra={<OTAButton deviceId={device.id} deviceName={device.name} hasDashboard={hasDashboardGlobal} large />}
      />

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', top: 72, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10001, padding: '9px 20px', borderRadius: 9, fontSize: 12, fontWeight: 700,
          background: toast.ok ? 'rgba(68,255,136,.18)' : 'rgba(255,60,60,.18)',
          border: `1px solid ${toast.ok ? 'rgba(68,255,136,.5)' : 'rgba(255,60,60,.5)'}`,
          color: toast.ok ? '#44ff88' : '#ff6666',
          boxShadow: '0 4px 24px rgba(0,0,0,.6)', pointerEvents: 'none', whiteSpace: 'nowrap',
        }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px 60px' }}>

        {loading && (
          <div style={{ textAlign: 'center', color: '#00ffff', padding: 80, fontSize: 14 }}>
            <div style={{ fontSize: 36, marginBottom: 16 }}>📡</div>Loading entities...
          </div>
        )}
        {error && (
          <div style={{ textAlign: 'center', color: '#ff4444', padding: 80, fontSize: 13 }}>
            Error: {error}
          </div>
        )}
        {!loading && !error && entities.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.7)', padding: 80, fontSize: 13 }}>
            No entities found for this device.
          </div>
        )}

        {!loading && !error && sortedTypes.map(type => {
          const items   = byType[type];
          const tColor  = TYPE_COLOR[type] || '#00ffff';
          const tIcon   = TYPE_ICON[type]  || '📡';
          const canCtrl = CONTROLLABLE.has(type);

          return (
            <div key={type} style={{ marginBottom: 24 }}>

              {/* ── Slim section label ── */}
              <div style={{
                display:        'flex',
                alignItems:     'center',
                gap:            10,
                marginBottom:   12,
                paddingLeft:    12,
                borderLeft:     `3px solid ${tColor}`,
              }}>
                <span style={{ fontSize: 15 }}>{tIcon}</span>
                <span style={{
                  fontSize: 11, fontWeight: 900, color: tColor,
                  textTransform: 'uppercase', letterSpacing: 2,
                }}>{type}s</span>
                <span style={{
                  fontSize: 10, color: 'rgba(255,255,255,.7)',
                  background: 'rgba(255,255,255,.06)', borderRadius: 99,
                  padding: '1px 8px', fontWeight: 700,
                }}>{items.length}</span>
                {canCtrl && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 8, color: tColor + '77',
                    textTransform: 'uppercase', letterSpacing: 1,
                    background: tColor + '12', borderRadius: 99,
                    padding: '2px 8px', border: `1px solid ${tColor}22`,
                  }}>● ctrl</span>
                )}
              </div>

              {/* ── 3-col grid, always fills full width ── */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(4, 1fr)',
                gap: 12,
              }}>
                {items.map(e => (
                  <EntityCard
                    key={e.key}
                    entity={e}
                    stateVal={getStateVal(e)}
                    boolState={getBoolState(e)}
                    numericDisplay={getNumericDisplay(e)}
                    isPending={!!pending[e.key]}
                    tColor={tColor}
                    tIcon={tIcon}
                    canCtrl={canCtrl}
                    onCommand={sendCommand}
                  />
                ))}
              </div>
            </div>
          );
        })}

        <style>{`@keyframes esp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// OTA Update Button + Progress Modal
// ─────────────────────────────────────────────────────────────
function OTAButton({ deviceId, deviceName, hasDashboard = false, large = false }) {
  const [phase,     setPhase]     = useState(null);
  const [logs,      setLogs]      = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [showCfg,   setShowCfg]   = useState(false);
  const logsEndRef = React.useRef(null);

  const scrollToBottom = () => logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  React.useEffect(() => { scrollToBottom(); }, [logs]);

  const runUpdate = async () => {
    if (!hasDashboard) { setShowCfg(true); return; }
    setLogs([]); setPhase('compile'); setShowModal(true);
    try {
      const res = await fetch(`${API_BASE}/api/esp/devices/${deviceId}/update`, { method: 'POST' });
      if (!res.body) { setPhase('error'); setLogs(['No response stream']); return; }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buf = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const parts = buf.split('\n\n');
        buf = parts.pop();
        for (const part of parts) {
          const line = part.replace(/^data: /, '').trim();
          if (!line) continue;
          try {
            const evt = JSON.parse(line);
            if (evt.type === 'phase') { setPhase(evt.phase); setLogs(p => [...p, `▶ ${evt.msg}`]); }
            if (evt.type === 'log')   { setLogs(p => [...p, evt.msg]); }
            if (evt.type === 'done')  { setPhase('done');  setLogs(p => [...p, evt.msg]); }
            if (evt.type === 'error') { setPhase('error'); setLogs(p => [...p, `✗ ${evt.msg}`]); }
          } catch {}
        }
      }
    } catch (e) { setPhase('error'); setLogs(p => [...p, `✗ ${e.message}`]); }
  };

  const phaseColor = phase === 'done' ? '#44ff88' : phase === 'error' ? '#ff4444' : '#ffaa44';
  const phaseLabel = { compile:'Compiling...', upload:'Uploading...', done:'Done!', error:'Failed' }[phase] || 'OTA Update';

  const btnStyle = large ? {
    padding: '9px 20px', borderRadius: 9, cursor: 'pointer', fontWeight: 900,
    fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, flexShrink: 0,
    border: `1px solid ${hasDashboard ? 'rgba(255,170,68,.5)' : 'rgba(255,255,255,.25)'}`,
    background: hasDashboard ? 'rgba(255,170,68,.15)' : 'rgba(255,255,255,.06)',
    color: hasDashboard ? '#ffaa44' : 'rgba(255,255,255,.7)', transition: 'all .2s',
  } : {
    padding: '4px 12px', borderRadius: 7, cursor: 'pointer', fontSize: 10, fontWeight: 700,
    border: `1px solid ${hasDashboard ? 'rgba(255,170,68,.35)' : 'rgba(255,255,255,.2)'}`,
    background: hasDashboard ? 'rgba(255,170,68,.08)' : 'rgba(255,255,255,.04)',
    color: hasDashboard ? '#ffaa44' : 'rgba(255,255,255,.6)',
    textTransform: 'uppercase', letterSpacing: 0.5,
  };

  return (
    <>
      <button onClick={runUpdate} style={btnStyle}>
        🔄 {large ? 'OTA Update' : 'Update'}{!hasDashboard ? ' ⚙' : ''}
      </button>

      {/* Not configured — explain what to do */}
      {showCfg && (
        <div style={{ position:'fixed', inset:0, zIndex:20000, background:'rgba(0,0,0,.75)',
          backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => setShowCfg(false)}>
          <div style={{ width:440, background:'linear-gradient(145deg,rgba(12,22,50,.99),rgba(6,12,30,.99))',
            border:'1px solid rgba(255,170,68,.4)', borderRadius:16, padding:28,
            boxShadow:'0 0 40px rgba(255,170,68,.15), 0 20px 60px rgba(0,0,0,.7)' }}
            onClick={e => e.stopPropagation()}>
            <div style={{ fontSize:15, fontWeight:900, color:'#ffaa44', marginBottom:12,
              textTransform:'uppercase', letterSpacing:1 }}>⚙ OTA Not Configured</div>
            <div style={{ fontSize:12, color:'rgba(255,255,255,.8)', lineHeight:1.8, marginBottom:22 }}>
              To enable OTA updates for <strong style={{ color:'#fff' }}>{deviceName}</strong>,
              set the ESPHome Dashboard URL in the settings bar at the top of this page:<br/><br/>
              <code style={{ color:'#00ffff', fontSize:12 }}>http://192.168.1.69:6052</code><br/><br/>
              Set it once — it applies to all devices automatically.<br/>
              The device name is used as the YAML filename.
            </div>
            <button onClick={() => setShowCfg(false)} style={{ width:'100%', padding:'10px 0',
              borderRadius:9, border:'none', cursor:'pointer', background:'rgba(255,170,68,.8)',
              color:'#000', fontWeight:900, fontSize:12, textTransform:'uppercase', letterSpacing:1 }}>
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Progress Modal */}
      {showModal && (
        <div style={{ position:'fixed', inset:0, zIndex:20000, background:'rgba(0,0,0,.75)',
          backdropFilter:'blur(8px)', display:'flex', alignItems:'center', justifyContent:'center' }}
          onClick={() => { if (phase==='done'||phase==='error'){ setShowModal(false); setPhase(null); } }}>
          <div style={{ width:560, maxWidth:'90vw',
            background:'linear-gradient(145deg,rgba(10,20,50,.99),rgba(6,12,30,.99))',
            border:`1px solid ${phaseColor}44`, borderRadius:18,
            boxShadow:`0 0 40px ${phaseColor}22, 0 20px 60px rgba(0,0,0,.7)`, overflow:'hidden' }}
            onClick={e => e.stopPropagation()}>

            <div style={{ padding:'18px 22px', borderBottom:`1px solid ${phaseColor}22`,
              display:'flex', alignItems:'center', gap:14, background:`${phaseColor}08` }}>
              {phase!=='done'&&phase!=='error' ? (
                <div style={{ width:22, height:22, border:`2px solid ${phaseColor}33`,
                  borderTopColor:phaseColor, borderRadius:'50%',
                  animation:'esp-spin .8s linear infinite', flexShrink:0 }}/>
              ) : <span style={{ fontSize:20 }}>{phase==='done'?'✅':'❌'}</span>}
              <div style={{ flex:1 }}>
                <div style={{ fontSize:15, fontWeight:900, color:'#fff',
                  textTransform:'uppercase', letterSpacing:1 }}>OTA Update — {deviceName}</div>
                <div style={{ fontSize:11, color:phaseColor, marginTop:2, fontWeight:700 }}>{phaseLabel}</div>
              </div>
              {(phase==='done'||phase==='error') && (
                <button onClick={() => { setShowModal(false); setPhase(null); }} style={{
                  padding:'5px 14px', borderRadius:7, cursor:'pointer', fontSize:11, fontWeight:700,
                  border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.07)', color:'#fff' }}>
                  Close
                </button>
              )}
            </div>

            <div style={{ padding:'14px 22px 0', display:'flex', gap:8 }}>
              {[{id:'compile',label:'1. Compile'},{id:'upload',label:'2. Upload'},{id:'done',label:'3. Done'}].map(s => {
                const done = (s.id==='compile'&&(phase==='upload'||phase==='done'))||(s.id==='upload'&&phase==='done')||(s.id==='done'&&phase==='done');
                const cur  = phase===s.id;
                const clr  = done?'#44ff88':cur?'#ffaa44':'rgba(255,255,255,.3)';
                return (
                  <div key={s.id} style={{ display:'flex', alignItems:'center', gap:6, flex:1 }}>
                    <div style={{ width:8, height:8, borderRadius:'50%', background:clr,
                      boxShadow:cur?`0 0 8px ${clr}`:'none', flexShrink:0 }}/>
                    <span style={{ fontSize:10, color:clr, fontWeight:700,
                      textTransform:'uppercase', letterSpacing:0.5 }}>{s.label}</span>
                    {s.id!=='done'&&<div style={{ flex:1, height:1, background:clr+'40', marginLeft:4 }}/>}
                  </div>
                );
              })}
            </div>

            <div style={{ margin:'14px 22px 22px', background:'rgba(0,0,0,.5)', borderRadius:10,
              border:'1px solid rgba(255,255,255,.07)', height:220, overflowY:'auto',
              padding:'12px 14px', fontFamily:'monospace', fontSize:11, lineHeight:1.6 }}>
              {logs.length===0&&<span style={{ color:'rgba(255,255,255,.5)' }}>Starting...</span>}
              {logs.map((l,i) => (
                <div key={i} style={{
                  color:l.startsWith('✗')?'#ff6666':l.startsWith('▶')?'#ffaa44':'rgba(255,255,255,.8)',
                  marginBottom:2, fontWeight:l.startsWith('▶')?700:400 }}>{l}</div>
              ))}
              <div ref={logsEndRef}/>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────────
// Entity Card
// ─────────────────────────────────────────────────────────────
function EntityCard({ entity, stateVal, boolState, numericDisplay, isPending, tColor, tIcon, canCtrl, onCommand }) {
  const type        = entity.type;
  const isOn        = boolState;
  const brightness  = stateVal?.brightness != null ? Math.round(stateVal.brightness * 100) : null;
  const fanSpeed    = stateVal?.speedLevel ?? stateVal?.speed ?? null;
  const fanOscil    = stateVal?.oscillating ?? false;
  const climateMode = stateVal?.mode ?? null;
  const targetTemp  = stateVal?.targetTemperature ?? null;
  const numMin      = entity.config?.minValue ?? 0;
  const numMax      = entity.config?.maxValue ?? 100;
  const numStep     = entity.config?.step ?? 1;
  const numVal      = parseFloat(stateVal?.state) || 0;
  const selectOpts  = entity.config?.optionsList ?? [];
  const selectVal   = stateVal?.state ?? '';
  const coverPos    = stateVal?.position != null ? Math.round(stateVal.position * 100) : null;

  const glowOn = isOn && canCtrl && type !== 'Button';

  return (
    <div style={{
      background:   glowOn
        ? `linear-gradient(145deg, ${tColor}14, ${tColor}06, rgba(8,16,40,.98))`
        : 'linear-gradient(145deg, rgba(12,22,50,.98), rgba(8,16,40,.98))',
      border:       `1px solid ${glowOn ? tColor + '50' : 'rgba(255,255,255,.07)'}`,
      borderRadius: 14,
      padding:      '14px 16px 12px',
      boxShadow:    glowOn
        ? `0 0 24px ${tColor}15, 0 6px 20px rgba(0,0,0,.5), inset 0 1px 0 ${tColor}18`
        : '0 4px 16px rgba(0,0,0,.4), inset 0 1px 0 rgba(255,255,255,.04)',
      transition:   'all .2s',
      opacity:      isPending ? 0.6 : 1,
      position:     'relative',
      overflow:     'hidden',
      display:      'flex',
      flexDirection:'column',
      gap:          10,
    }}>

      {/* Left-edge glow bar */}
      <div style={{
        position: 'absolute', top: 0, left: 0, bottom: 0, width: 3,
        background: glowOn ? tColor : 'rgba(255,255,255,.05)',
        borderRadius: '14px 0 0 14px',
        boxShadow: glowOn ? `0 0 8px ${tColor}` : 'none',
        transition: 'all .2s',
      }}/>

      {/* Pending spinner */}
      {isPending && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(0,0,0,.5)', borderRadius: 14, zIndex: 10 }}>
          <div style={{ width: 20, height: 20, border: `2px solid ${tColor}33`,
            borderTopColor: tColor, borderRadius: '50%', animation: 'esp-spin .7s linear infinite' }}/>
        </div>
      )}

      {/* ── Card header: icon + name + state badge ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 9, paddingLeft: 6 }}>
        <span style={{ fontSize: 18, lineHeight: 1, flexShrink: 0,
          filter: glowOn ? `drop-shadow(0 0 6px ${tColor})` : 'none',
          transition: 'filter .2s',
        }}>{tIcon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 12, fontWeight: 800, color: '#fff',
            textTransform: 'uppercase', letterSpacing: 0.5,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entity.name}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,.65)', fontFamily: 'monospace', marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entity.objectId}
          </div>
        </div>
        {/* State badge for boolean types */}
        {(type === 'Switch' || type === 'Light' || type === 'Fan') && stateVal !== undefined && (
          <div style={{
            fontSize: 8, fontWeight: 900, padding: '2px 7px', borderRadius: 8, flexShrink: 0,
            background: isOn ? `${tColor}20` : 'rgba(255,255,255,.05)',
            color: isOn ? tColor : 'rgba(255,255,255,.75)',
            border: `1px solid ${isOn ? tColor + '40' : 'rgba(255,255,255,.08)'}`,
            letterSpacing: 0.5,
          }}>{isOn ? 'ON' : 'OFF'}</div>
        )}
      </div>

      {/* ── Control area ── */}
      <div style={{ paddingLeft: 6 }}>

        {/* BUTTON */}
        {type === 'Button' && (
          <button onClick={() => onCommand(entity, {})} disabled={isPending} style={{
            width: '100%', padding: '9px 0', borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${tColor}44`, fontWeight: 900, fontSize: 11,
            background: `${tColor}14`, color: tColor, textTransform: 'uppercase', letterSpacing: 1.5,
            transition: 'all .15s',
          }}
            onMouseEnter={e => e.currentTarget.style.background = `${tColor}28`}
            onMouseLeave={e => e.currentTarget.style.background = `${tColor}14`}
          >▶ Press</button>
        )}

        {/* SWITCH */}
        {type === 'Switch' && (
          <div onClick={() => onCommand(entity, { state: !isOn })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              cursor: 'pointer', padding: '2px 0' }}>
            <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', letterSpacing: -1,
              color: isOn ? tColor : 'rgba(255,255,255,.75)',
              textShadow: isOn ? `0 0 12px ${tColor}` : 'none' }}>
              {isOn ? 'ON' : 'OFF'}
            </span>
            <ToggleSwitch on={isOn} color={tColor} />
          </div>
        )}

        {/* LIGHT */}
        {type === 'Light' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div onClick={() => onCommand(entity, { state: !isOn })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', letterSpacing: -1,
                color: isOn ? tColor : 'rgba(255,255,255,.75)',
                textShadow: isOn ? `0 0 12px ${tColor}` : 'none' }}>
                {isOn ? 'ON' : 'OFF'}
              </span>
              <ToggleSwitch on={isOn} color={tColor} />
            </div>
            {isOn && brightness !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.7)', minWidth: 10 }}>☀</span>
                <input type="range" min={1} max={100} step={1} value={brightness}
                  onChange={e => onCommand(entity, { state: true, brightness: parseInt(e.target.value) / 100 })}
                  style={{ flex: 1, accentColor: tColor, cursor: 'pointer', height: 3 }} />
                <span style={{ fontSize: 10, color: tColor, minWidth: 30, textAlign: 'right',
                  fontFamily: 'monospace', fontWeight: 700 }}>{brightness}%</span>
              </div>
            )}
            {isOn && entity.config?.effectsList?.length > 0 && (
              <select value={stateVal?.effect || ''}
                onChange={e => onCommand(entity, { state: true, effect: e.target.value })}
                style={{ background: 'rgba(0,0,0,.5)', border: `1px solid ${tColor}30`,
                  borderRadius: 6, color: '#fff', fontSize: 10, padding: '4px 7px',
                  cursor: 'pointer', outline: 'none', width: '100%' }}>
                <option value="">— Effect —</option>
                {entity.config.effectsList.map(ef => <option key={ef} value={ef}>{ef}</option>)}
              </select>
            )}
          </div>
        )}

        {/* FAN */}
        {type === 'Fan' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div onClick={() => onCommand(entity, { state: !isOn })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
              <span style={{ fontSize: 22, fontWeight: 900, fontFamily: 'monospace', letterSpacing: -1,
                color: isOn ? tColor : 'rgba(255,255,255,.75)',
                textShadow: isOn ? `0 0 12px ${tColor}` : 'none' }}>
                {isOn ? 'ON' : 'OFF'}
              </span>
              <ToggleSwitch on={isOn} color={tColor} />
            </div>
            {isOn && entity.config?.supportedSpeedLevels > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 9, color: 'rgba(255,255,255,.7)' }}>SPD</span>
                <input type="range" min={1} max={entity.config.supportedSpeedLevels} step={1}
                  value={fanSpeed ?? 1}
                  onChange={e => onCommand(entity, { state: true, speedLevel: parseInt(e.target.value) })}
                  style={{ flex: 1, accentColor: tColor, cursor: 'pointer', height: 3 }} />
                <span style={{ fontSize: 10, color: tColor, minWidth: 16, textAlign: 'right',
                  fontFamily: 'monospace', fontWeight: 700 }}>{fanSpeed ?? '—'}</span>
              </div>
            )}
            {isOn && entity.config?.supportsOscillation && (
              <div onClick={() => onCommand(entity, { state: true, oscillating: !fanOscil })}
                style={{ display: 'flex', justifyContent: 'space-between', cursor: 'pointer',
                  fontSize: 10, color: fanOscil ? tColor : 'rgba(255,255,255,.7)' }}>
                <span>Oscillate</span>
                <span style={{ fontWeight: 900 }}>{fanOscil ? 'ON' : 'OFF'}</span>
              </div>
            )}
          </div>
        )}

        {/* CLIMATE */}
        {type === 'Climate' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            {entity.config?.supportedModesList?.length > 0 && (
              <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                {entity.config.supportedModesList.map(m => {
                  const label  = {0:'OFF',1:'AUTO',2:'COOL',3:'HEAT',4:'FAN',5:'DRY'}[m] || String(m);
                  const active = climateMode === m;
                  return (
                    <button key={m} onClick={() => onCommand(entity, { mode: m })} style={{
                      padding: '3px 9px', borderRadius: 5, cursor: 'pointer', fontSize: 9,
                      fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, border: 'none',
                      background: active ? tColor : 'rgba(255,255,255,.07)',
                      color: active ? '#000' : 'rgba(255,255,255,.75)',
                      boxShadow: active ? `0 0 8px ${tColor}` : 'none',
                    }}>{label}</button>
                  );
                })}
              </div>
            )}
            {targetTemp !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <button onClick={() => onCommand(entity, { targetTemperature: targetTemp - 0.5 })}
                  style={sBtn('#ff6644')}>−</button>
                <span style={{ fontSize: 20, fontWeight: 900, color: tColor, fontFamily: 'monospace',
                  flex: 1, textAlign: 'center', textShadow: `0 0 10px ${tColor}` }}>
                  {targetTemp.toFixed(1)}°
                </span>
                <button onClick={() => onCommand(entity, { targetTemperature: targetTemp + 0.5 })}
                  style={sBtn('#44ff88')}>+</button>
              </div>
            )}
            <div style={{ fontSize: 10, color: 'rgba(255,255,255,.7)' }}>
              Now: <span style={{ color: '#00ffff', fontWeight: 700 }}>{numericDisplay}</span>
            </div>
          </div>
        )}

        {/* COVER */}
        {type === 'Cover' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', gap: 5 }}>
              <button onClick={() => onCommand(entity, { legacyCommand: 0 })} style={{ ...aBtn(tColor), flex: 1 }}>▲ Open</button>
              <button onClick={() => onCommand(entity, { stop: true })} style={{ ...aBtn('rgba(255,255,255,.4)'), flex: 1 }}>■</button>
              <button onClick={() => onCommand(entity, { legacyCommand: 1 })} style={{ ...aBtn('#ff6644'), flex: 1 }}>▼ Close</button>
            </div>
            {coverPos !== null && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="range" min={0} max={100} step={5} value={coverPos}
                  onChange={e => onCommand(entity, { position: parseInt(e.target.value) / 100 })}
                  style={{ flex: 1, accentColor: tColor, cursor: 'pointer', height: 3 }} />
                <span style={{ fontSize: 10, color: tColor, minWidth: 32, textAlign: 'right',
                  fontFamily: 'monospace', fontWeight: 700 }}>{coverPos}%</span>
              </div>
            )}
          </div>
        )}

        {/* NUMBER */}
        {type === 'Number' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <button onClick={() => onCommand(entity, { state: Math.max(numMin, numVal - numStep) })} style={sBtn('#ff6644')}>−</button>
              <span style={{ fontSize: 24, fontWeight: 900, color: tColor, fontFamily: 'monospace',
                flex: 1, textAlign: 'center', textShadow: `0 0 10px ${tColor}88` }}>{numericDisplay}</span>
              <button onClick={() => onCommand(entity, { state: Math.min(numMax, numVal + numStep) })} style={sBtn('#44ff88')}>+</button>
            </div>
            <input type="range" min={numMin} max={numMax} step={numStep} value={numVal}
              onChange={e => onCommand(entity, { state: parseFloat(e.target.value) })}
              style={{ width: '100%', accentColor: tColor, cursor: 'pointer', height: 3 }} />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8, color: 'rgba(255,255,255,.55)' }}>
              <span>{numMin}</span><span>{numMax}</span>
            </div>
          </div>
        )}

        {/* SELECT */}
        {type === 'Select' && selectOpts.length > 0 && (
          <select value={selectVal} onChange={e => onCommand(entity, { state: e.target.value })}
            style={{ width: '100%', background: 'rgba(0,0,0,.6)', border: `1px solid ${tColor}40`,
              borderRadius: 8, color: '#fff', fontSize: 11, padding: '8px 10px',
              cursor: 'pointer', outline: 'none', fontFamily: 'inherit' }}>
            {selectOpts.map(opt => <option key={opt} value={opt}>{opt}</option>)}
          </select>
        )}

        {/* LOCK */}
        {type === 'Lock' && (
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onCommand(entity, { command: 1 })} style={{ ...aBtn('#44ff88'), flex: 1 }}>🔒 Lock</button>
            <button onClick={() => onCommand(entity, { command: 0 })} style={{ ...aBtn('#ff6644'), flex: 1 }}>🔓 Unlock</button>
          </div>
        )}

        {/* BINARY SENSOR */}
        {type === 'BinarySensor' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
              background: isOn ? tColor : 'rgba(255,255,255,.18)',
              boxShadow: isOn ? `0 0 10px ${tColor}, 0 0 20px ${tColor}66` : 'none',
              transition: 'all .3s',
            }}/>
            <span style={{ fontSize: 24, fontWeight: 900, fontFamily: 'monospace', letterSpacing: -1,
              color: isOn ? tColor : 'rgba(255,255,255,.75)',
              textShadow: isOn ? `0 0 12px ${tColor}` : 'none' }}>
              {isOn ? 'ON' : 'OFF'}
            </span>
          </div>
        )}

        {/* SENSOR / TEXTSENSOR */}
        {(type === 'Sensor' || type === 'TextSensor') && (
          <div style={{
            fontSize: 26, fontWeight: 900, color: tColor, fontFamily: 'monospace',
            letterSpacing: -1, textShadow: `0 0 12px ${tColor}88`,
            lineHeight: 1,
          }}>
            {numericDisplay}
          </div>
        )}

        {/* MEDIA PLAYER */}
        {type === 'MediaPlayer' && (
          <div style={{ display: 'flex', gap: 5 }}>
            <button onClick={() => onCommand(entity, { command: 0 })} style={{ ...aBtn(tColor), flex: 1 }}>⏵</button>
            <button onClick={() => onCommand(entity, { command: 1 })} style={{ ...aBtn('rgba(255,255,255,.4)'), flex: 1 }}>⏸</button>
            <button onClick={() => onCommand(entity, { command: 2 })} style={{ ...aBtn('#ff6644'), flex: 1 }}>⏹</button>
          </div>
        )}

      </div>
    </div>
  );
}

// ── Style helpers ─────────────────────────────────────────────
function sBtn(color) {
  return {
    width: 30, height: 30, borderRadius: 7, cursor: 'pointer',
    border: `1px solid ${color}55`, background: `${color}18`, color,
    fontSize: 18, fontWeight: 900, display: 'flex', alignItems: 'center',
    justifyContent: 'center', flexShrink: 0, padding: 0,
  };
}
function aBtn(color) {
  return {
    padding: '7px 0', borderRadius: 8, cursor: 'pointer', fontSize: 11,
    border: `1px solid ${color}55`, background: `${color}18`, color,
    fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center',
  };
}

function ToggleSwitch({ on, color }) {
  return (
    <div style={{
      width: 40, height: 22, borderRadius: 11, flexShrink: 0,
      background: on ? color : 'rgba(255,255,255,.12)',
      border: `1px solid ${on ? color + '88' : 'rgba(255,255,255,.15)'}`,
      transition: 'all .25s', position: 'relative',
      boxShadow: on ? `0 0 10px ${color}66` : 'none',
    }}>
      <div style={{
        position: 'absolute', top: 3, left: on ? 21 : 3,
        width: 14, height: 14, borderRadius: '50%',
        background: on ? '#000' : 'rgba(255,255,255,.4)',
        transition: 'left .25s',
        boxShadow: on ? `0 0 4px ${color}` : 'none',
      }}/>
    </div>
  );
}

export default ESPHomeDashboard;
// /home/react-dash/dashboard/src/components/esphome/ESPHomeManager.jsx
import React, { useState, useEffect } from 'react';

const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001';

const statusColor = (s) =>
  s === 'online' ? '#44ff88' : s === 'connecting' ? '#ffaa44' : '#ff4444';

function ESPHomeManager({ onOpenDevice }) {
  const [devices,   setDevices]   = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [showAdd,   setShowAdd]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [error,     setError]     = useState(null);
  const [newDevice, setNewDevice] = useState({ name:'', ip:'', port:'6053', apiKey:'' });

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API_BASE}/api/esp/devices`);
      setDevices(await r.json());
    } catch(e) { setError(e.message); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const r    = await fetch(`${API_BASE}/api/esp/status`);
        const data = await r.json();
        setDevices(prev => prev.map(d => {
          const s = data.devices?.find(x => x.id === d.id);
          return s ? { ...d, status: s.status, entityCount: s.entityCount } : d;
        }));
      } catch {}
    }, 10000);
    return () => clearInterval(interval);
  }, []);

  const addDevice = async () => {
    if (!newDevice.name || !newDevice.ip || !newDevice.apiKey) {
      setError('Name, IP and API Key are required'); return;
    }
    setSaving(true); setError(null);
    try {
      const r    = await fetch(`${API_BASE}/api/esp/devices`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body:   JSON.stringify(newDevice),
      });
      const data = await r.json();
      if (data.success) {
        setShowAdd(false);
        setNewDevice({ name:'', ip:'', port:'6053', apiKey:'' });
        await load();
      } else setError(data.error);
    } catch(e) { setError(e.message); }
    setSaving(false);
  };

  const removeDevice = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    await fetch(`${API_BASE}/api/esp/devices/${id}`, { method: 'DELETE' });
    load();
  };

  const reconnect = async (id) => {
    await fetch(`${API_BASE}/api/esp/devices/${id}/reconnect`, { method: 'POST' });
    setTimeout(load, 2000);
  };

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
        <div>
          <div style={{ fontSize:14, fontWeight:900, color:'#00ffff', textTransform:'uppercase', letterSpacing:2 }}>
            📡 ESPHome Devices
          </div>
          <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginTop:2 }}>
            {devices.filter(d => d.status === 'online').length} of {devices.length} online
          </div>
        </div>
        <button onClick={() => { setShowAdd(true); setError(null); }} style={{
          padding:'8px 16px', borderRadius:8, cursor:'pointer', fontWeight:700,
          border:'1px solid rgba(0,200,255,.4)', background:'rgba(0,200,255,.12)',
          color:'#00ffff', fontSize:12, textTransform:'uppercase', letterSpacing:1,
        }}>+ Add Device</button>
      </div>

      {error && (
        <div style={{ padding:8, borderRadius:8, fontSize:11, color:'#ff6666',
          background:'rgba(255,60,60,.15)', border:'1px solid rgba(255,60,60,.4)' }}>
          ⚠️ {error}
        </div>
      )}

      {showAdd && (
        <div style={{ background:'rgba(0,200,255,.05)', border:'1px solid rgba(0,200,255,.2)',
          borderRadius:12, padding:16, display:'flex', flexDirection:'column', gap:10 }}>
          <div style={{ fontSize:12, fontWeight:900, color:'#00ffff', textTransform:'uppercase', letterSpacing:1 }}>
            New ESPHome Device
          </div>
          {[
            { key:'name',   label:'Device Name',    placeholder:'e.g. mm-esp-hub',               type:'text'     },
            { key:'ip',     label:'IP Address',     placeholder:'e.g. 192.168.1.160',             type:'text'     },
            { key:'port',   label:'Port',           placeholder:'6053',                            type:'text'     },
            { key:'apiKey', label:'Encryption Key', placeholder:'Base64 key from ESPHome config', type:'password' },
          ].map(f => (
            <div key={f.key}>
              <div style={{ fontSize:10, color:'rgba(255,255,255,.5)', textTransform:'uppercase',
                letterSpacing:1, marginBottom:4 }}>{f.label}</div>
              <input
                type={f.type}
                value={newDevice[f.key]}
                onChange={e => setNewDevice(p => ({ ...p, [f.key]: e.target.value }))}
                placeholder={f.placeholder}
                style={{ width:'100%', padding:'8px 12px', borderRadius:8, boxSizing:'border-box',
                  border:'1px solid rgba(0,200,255,.3)', background:'rgba(0,0,0,.3)',
                  color:'#fff', fontSize:12, outline:'none' }}
              />
            </div>
          ))}
          <div style={{ display:'flex', gap:8, marginTop:4 }}>
            <button onClick={addDevice} disabled={saving} style={{
              flex:1, padding:'8px 0', borderRadius:8, border:'none', cursor:'pointer',
              background: saving ? 'rgba(0,200,255,.2)' : 'rgba(0,200,255,.8)',
              color:'#000', fontWeight:900, fontSize:12, textTransform:'uppercase',
            }}>{saving ? 'Connecting...' : '✓ Add Device'}</button>
            <button onClick={() => { setShowAdd(false); setError(null); }} style={{
              padding:'8px 16px', borderRadius:8, cursor:'pointer', fontSize:12,
              border:'1px solid rgba(255,255,255,.2)', background:'rgba(255,255,255,.05)', color:'#aaa',
            }}>Cancel</button>
          </div>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign:'center', color:'rgba(255,255,255,.3)', padding:32, fontSize:12 }}>
          Loading devices...
        </div>
      ) : devices.length === 0 ? (
        <div style={{ textAlign:'center', color:'rgba(255,255,255,.2)', padding:48, fontSize:12,
          border:'1px dashed rgba(255,255,255,.1)', borderRadius:12, lineHeight:1.8 }}>
          No ESPHome devices added yet.<br/>Click "+ Add Device" to get started.
        </div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {devices.map(d => {
            const clr = statusColor(d.status);
            return (
              <div key={d.id}
                onClick={() => onOpenDevice && onOpenDevice(d)}
                style={{
                  background:'rgba(0,0,0,.2)', borderRadius:12, padding:14, cursor:'pointer',
                  border:`1px solid ${clr}33`,
                  boxShadow: d.status === 'online' ? `0 0 12px ${clr}22` : 'none',
                  transition:'all .2s',
                }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,200,255,.06)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,.2)'}
              >
                <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                  <div style={{ width:10, height:10, borderRadius:'50%', flexShrink:0,
                    background:clr, boxShadow:`0 0 6px ${clr}` }}/>
                  <div style={{ flex:1, minWidth:0 }}>
                    <div style={{ fontSize:13, fontWeight:900, color:'#fff',
                      textTransform:'uppercase', letterSpacing:0.5 }}>{d.name}</div>
                    <div style={{ fontSize:10, color:'rgba(255,255,255,.4)', marginTop:2 }}>
                      {d.ip}:{d.port || 6053} &nbsp;·&nbsp;
                      <span style={{ color:clr, fontWeight:700 }}>{d.status?.toUpperCase()}</span>
                      {d.status === 'online' && ` · ${d.entityCount} entities`}
                    </div>
                  </div>
                  <div style={{ display:'flex', gap:6, flexShrink:0 }}
                    onClick={e => e.stopPropagation()}>
                    {d.status !== 'online' && (
                      <button onClick={() => reconnect(d.id)} style={{
                        padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:700,
                        border:'1px solid rgba(255,170,68,.4)', background:'rgba(255,170,68,.1)', color:'#ffaa44',
                      }}>↺ Retry</button>
                    )}
                    <button onClick={() => removeDevice(d.id, d.name)} style={{
                      padding:'4px 10px', borderRadius:6, cursor:'pointer', fontSize:10, fontWeight:700,
                      border:'1px solid rgba(255,60,60,.4)', background:'rgba(255,60,60,.1)', color:'#ff6666',
                    }}>Remove</button>
                  </div>
                  <span style={{ color:'rgba(255,255,255,.3)', fontSize:16, flexShrink:0 }}>›</span>
                </div>
                {d.status === 'online' && d.entityCount > 0 && (
                  <div style={{ marginTop:8, paddingTop:8, borderTop:'1px solid rgba(255,255,255,.06)',
                    fontSize:10, color:'rgba(255,255,255,.3)' }}>
                    📡 {d.entityCount} entities · Click to open full dashboard
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      <button onClick={load} style={{
        padding:'6px 0', borderRadius:8, cursor:'pointer', fontSize:11,
        border:'1px solid rgba(255,255,255,.1)', background:'rgba(255,255,255,.04)',
        color:'rgba(255,255,255,.4)', textTransform:'uppercase', letterSpacing:1,
      }}>↻ Refresh Status</button>
    </div>
  );
}

export default ESPHomeManager;
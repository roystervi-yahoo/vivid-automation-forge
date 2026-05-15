// /home/react-dash/dashboard/src/components/esphome/ESPDevicePage.jsx
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

// Types that can be controlled (have commandService)
const CONTROLLABLE = new Set(['Switch','Light','Button','Fan','Climate','Cover','Number','Select','Lock','MediaPlayer','Siren','Text']);

function ESPDevicePage({ device, onBack }) {
  const [entities,  setEntities]  = useState([]);
  const [states,    setStates]    = useState({});
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState(null);
  const [pending,   setPending]   = useState({}); // { entityKey: true } while command in flight
  const [toast,     setToast]     = useState(null); // { msg, ok }

  const showToast = (msg, ok = true) => {
    setToast({ msg, ok });
    setTimeout(() => setToast(null), 2500);
  };

  useEffect(() => {
    const load = async () => {
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
    const interval = setInterval(async () => {
      try {
        const r = await fetch(`${API_BASE}/api/esp/devices/${device.id}/states`);
        if (r.ok) setStates(await r.json());
      } catch {}
    }, 2000);
    return () => clearInterval(interval);
  }, [device.id]);

  // ── Send command to backend ──────────────────────────────
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
    } catch (e) {
      showToast(e.message, false);
    } finally {
      setPending(p => { const n = { ...p }; delete n[key]; return n; });
    }
  }, [device.id]);

  // ── State helpers ────────────────────────────────────────
  const getStateVal = (entity) => states[entity.objectId];

  const getBoolState = (entity) => {
    const sv = getStateVal(entity);
    if (!sv) return false;
    if (typeof sv.state === 'boolean') return sv.state;
    const s = String(sv.state ?? '');
    return s === 'on' || s === 'true' || s === '1';
  };

  const getNumericDisplay = (entity) => {
    const sv = getStateVal(entity);
    if (!sv) return '—';
    const n = parseFloat(sv.state);
    if (isNaN(n)) return String(sv.state ?? '—').slice(0, 20);
    return `${Math.round(n * 10) / 10}${sv.unitOfMeasurement || ''}`;
  };

  // ── Group by type ────────────────────────────────────────
  const byType = entities.reduce((acc, e) => {
    (acc[e.type] = acc[e.type] || []).push(e);
    return acc;
  }, {});

  // ── Type order — controllable types first ────────────────
  const TYPE_ORDER = ['Button','Switch','Light','Fan','Cover','Climate','Number','Select','Lock','MediaPlayer','Siren','Text','BinarySensor','Sensor','TextSensor'];
  const sortedTypes = Object.keys(byType).sort((a, b) => {
    const ai = TYPE_ORDER.indexOf(a); const bi = TYPE_ORDER.indexOf(b);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      zIndex: 9999, backgroundColor: '#060d1f', color: '#fff',
      display: 'flex', flexDirection: 'column',
      fontFamily: "'Courier New', monospace", overflow: 'hidden',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '14px 20px', borderBottom: '1px solid rgba(0,200,255,.25)',
        backgroundColor: 'rgba(0,0,0,.5)', display: 'flex', alignItems: 'center',
        gap: 16, flexShrink: 0, backdropFilter: 'blur(10px)',
      }}>
        <button onClick={onBack} style={{
          padding: '7px 16px', borderRadius: 8, cursor: 'pointer',
          border: '1px solid rgba(255,255,255,.25)', background: 'rgba(255,255,255,.08)',
          color: '#fff', fontSize: 13, fontWeight: 700, flexShrink: 0,
        }}>← Back</button>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 18, fontWeight: 900, textTransform: 'uppercase', letterSpacing: 2,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {device.name}
          </div>
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.45)', marginTop: 2 }}>
            {device.ip} &nbsp;·&nbsp;
            <span style={{ color: device.status === 'online' ? '#44ff88' : '#ff4444', fontWeight: 700 }}>
              {device.status?.toUpperCase()}
            </span>
            &nbsp;·&nbsp; {entities.length} entities
          </div>
        </div>
      </div>

      {/* ── Toast ── */}
      {toast && (
        <div style={{
          position: 'absolute', top: 70, left: '50%', transform: 'translateX(-50%)',
          zIndex: 10000, padding: '8px 18px', borderRadius: 8, fontSize: 12, fontWeight: 700,
          background: toast.ok ? 'rgba(68,255,136,.2)' : 'rgba(255,60,60,.2)',
          border: `1px solid ${toast.ok ? 'rgba(68,255,136,.5)' : 'rgba(255,60,60,.5)'}`,
          color: toast.ok ? '#44ff88' : '#ff6666',
          boxShadow: '0 4px 20px rgba(0,0,0,.5)',
          pointerEvents: 'none',
        }}>
          {toast.ok ? '✓' : '✗'} {toast.msg}
        </div>
      )}

      {/* ── Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 40px' }}>

        {loading && (
          <div style={{ textAlign: 'center', color: '#00ffff', padding: 60, fontSize: 14 }}>
            <div style={{ marginBottom: 12, fontSize: 28 }}>📡</div>
            Loading entities...
          </div>
        )}

        {error && (
          <div style={{ textAlign: 'center', color: '#ff4444', padding: 60, fontSize: 13 }}>
            Error: {error}
          </div>
        )}

        {!loading && !error && entities.length === 0 && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,.3)', padding: 60, fontSize: 13 }}>
            No entities found for this device.
          </div>
        )}

        {!loading && !error && sortedTypes.map(type => {
          const items   = byType[type];
          const tColor  = TYPE_COLOR[type] || '#00ffff';
          const tIcon   = TYPE_ICON[type]  || '📡';
          const canCtrl = CONTROLLABLE.has(type);

          return (
            <div key={type} style={{ marginBottom: 28 }}>

              {/* Section header */}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8,
                marginBottom: 10, paddingBottom: 8,
                borderBottom: `1px solid ${tColor}30`,
              }}>
                <span style={{ fontSize: 15 }}>{tIcon}</span>
                <span style={{ fontSize: 11, fontWeight: 900, color: tColor,
                  textTransform: 'uppercase', letterSpacing: 2 }}>{type}s</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,.25)',
                  background: 'rgba(255,255,255,.06)', borderRadius: 99,
                  padding: '1px 8px' }}>{items.length}</span>
                {canCtrl && (
                  <span style={{ marginLeft: 'auto', fontSize: 9, color: tColor + '88',
                    textTransform: 'uppercase', letterSpacing: 1 }}>● interactive</span>
                )}
              </div>

              {/* Cards grid */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(3, 1fr)',
                gap: 10,
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
      </div>
    </div>
  );
}

// ── Entity Card ──────────────────────────────────────────────
function EntityCard({ entity, stateVal, boolState, numericDisplay, isPending, tColor, tIcon, canCtrl, onCommand }) {
  const type = entity.type;
  const isOn = boolState;

  // Brightness state (0-1 float from ESPHome)
  const brightness = stateVal?.brightness != null
    ? Math.round(stateVal.brightness * 100)
    : null;

  // Fan speed
  const fanSpeed    = stateVal?.speedLevel ?? stateVal?.speed ?? null;
  const fanOscil    = stateVal?.oscillating ?? false;

  // Climate
  const climateMode = stateVal?.mode ?? null;
  const targetTemp  = stateVal?.targetTemperature ?? null;

  // Number
  const numMin    = entity.config?.minValue ?? 0;
  const numMax    = entity.config?.maxValue ?? 100;
  const numStep   = entity.config?.step ?? 1;
  const numVal    = parseFloat(stateVal?.state) || 0;

  // Select
  const selectOptions = entity.config?.optionsList ?? [];
  const selectVal     = stateVal?.state ?? '';

  // Cover position (0=closed, 1=open as float)
  const coverPos = stateVal?.position != null ? Math.round(stateVal.position * 100) : null;

  const cardBg = isOn && canCtrl && type !== 'Button'
    ? `linear-gradient(135deg, ${tColor}18, ${tColor}08)`
    : 'rgba(255,255,255,.03)';

  const cardBorder = isOn && canCtrl && type !== 'Button'
    ? `1px solid ${tColor}55`
    : '1px solid rgba(255,255,255,.08)';

  return (
    <div style={{
      background:   cardBg,
      border:       cardBorder,
      borderRadius: 12,
      padding:      14,
      boxShadow:    isOn && canCtrl ? `0 0 18px ${tColor}18` : 'none',
      transition:   'all .25s',
      opacity:      isPending ? 0.6 : 1,
      position:     'relative',
      overflow:     'hidden',
    }}>

      {/* Pending spinner overlay */}
      {isPending && (
        <div style={{
          position: 'absolute', inset: 0, display: 'flex', alignItems: 'center',
          justifyContent: 'center', background: 'rgba(0,0,0,.3)', borderRadius: 12, zIndex: 10,
        }}>
          <div style={{
            width: 20, height: 20, border: `2px solid ${tColor}44`,
            borderTopColor: tColor, borderRadius: '50%',
            animation: 'esp-spin 0.7s linear infinite',
          }}/>
        </div>
      )}

      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 10 }}>
        <span style={{ fontSize: 18, flexShrink: 0, lineHeight: 1.2 }}>{tIcon}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 11, fontWeight: 800, color: '#fff',
            textTransform: 'uppercase', letterSpacing: 0.5,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entity.name}
          </div>
          <div style={{ fontSize: 8, color: 'rgba(255,255,255,.25)',
            fontFamily: 'monospace', marginTop: 1,
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {entity.objectId}
          </div>
        </div>

        {/* ON/OFF indicator for boolean types */}
        {(type === 'Switch' || type === 'Light' || type === 'Fan') && stateVal !== undefined && (
          <div style={{
            fontSize: 9, fontWeight: 900, padding: '2px 7px', borderRadius: 10,
            background: isOn ? `${tColor}25` : 'rgba(255,255,255,.06)',
            color: isOn ? tColor : 'rgba(255,255,255,.3)',
            border: `1px solid ${isOn ? tColor + '55' : 'rgba(255,255,255,.1)'}`,
            flexShrink: 0,
          }}>
            {isOn ? 'ON' : 'OFF'}
          </div>
        )}
      </div>

      {/* ── BUTTON ── */}
      {type === 'Button' && (
        <button
          onClick={() => onCommand(entity, {})}
          disabled={isPending}
          style={{
            width: '100%', padding: '10px 0', borderRadius: 8, cursor: 'pointer',
            border: `1px solid ${tColor}55`, fontWeight: 900, fontSize: 12,
            background: `${tColor}18`, color: tColor,
            textTransform: 'uppercase', letterSpacing: 1,
            transition: 'all .15s',
          }}
          onMouseEnter={e => { e.currentTarget.style.background = `${tColor}33`; }}
          onMouseLeave={e => { e.currentTarget.style.background = `${tColor}18`; }}
        >
          ▶ Press
        </button>
      )}

      {/* ── SWITCH ── */}
      {type === 'Switch' && (
        <div
          onClick={() => onCommand(entity, { state: !isOn })}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            cursor: 'pointer', padding: '4px 0',
          }}
        >
          <span style={{ fontSize: 18, fontWeight: 900, color: isOn ? tColor : 'rgba(255,255,255,.3)',
            fontFamily: 'monospace' }}>{isOn ? 'ON' : 'OFF'}</span>
          <ToggleSwitch on={isOn} color={tColor} />
        </div>
      )}

      {/* ── LIGHT ── */}
      {type === 'Light' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            onClick={() => onCommand(entity, { state: !isOn })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 18, fontWeight: 900, color: isOn ? tColor : 'rgba(255,255,255,.3)',
              fontFamily: 'monospace' }}>{isOn ? 'ON' : 'OFF'}</span>
            <ToggleSwitch on={isOn} color={tColor} />
          </div>
          {/* Brightness slider — only show when on and brightness available */}
          {isOn && brightness !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)', minWidth: 14 }}>☀</span>
              <input
                type="range" min={1} max={100} step={1}
                value={brightness}
                onChange={e => onCommand(entity, { state: true, brightness: parseInt(e.target.value) / 100 })}
                style={{ flex: 1, accentColor: tColor, cursor: 'pointer', height: 4 }}
              />
              <span style={{ fontSize: 10, color: tColor, minWidth: 30, textAlign: 'right',
                fontFamily: 'monospace', fontWeight: 700 }}>{brightness}%</span>
            </div>
          )}
          {/* Effects */}
          {isOn && entity.config?.effectsList?.length > 0 && (
            <select
              value={stateVal?.effect || ''}
              onChange={e => onCommand(entity, { state: true, effect: e.target.value })}
              style={{
                background: 'rgba(0,0,0,.4)', border: `1px solid ${tColor}44`,
                borderRadius: 6, color: '#fff', fontSize: 10, padding: '4px 6px',
                cursor: 'pointer',
              }}
            >
              <option value="">— Effect —</option>
              {entity.config.effectsList.map(ef => (
                <option key={ef} value={ef}>{ef}</option>
              ))}
            </select>
          )}
        </div>
      )}

      {/* ── FAN ── */}
      {type === 'Fan' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div
            onClick={() => onCommand(entity, { state: !isOn })}
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}
          >
            <span style={{ fontSize: 18, fontWeight: 900, color: isOn ? tColor : 'rgba(255,255,255,.3)',
              fontFamily: 'monospace' }}>{isOn ? 'ON' : 'OFF'}</span>
            <ToggleSwitch on={isOn} color={tColor} />
          </div>
          {/* Speed levels */}
          {isOn && entity.config?.supportedSpeedLevels > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>SPD</span>
              <input
                type="range" min={1} max={entity.config.supportedSpeedLevels} step={1}
                value={fanSpeed ?? 1}
                onChange={e => onCommand(entity, { state: true, speedLevel: parseInt(e.target.value) })}
                style={{ flex: 1, accentColor: tColor, cursor: 'pointer', height: 4 }}
              />
              <span style={{ fontSize: 10, color: tColor, minWidth: 16, textAlign: 'right',
                fontFamily: 'monospace', fontWeight: 700 }}>{fanSpeed ?? '—'}</span>
            </div>
          )}
          {/* Oscillation if supported */}
          {isOn && entity.config?.supportsOscillation && (
            <div
              onClick={() => onCommand(entity, { state: true, oscillating: !fanOscil })}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                cursor: 'pointer', fontSize: 10, color: fanOscil ? tColor : 'rgba(255,255,255,.35)' }}
            >
              <span>Oscillate</span>
              <span style={{ fontWeight: 900 }}>{fanOscil ? 'ON' : 'OFF'}</span>
            </div>
          )}
        </div>
      )}

      {/* ── CLIMATE ── */}
      {type === 'Climate' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Mode buttons */}
          {entity.config?.supportedModesList?.length > 0 && (
            <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
              {entity.config.supportedModesList.map(m => {
                const modeNames = { 0:'OFF', 1:'AUTO', 2:'COOL', 3:'HEAT', 4:'FAN', 5:'DRY' };
                const label = modeNames[m] || String(m);
                const active = climateMode === m;
                return (
                  <button key={m}
                    onClick={() => onCommand(entity, { mode: m })}
                    style={{
                      padding: '4px 9px', borderRadius: 6, cursor: 'pointer', fontSize: 9,
                      fontWeight: 900, border: `1px solid ${active ? tColor : 'rgba(255,255,255,.15)'}`,
                      background: active ? `${tColor}25` : 'rgba(255,255,255,.05)',
                      color: active ? tColor : 'rgba(255,255,255,.5)',
                      textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>{label}</button>
                );
              })}
            </div>
          )}
          {/* Target temp */}
          {targetTemp !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>SET</span>
              <button onClick={() => onCommand(entity, { targetTemperature: targetTemp - 0.5 })}
                style={smallBtn('#ff6644')}>−</button>
              <span style={{ fontSize: 16, fontWeight: 900, color: tColor, fontFamily: 'monospace',
                minWidth: 44, textAlign: 'center' }}>
                {targetTemp.toFixed(1)}°
              </span>
              <button onClick={() => onCommand(entity, { targetTemperature: targetTemp + 0.5 })}
                style={smallBtn('#44ff88')}>+</button>
            </div>
          )}
          <div style={{ fontSize: 10, color: 'rgba(255,255,255,.4)' }}>
            Current: <span style={{ color: '#00ffff' }}>{numericDisplay}</span>
          </div>
        </div>
      )}

      {/* ── COVER ── */}
      {type === 'Cover' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6 }}>
            <button onClick={() => onCommand(entity, { legacyCommand: 0 })}
              style={{ ...actionBtn(tColor), flex: 1 }}>▲ Open</button>
            <button onClick={() => onCommand(entity, { stop: true })}
              style={{ ...actionBtn('rgba(255,255,255,.5)'), flex: 1 }}>■ Stop</button>
            <button onClick={() => onCommand(entity, { legacyCommand: 1 })}
              style={{ ...actionBtn('#ff6644'), flex: 1 }}>▼ Close</button>
          </div>
          {coverPos !== null && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 9, color: 'rgba(255,255,255,.4)' }}>POS</span>
              <input
                type="range" min={0} max={100} step={5}
                value={coverPos}
                onChange={e => onCommand(entity, { position: parseInt(e.target.value) / 100 })}
                style={{ flex: 1, accentColor: tColor, cursor: 'pointer', height: 4 }}
              />
              <span style={{ fontSize: 10, color: tColor, minWidth: 30, textAlign: 'right',
                fontFamily: 'monospace', fontWeight: 700 }}>{coverPos}%</span>
            </div>
          )}
        </div>
      )}

      {/* ── NUMBER ── */}
      {type === 'Number' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button onClick={() => onCommand(entity, { state: Math.max(numMin, numVal - numStep) })}
              style={smallBtn('#ff6644')}>−</button>
            <span style={{ fontSize: 20, fontWeight: 900, color: tColor, fontFamily: 'monospace',
              flex: 1, textAlign: 'center' }}>{numericDisplay}</span>
            <button onClick={() => onCommand(entity, { state: Math.min(numMax, numVal + numStep) })}
              style={smallBtn('#44ff88')}>+</button>
          </div>
          <input
            type="range" min={numMin} max={numMax} step={numStep}
            value={numVal}
            onChange={e => onCommand(entity, { state: parseFloat(e.target.value) })}
            style={{ width: '100%', accentColor: tColor, cursor: 'pointer', height: 4 }}
          />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 8,
            color: 'rgba(255,255,255,.25)' }}>
            <span>{numMin}</span><span>{numMax}</span>
          </div>
        </div>
      )}

      {/* ── SELECT ── */}
      {type === 'Select' && selectOptions.length > 0 && (
        <select
          value={selectVal}
          onChange={e => onCommand(entity, { state: e.target.value })}
          style={{
            width: '100%', background: 'rgba(0,0,0,.5)', border: `1px solid ${tColor}44`,
            borderRadius: 8, color: '#fff', fontSize: 11, padding: '8px 10px',
            cursor: 'pointer', outline: 'none',
          }}
        >
          {selectOptions.map(opt => (
            <option key={opt} value={opt}>{opt}</option>
          ))}
        </select>
      )}

      {/* ── LOCK ── */}
      {type === 'Lock' && (
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => onCommand(entity, { command: 1 })}
            style={{ ...actionBtn('#44ff88'), flex: 1 }}>🔒 Lock</button>
          <button onClick={() => onCommand(entity, { command: 0 })}
            style={{ ...actionBtn('#ff6644'), flex: 1 }}>🔓 Unlock</button>
        </div>
      )}

      {/* ── BINARY SENSOR (read-only) ── */}
      {type === 'BinarySensor' && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{
            width: 10, height: 10, borderRadius: '50%', flexShrink: 0,
            background: isOn ? tColor : 'rgba(255,255,255,.2)',
            boxShadow: isOn ? `0 0 8px ${tColor}` : 'none',
          }}/>
          <span style={{ fontSize: 18, fontWeight: 900, color: isOn ? tColor : 'rgba(255,255,255,.3)',
            fontFamily: 'monospace' }}>{isOn ? 'ON' : 'OFF'}</span>
        </div>
      )}

      {/* ── SENSOR / TEXT SENSOR (read-only) ── */}
      {(type === 'Sensor' || type === 'TextSensor') && (
        <div style={{ fontSize: 20, fontWeight: 900, color: tColor,
          fontFamily: 'monospace', letterSpacing: -0.5 }}>
          {numericDisplay}
        </div>
      )}

      {/* ── MEDIA PLAYER ── */}
      {type === 'MediaPlayer' && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button onClick={() => onCommand(entity, { command: 0 })}
            style={{ ...actionBtn(tColor), flex: 1, minWidth: 60 }}>⏵ Play</button>
          <button onClick={() => onCommand(entity, { command: 1 })}
            style={{ ...actionBtn('rgba(255,255,255,.4)'), flex: 1, minWidth: 60 }}>⏸ Pause</button>
          <button onClick={() => onCommand(entity, { command: 2 })}
            style={{ ...actionBtn('#ff6644'), flex: 1, minWidth: 60 }}>⏹ Stop</button>
        </div>
      )}

      {/* ── Glow bottom bar ── */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: 2,
        borderRadius: '0 0 12px 12px',
        background: isOn && canCtrl ? tColor : 'rgba(255,255,255,.05)',
        opacity: isOn ? 0.7 : 0.3,
      }}/>

      {/* spinner keyframe injected inline once */}
      <style>{`@keyframes esp-spin{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ── Shared style helpers ─────────────────────────────────────
function smallBtn(color) {
  return {
    width: 28, height: 28, borderRadius: 6, cursor: 'pointer', border: `1px solid ${color}55`,
    background: `${color}18`, color, fontSize: 16, fontWeight: 900, display: 'flex',
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, padding: 0,
  };
}

function actionBtn(color) {
  return {
    padding: '6px 0', borderRadius: 7, cursor: 'pointer', fontSize: 10,
    border: `1px solid ${color}55`, background: `${color}18`, color,
    fontWeight: 900, textTransform: 'uppercase', letterSpacing: 0.5,
    textAlign: 'center',
  };
}

// ── Toggle Switch component ──────────────────────────────────
function ToggleSwitch({ on, color }) {
  return (
    <div style={{
      width: 38, height: 20, borderRadius: 10, flexShrink: 0,
      background: on ? color : 'rgba(255,255,255,.12)',
      border: `1px solid ${on ? color + '88' : 'rgba(255,255,255,.15)'}`,
      transition: 'all .25s', position: 'relative', cursor: 'pointer',
      boxShadow: on ? `0 0 8px ${color}66` : 'none',
    }}>
      <div style={{
        position: 'absolute', top: 2, left: on ? 20 : 2, width: 14, height: 14,
        borderRadius: '50%', background: on ? '#000' : 'rgba(255,255,255,.4)',
        transition: 'left .25s',
        boxShadow: on ? `0 0 4px ${color}` : 'none',
      }}/>
    </div>
  );
}

export default ESPDevicePage;
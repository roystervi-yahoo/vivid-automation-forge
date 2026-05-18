const API_BASE = import.meta.env.VITE_API_BASE || 'http://192.168.1.4:3001'

export const espService = {
  async getDevices() {
    const r = await fetch(`${API_BASE}/api/esp/devices`)
    return r.json()
  },

  async getStatus() {
    const r = await fetch(`${API_BASE}/api/esp/status`)
    return r.json()
  },

  async getEntities(deviceId: string) {
    const r = await fetch(`${API_BASE}/api/esp/devices/${deviceId}/entities`)
    return r.json()
  },

  async getStates(deviceId: string) {
    const r = await fetch(`${API_BASE}/api/esp/devices/${deviceId}/states`)
    return r.json()
  },

  async sendCommand(deviceId: string, entityKey: number, type: string, commandData: Record<string, unknown>) {
    const r = await fetch(`${API_BASE}/api/esp/devices/${deviceId}/command`, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ entityKey, type, ...commandData }),
    })
    return r.json()
  },

  async reconnect(deviceId: string) {
    const r = await fetch(`${API_BASE}/api/esp/devices/${deviceId}/reconnect`, { method: 'POST' })
    return r.json()
  },
}

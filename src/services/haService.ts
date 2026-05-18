const API = 'http://192.168.1.4:3001'

export const haService = {
  async getStates() {
    const r = await fetch(`${API}/api/ha/states`)
    if (!r.ok) throw new Error(`${r.status}`)
    return r.json()
  },

  async callService(domain: string, service: string, data: Record<string, unknown>) {
    const r = await fetch(`${API}/api/ha/services/${domain}/${service}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!r.ok) throw new Error(`${r.status}`)
    return r.json()
  },

  async toggle(entityId: string) {
    return this.callService(entityId.split('.')[0], 'toggle', { entity_id: entityId })
  },

  async turnOn(entityId: string, extra?: Record<string, unknown>) {
    return this.callService(entityId.split('.')[0], 'turn_on', { entity_id: entityId, ...extra })
  },

  async turnOff(entityId: string) {
    return this.callService(entityId.split('.')[0], 'turn_off', { entity_id: entityId })
  },
}

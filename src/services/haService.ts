/**
 * Home Assistant REST API client.
 * Config is stored in localStorage so it survives reloads and can be edited
 * from the Settings panel without redeploying.
 *
 *   localStorage["ha.url"]   e.g. "http://192.168.1.8:8123"
 *   localStorage["ha.token"] long-lived access token
 *
 * Docs: https://developers.home-assistant.io/docs/api/rest/
 */

const URL_KEY   = 'ha.url'
const TOKEN_KEY = 'ha.token'
const DEFAULT_URL = 'http://192.168.1.8:8123'

export interface HAEntityState {
  entity_id: string
  state: string
  attributes: Record<string, unknown>
  last_changed?: string
  last_updated?: string
}

function readConfig() {
  if (typeof window === 'undefined') return { url: DEFAULT_URL, token: '' }
  return {
    url:   (localStorage.getItem(URL_KEY)   || DEFAULT_URL).replace(/\/$/, ''),
    token: localStorage.getItem(TOKEN_KEY) || '',
  }
}

async function haFetch(path: string, init: RequestInit = {}): Promise<Response> {
  const { url, token } = readConfig()
  if (!token) throw new Error('Home Assistant token not configured. Open Settings → Connections.')

  const res = await fetch(`${url}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
  })
  if (!res.ok) {
    throw new Error(`HA ${init.method || 'GET'} ${path} → ${res.status} ${res.statusText}`)
  }
  return res
}

export const haService = {
  setConfig(url: string, token: string) {
    if (typeof window === 'undefined') return
    localStorage.setItem(URL_KEY,   url.trim().replace(/\/$/, ''))
    localStorage.setItem(TOKEN_KEY, token.trim())
  },

  getConfig() {
    return readConfig()
  },

  /** GET /api/states — returns every entity. */
  async getAllStates(): Promise<HAEntityState[]> {
    const res = await haFetch('/api/states')
    return res.json()
  },

  /** GET /api/states/<entity_id> */
  async getState(entityId: string): Promise<HAEntityState> {
    const res = await haFetch(`/api/states/${encodeURIComponent(entityId)}`)
    return res.json()
  },

  /** POST /api/services/<domain>/<service> */
  async callService(
    domain: string,
    service: string,
    data: Record<string, unknown> = {},
  ): Promise<unknown> {
    const res = await haFetch(`/api/services/${domain}/${service}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
    return res.json().catch(() => null)
  },

  /** GET /api/ — connectivity probe. */
  async ping(): Promise<boolean> {
    try {
      const res = await haFetch('/api/')
      return res.ok
    } catch {
      return false
    }
  },
}
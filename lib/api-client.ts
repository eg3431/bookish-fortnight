import { cachedAccessToken } from './supabase'

function authHeaders() {
  const token = cachedAccessToken
  if (!token) throw new Error('Not authenticated')
  return { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` }
}

async function apiCall(url: string, options: RequestInit = {}) {
  const res = await fetch(url, { ...options, headers: { ...authHeaders(), ...(options.headers ?? {}) } })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.error || `HTTP ${res.status}`)
  }
  return res.json()
}

export class SupabaseClient {
  async getHumorFlavors() {
    return apiCall('/api/flavors')
  }

  async createHumorFlavor(data: { slug: string; description?: string }) {
    return apiCall('/api/flavors', {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async updateHumorFlavor(id: number, data: any) {
    return apiCall('/api/flavors', {
      method: 'PATCH',
      body: JSON.stringify({ id, ...data }),
    })
  }

  async deleteHumorFlavor(id: number) {
    return apiCall('/api/flavors', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    })
  }

  async getHumorFlavor(id: number) {
    return apiCall(`/api/flavors/${id}`)
  }

  async getHumorFlavorSteps(flavorId: number) {
    const flavor = await this.getHumorFlavor(flavorId)
    const steps = flavor?.humor_flavor_steps ?? []
    return steps.sort((a: any, b: any) => (a.order_by || 0) - (b.order_by || 0))
  }

  async createHumorFlavorStep(flavorId: number, data: any) {
    return apiCall('/api/steps', { method: 'POST', body: JSON.stringify({ flavorId, ...data }) })
  }

  async updateHumorFlavorStep(flavorId: number, stepId: number, data: any) {
    return apiCall('/api/steps', { method: 'PATCH', body: JSON.stringify({ stepId, flavorId, ...data }) })
  }

  async deleteHumorFlavorStep(flavorId: number, stepId: number) {
    return apiCall('/api/steps', { method: 'DELETE', body: JSON.stringify({ stepId, flavorId }) })
  }

  async reorderHumorFlavorSteps(flavorId: number, steps: any[]) {
    const ordered = steps.map((step, index) => ({ id: step.id, order_by: index + 1 }))
    return apiCall('/api/steps', { method: 'PUT', body: JSON.stringify({ steps: ordered }) })
  }

  async testHumorFlavor(flavorId: number, imageUrl: string) {
    return apiCall('/api/captions/generate', { method: 'POST', body: JSON.stringify({ flavorId, imageUrl }) })
  }

  // Lookup table fetchers — all fetched in one server-side call
  async getLookups() {
    return apiCall('/api/lookups')
  }

  async getLLMInputTypes(): Promise<{ id: number; name: string }[]> {
    try { return (await this.getLookups()).inputTypes ?? [] } catch { return [] }
  }

  async getLLMOutputTypes(): Promise<{ id: number; name: string }[]> {
    try { return (await this.getLookups()).outputTypes ?? [] } catch { return [] }
  }

  async getLLMModels(): Promise<{ id: number; name: string }[]> {
    try { return (await this.getLookups()).models ?? [] } catch { return [] }
  }

  async getHumorFlavorStepTypes(): Promise<{ id: number; name: string }[]> {
    try { return (await this.getLookups()).stepTypes ?? [] } catch { return [] }
  }
}

export const apiClient = new SupabaseClient()

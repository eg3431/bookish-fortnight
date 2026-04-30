import { supabase, cachedUserId, cachedAccessToken } from './supabase'

function getUserId(): string | undefined {
  return cachedUserId
}

export class SupabaseClient {
  // Humor Flavor operations
  async getHumorFlavors() {
    try {
      const { data, error } = await supabase
        .from('humor_flavors')
        .select('*')
        .order('created_datetime_utc', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching humor flavors:', error)
      throw error
    }
  }

  async createHumorFlavor(data: { slug: string; description?: string }) {
    try {
      const userId = getUserId()

      const { data: newFlavor, error } = await supabase
        .from('humor_flavors')
        .insert({
          slug: data.slug,
          description: data.description || '',
          created_by_user_id: userId,
          modified_by_user_id: userId,
        })
        .select()
        .single()

      if (error) throw error
      return newFlavor
    } catch (error) {
      console.error('Error creating humor flavor:', error)
      throw error
    }
  }

  async updateHumorFlavor(id: number, data: any) {
    try {
      const userId = getUserId()

      const { data: updated, error } = await supabase
        .from('humor_flavors')
        .update({
          slug: data.slug,
          description: data.description,
          modified_by_user_id: userId,
          modified_datetime_utc: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return updated
    } catch (error) {
      console.error('Error updating humor flavor:', error)
      throw error
    }
  }

  async deleteHumorFlavor(id: number) {
    try {
      const { error } = await supabase
        .from('humor_flavors')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting humor flavor:', error)
      throw error
    }
  }

  // Humor Flavor Steps operations
  async getHumorFlavorSteps(flavorId: number) {
    try {
      const { data, error } = await supabase
        .from('humor_flavor_steps')
        .select('*')
        .eq('humor_flavor_id', flavorId)

      if (error) throw error
      
      // Sort by order_by field in application code
      const sorted = (data || []).sort((a, b) => (a.order_by || 0) - (b.order_by || 0))
      return sorted
    } catch (error) {
      console.error('Error fetching humor flavor steps:', error)
      throw error
    }
  }

  async createHumorFlavorStep(flavorId: number, data: any) {
    const token = cachedAccessToken
    if (!token) throw new Error('Not authenticated')

    const response = await fetch('/api/steps', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ flavorId, ...data }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  async updateHumorFlavorStep(flavorId: number, stepId: number, data: any) {
    const token = cachedAccessToken
    if (!token) throw new Error('Not authenticated')

    const response = await fetch('/api/steps', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ stepId, flavorId, ...data }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${response.status}`)
    }
    return response.json()
  }

  async deleteHumorFlavorStep(flavorId: number, stepId: number) {
    const token = cachedAccessToken
    if (!token) throw new Error('Not authenticated')

    const response = await fetch('/api/steps', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ stepId, flavorId }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${response.status}`)
    }
  }

  async reorderHumorFlavorSteps(flavorId: number, steps: any[]) {
    const token = cachedAccessToken
    if (!token) throw new Error('Not authenticated')

    const ordered = steps.map((step, index) => ({ id: step.id, order_by: index + 1 }))
    const response = await fetch('/api/steps', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      body: JSON.stringify({ steps: ordered }),
    })
    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${response.status}`)
    }
  }

  async testHumorFlavor(flavorId: number, imageUrl: string) {
    const token = cachedAccessToken
    if (!token) throw new Error('Not authenticated')

    const response = await fetch('/api/captions/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ flavorId, imageUrl }),
    })

    if (!response.ok) {
      const err = await response.json().catch(() => ({}))
      throw new Error(err.error || `HTTP ${response.status}`)
    }

    return response.json()
  }

  // Lookup table fetchers
  async getLLMInputTypes(): Promise<{ id: number; name: string }[]> {
    try {
      const { data } = await supabase.from('llm_input_types').select('*').order('id')
      return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name || r.display_name || r.description ||
          (r.slug ? r.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : String(r.id))
      }))
    } catch { return [] }
  }

  async getLLMOutputTypes(): Promise<{ id: number; name: string }[]> {
    try {
      const { data } = await supabase.from('llm_output_types').select('*').order('id')
      return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name || r.display_name || r.description ||
          (r.slug ? r.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : String(r.id))
      }))
    } catch { return [] }
  }

  async getLLMModels(): Promise<{ id: number; name: string }[]> {
    try {
      const { data } = await supabase.from('llm_models').select('*').order('id')
      return (data || []).map((r: any) => {
        const label = r.display_name || r.name || String(r.id)
        const modelId = r.provider_model_id || r.model_id || null
        return { id: r.id, name: modelId ? `${label} (${modelId})` : label }
      })
    } catch { return [] }
  }

  async getHumorFlavorStepTypes(): Promise<{ id: number; name: string }[]> {
    try {
      const { data } = await supabase.from('humor_flavor_step_types').select('*').order('id')
      return (data || []).map((r: any) => ({
        id: r.id,
        name: r.name || r.display_name ||
          (r.slug ? r.slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : r.description || String(r.id))
      }))
    } catch { return [] }
  }
}

export const apiClient = new SupabaseClient()

import { supabase } from './supabase'

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
      const { data: session } = await supabase.auth.getSession()
      const userId = session?.user?.id

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
      const { data: session } = await supabase.auth.getSession()
      const userId = session?.user?.id

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
        .order('order', { ascending: true })

      if (error) throw error
      return data || []
    } catch (error) {
      console.error('Error fetching humor flavor steps:', error)
      throw error
    }
  }

  async createHumorFlavorStep(flavorId: number, data: any) {
    try {
      const { data: session } = await supabase.auth.getSession()
      const userId = session?.user?.id

      // Get the max order for this flavor
      const { data: steps } = await supabase
        .from('humor_flavor_steps')
        .select('order')
        .eq('humor_flavor_id', flavorId)
        .order('order', { ascending: false })
        .limit(1)

      const nextOrder = (steps?.[0]?.order || 0) + 1

      const { data: newStep, error } = await supabase
        .from('humor_flavor_steps')
        .insert({
          humor_flavor_id: flavorId,
          order: nextOrder,
          description: data.description || data.prompt || '',
          created_by_user_id: userId,
          modified_by_user_id: userId,
        })
        .select()
        .single()

      if (error) throw error
      return newStep
    } catch (error) {
      console.error('Error creating humor flavor step:', error)
      throw error
    }
  }

  async updateHumorFlavorStep(flavorId: number, stepId: number, data: any) {
    try {
      const { data: session } = await supabase.auth.getSession()
      const userId = session?.user?.id

      const { data: updated, error } = await supabase
        .from('humor_flavor_steps')
        .update({
          description: data.description || data.prompt,
          modified_by_user_id: userId,
          modified_datetime_utc: new Date().toISOString(),
        })
        .eq('id', stepId)
        .eq('humor_flavor_id', flavorId)
        .select()
        .single()

      if (error) throw error
      return updated
    } catch (error) {
      console.error('Error updating humor flavor step:', error)
      throw error
    }
  }

  async deleteHumorFlavorStep(flavorId: number, stepId: number) {
    try {
      const { error } = await supabase
        .from('humor_flavor_steps')
        .delete()
        .eq('id', stepId)
        .eq('humor_flavor_id', flavorId)

      if (error) throw error
    } catch (error) {
      console.error('Error deleting humor flavor step:', error)
      throw error
    }
  }

  async reorderHumorFlavorSteps(flavorId: number, steps: any[]) {
    try {
      const { data: session } = await supabase.auth.getSession()
      const userId = session?.user?.id

      // Update each step with new order
      const updates = steps.map((step, index) => ({
        ...step,
        order: index + 1,
        modified_by_user_id: userId,
        modified_datetime_utc: new Date().toISOString(),
      }))

      const { error } = await supabase
        .from('humor_flavor_steps')
        .upsert(updates)

      if (error) throw error
    } catch (error) {
      console.error('Error reordering humor flavor steps:', error)
      throw error
    }
  }

  async testHumorFlavor(flavorId: number, imageUrl: string) {
    try {
      // Fetch the flavor with its steps
      const { data: flavor, error: flavorError } = await supabase
        .from('humor_flavors')
        .select('*')
        .eq('id', flavorId)
        .single()

      if (flavorError) throw flavorError

      // Fetch the steps for this flavor
      const { data: steps, error: stepsError } = await supabase
        .from('humor_flavor_steps')
        .select('*')
        .eq('humor_flavor_id', flavorId)
        .order('order', { ascending: true })

      if (stepsError) throw stepsError

      // Prepare the prompt chain from steps
      const promptChain = (steps || []).map((step: any) => ({
        order: step.order,
        description: step.description,
      }))

      const apiKey = process.env.NEXT_PUBLIC_API_KEY
      if (!apiKey) {
        throw new Error('API key is not configured. Please set NEXT_PUBLIC_API_KEY in .env.local')
      }

      // Call the REST API to generate captions
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/captions/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          flavorSlug: flavor.slug,
          flavorDescription: flavor.description,
          promptChain: promptChain,
          imageUrl: imageUrl,
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`API error: ${response.status} ${response.statusText}. ${errorText}`)
      }

      const result = await response.json()
      return result
    } catch (error) {
      console.error('Error testing humor flavor:', error)
      throw error
    }
  }
}

export const apiClient = new SupabaseClient()

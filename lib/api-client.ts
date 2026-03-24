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
      const { data: { session } } = await supabase.auth.getSession()
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
      const { data: { session } } = await supabase.auth.getSession()
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
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id

      // Get all steps for this flavor to calculate next order
      const { data: steps, error: stepsError } = await supabase
        .from('humor_flavor_steps')
        .select('*')
        .eq('humor_flavor_id', flavorId)

      if (stepsError) throw stepsError

      // Calculate next order_by
      const maxOrder = Math.max(...(steps || []).map(s => s.order_by || 0), 0)
      const nextOrder = maxOrder + 1

      const { data: newStep, error } = await supabase
        .from('humor_flavor_steps')
        .insert({
          humor_flavor_id: flavorId,
          order_by: nextOrder,
          llm_input_type_id: 1,
          llm_output_type_id: 1,
          llm_model_id: 1,
          humor_flavor_step_type_id: 1,
          llm_temperature: 0.7,
          llm_system_prompt: 'You are a helpful assistant.',
          llm_user_prompt: data.description || data.prompt || '',
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
      const { data: { session } } = await supabase.auth.getSession()
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
      const { data: { session } } = await supabase.auth.getSession()
      const userId = session?.user?.id

      // Update each step with new order_by
      const updates = steps.map((step, index) => ({
        ...step,
        order_by: index + 1,
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

      if (stepsError) throw stepsError

      // Sort steps by order_by
      const sortedSteps = (steps || []).sort((a, b) => (a.order_by || 0) - (b.order_by || 0))

      // Prepare the prompt chain from steps
      const promptChain = sortedSteps.map((step: any) => ({
        order: step.order_by,
        description: step.description,
      }))

      // Call our backend API route (which will call the external API with the secret key)
      const response = await fetch('/api/captions/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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

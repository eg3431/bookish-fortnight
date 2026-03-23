import { create } from 'zustand'
import { apiClient } from './api-client'

interface HumorStep {
  id: number
  humor_flavor_id: number
  order: number
  step_type_id?: number
  description: string
  created_datetime_utc?: string
  modified_datetime_utc?: string
}

interface HumorFlavor {
  id: number
  slug: string
  description?: string
  created_by_user_id: string
  modified_by_user_id: string
  created_datetime_utc: string
  modified_datetime_utc: string
  steps?: HumorStep[]
}

interface HumorFlavorStore {
  flavors: HumorFlavor[]
  currentFlavor: HumorFlavor | null
  isLoading: boolean
  error: string | null

  // Flavor actions
  fetchFlavors: () => Promise<void>
  fetchFlavor: (id: number) => Promise<void>
  createFlavor: (data: any) => Promise<void>
  updateFlavor: (id: number, data: any) => Promise<void>
  deleteFlavor: (id: number) => Promise<void>

  // Step actions
  createStep: (flavorId: number, data: any) => Promise<void>
  updateStep: (flavorId: number, stepId: number, data: any) => Promise<void>
  deleteStep: (flavorId: number, stepId: number) => Promise<void>
  reorderSteps: (flavorId: number, steps: HumorStep[]) => Promise<void>

  // Testing
  testFlavor: (flavorId: number, imageUrl: string) => Promise<any>

  setCurrentFlavor: (flavor: HumorFlavor | null) => void
  setError: (error: string | null) => void
}

export const useHumorFlavorStore = create<HumorFlavorStore>((set, get) => ({
  flavors: [],
  currentFlavor: null,
  isLoading: false,
  error: null,

  fetchFlavors: async () => {
    set({ isLoading: true })
    try {
      const data = await apiClient.getHumorFlavors()
      set({ flavors: data, error: null })
    } catch (error: any) {
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  fetchFlavor: async (id: number) => {
    set({ isLoading: true })
    try {
      const flavors = get().flavors
      const flavor = flavors.find(f => f.id === id)
      if (flavor) {
        const steps = await apiClient.getHumorFlavorSteps(id)
        const fullFlavor = { ...flavor, steps }
        set({ currentFlavor: fullFlavor, error: null })
      }
    } catch (error: any) {
      set({ error: error.message })
    } finally {
      set({ isLoading: false })
    }
  },

  createFlavor: async (data: any) => {
    set({ isLoading: true })
    try {
      const newFlavor = await apiClient.createHumorFlavor(data)
      set({ 
        flavors: [...get().flavors, newFlavor],
        error: null 
      })
    } catch (error: any) {
      set({ error: error.message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  updateFlavor: async (id: number, data: any) => {
    set({ isLoading: true })
    try {
      const updated = await apiClient.updateHumorFlavor(id, data)
      const flavors = get().flavors.map(f => f.id === id ? updated : f)
      set({ 
        flavors,
        currentFlavor: get().currentFlavor?.id === id ? updated : get().currentFlavor,
        error: null 
      })
    } catch (error: any) {
      set({ error: error.message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  deleteFlavor: async (id: number) => {
    set({ isLoading: true })
    try {
      await apiClient.deleteHumorFlavor(id)
      set({ 
        flavors: get().flavors.filter(f => f.id !== id),
        currentFlavor: get().currentFlavor?.id === id ? null : get().currentFlavor,
        error: null 
      })
    } catch (error: any) {
      set({ error: error.message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  createStep: async (flavorId: number, data: any) => {
    set({ isLoading: true })
    try {
      const newStep = await apiClient.createHumorFlavorStep(flavorId, data)
      const current = get().currentFlavor
      if (current && current.id === flavorId) {
        set({
          currentFlavor: {
            ...current,
            steps: [...(current.steps || []), newStep]
          },
          error: null
        })
      }
    } catch (error: any) {
      set({ error: error.message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  updateStep: async (flavorId: number, stepId: number, data: any) => {
    set({ isLoading: true })
    try {
      const updated = await apiClient.updateHumorFlavorStep(flavorId, stepId, data)
      const current = get().currentFlavor
      if (current && current.id === flavorId) {
        set({
          currentFlavor: {
            ...current,
            steps: (current.steps || []).map(s => s.id === stepId ? updated : s)
          },
          error: null
        })
      }
    } catch (error: any) {
      set({ error: error.message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  deleteStep: async (flavorId: number, stepId: number) => {
    set({ isLoading: true })
    try {
      await apiClient.deleteHumorFlavorStep(flavorId, stepId)
      const current = get().currentFlavor
      if (current && current.id === flavorId) {
        set({
          currentFlavor: {
            ...current,
            steps: (current.steps || []).filter(s => s.id !== stepId)
          },
          error: null
        })
      }
    } catch (error: any) {
      set({ error: error.message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  reorderSteps: async (flavorId: number, steps: HumorStep[]) => {
    set({ isLoading: true })
    try {
      await apiClient.reorderHumorFlavorSteps(flavorId, steps)
      const current = get().currentFlavor
      if (current && current.id === flavorId) {
        set({
          currentFlavor: {
            ...current,
            steps
          },
          error: null
        })
      }
    } catch (error: any) {
      set({ error: error.message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  testFlavor: async (flavorId: number, imageUrl: string) => {
    set({ isLoading: true })
    try {
      const result = await apiClient.testHumorFlavor(flavorId, imageUrl)
      set({ error: null })
      return result
    } catch (error: any) {
      set({ error: error.message })
      throw error
    } finally {
      set({ isLoading: false })
    }
  },

  setCurrentFlavor: (flavor: HumorFlavor | null) => {
    set({ currentFlavor: flavor })
  },

  setError: (error: string | null) => {
    set({ error })
  }
}))

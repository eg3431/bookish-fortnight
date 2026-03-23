import axios, { AxiosInstance } from 'axios'

class APIClient {
  private client: AxiosInstance

  constructor() {
    this.client = axios.create({
      baseURL: process.env.NEXT_PUBLIC_API_BASE_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    })

    // Add auth token if available
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('api_token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      return config
    })
  }

  async getHumorFlavors() {
    try {
      const response = await this.client.get('/humor-flavors')
      return response.data
    } catch (error) {
      console.error('Error fetching humor flavors:', error)
      throw error
    }
  }

  async createHumorFlavor(data: any) {
    try {
      const response = await this.client.post('/humor-flavors', data)
      return response.data
    } catch (error) {
      console.error('Error creating humor flavor:', error)
      throw error
    }
  }

  async updateHumorFlavor(id: number, data: any) {
    try {
      const response = await this.client.put(`/humor-flavors/${id}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating humor flavor:', error)
      throw error
    }
  }

  async deleteHumorFlavor(id: number) {
    try {
      const response = await this.client.delete(`/humor-flavors/${id}`)
      return response.data
    } catch (error) {
      console.error('Error deleting humor flavor:', error)
      throw error
    }
  }

  async getHumorFlavorSteps(flavorId: number) {
    try {
      const response = await this.client.get(`/humor-flavors/${flavorId}/steps`)
      return response.data
    } catch (error) {
      console.error('Error fetching humor flavor steps:', error)
      throw error
    }
  }

  async createHumorFlavorStep(flavorId: number, data: any) {
    try {
      const response = await this.client.post(`/humor-flavors/${flavorId}/steps`, data)
      return response.data
    } catch (error) {
      console.error('Error creating humor flavor step:', error)
      throw error
    }
  }

  async updateHumorFlavorStep(flavorId: number, stepId: number, data: any) {
    try {
      const response = await this.client.put(`/humor-flavors/${flavorId}/steps/${stepId}`, data)
      return response.data
    } catch (error) {
      console.error('Error updating humor flavor step:', error)
      throw error
    }
  }

  async deleteHumorFlavorStep(flavorId: number, stepId: number) {
    try {
      const response = await this.client.delete(`/humor-flavors/${flavorId}/steps/${stepId}`)
      return response.data
    } catch (error) {
      console.error('Error deleting humor flavor step:', error)
      throw error
    }
  }

  async reorderHumorFlavorSteps(flavorId: number, steps: any[]) {
    try {
      const response = await this.client.post(`/humor-flavors/${flavorId}/reorder-steps`, { steps })
      return response.data
    } catch (error) {
      console.error('Error reordering humor flavor steps:', error)
      throw error
    }
  }

  async testHumorFlavor(flavorId: number, imageUrl: string) {
    try {
      const response = await this.client.post(`/humor-flavors/${flavorId}/test`, { imageUrl })
      return response.data
    } catch (error) {
      console.error('Error testing humor flavor:', error)
      throw error
    }
  }

  async generateCaptions(flavorId: number, imageUrl: string) {
    try {
      const response = await this.client.post(`/captions/generate`, { 
        flavorId,
        imageUrl 
      })
      return response.data
    } catch (error) {
      console.error('Error generating captions:', error)
      throw error
    }
  }
}

export const apiClient = new APIClient()

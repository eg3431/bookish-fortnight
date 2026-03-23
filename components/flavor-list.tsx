'use client'

import React, { useEffect } from 'react'
import { useHumorFlavorStore } from '@/lib/store'
import { Plus, Edit, Trash2, Play } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface FlavorListProps {
  onSelectFlavor: (id: number) => void
  onCreateNew: () => void
  selectedId?: number
}

export const FlavorList = ({ onSelectFlavor, onCreateNew, selectedId }: FlavorListProps) => {
  const { flavors, isLoading, fetchFlavors, deleteFlavor } = useHumorFlavorStore()

  useEffect(() => {
    fetchFlavors()
  }, [fetchFlavors])

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (confirm('Are you sure you want to delete this flavor?')) {
      try {
        await deleteFlavor(id)
        toast.success('Flavor deleted')
      } catch (error) {
        toast.error('Failed to delete flavor')
      }
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-mono font-bold neon-text">&gt; Flavors</h2>
        <button
          onClick={onCreateNew}
          className="p-2 rounded-lg bg-primary text-bg-dark hover:bg-primary-dark transition flex items-center space-x-1"
        >
          <Plus className="w-4 h-4" />
          <span className="text-sm font-mono">New</span>
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 rounded-lg bg-gray-200 dark:bg-surface-dark animate-pulse" />
          ))}
        </div>
      ) : flavors.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p className="font-mono text-sm">&gt; no flavors found</p>
        </div>
      ) : (
        <div className="space-y-2">
          {flavors.map((flavor, idx) => (
            <motion.button
              key={flavor.id}
              onClick={() => onSelectFlavor(flavor.id)}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              className={`w-full p-3 rounded-lg border transition text-left group ${
                selectedId === flavor.id
                  ? 'border-primary bg-primary bg-opacity-10 dark:bg-opacity-5'
                  : 'border-gray-300 dark:border-gray-600 hover:border-primary'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-mono font-semibold text-sm">{flavor.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{flavor.description}</p>
                </div>
                <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition">
                  <button className="p-1 hover:bg-gray-200 dark:hover:bg-surface-dark rounded">
                    <Play className="w-4 h-4" />
                  </button>
                  <button
                    onClick={(e) => handleDelete(e, flavor.id)}
                    className="p-1 hover:bg-red-500 hover:bg-opacity-20 rounded text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </div>
  )
}

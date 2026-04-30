'use client'

import React, { useEffect, useState, useMemo } from 'react'
import { useHumorFlavorStore } from '@/lib/store'
import { Plus, Edit, Trash2, Play, Copy, Search, X as XIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import toast from 'react-hot-toast'

interface FlavorListProps {
  onSelectFlavor: (id: number) => void
  onCreateNew: () => void
  onEditFlavor: (id: number) => void
  selectedId?: number
}

interface DuplicateModalProps {
  isOpen: boolean
  sourceFlavorSlug: string
  onConfirm: (newSlug: string) => Promise<void>
  onCancel: () => void
  isLoading: boolean
}

const DuplicateModal = ({ isOpen, sourceFlavorSlug, onConfirm, onCancel, isLoading }: DuplicateModalProps) => {
  const [newSlug, setNewSlug] = useState(`${sourceFlavorSlug}-copy`)

  useEffect(() => {
    if (isOpen) {
      setNewSlug(`${sourceFlavorSlug}-copy`)
    }
  }, [isOpen, sourceFlavorSlug])

  const handleConfirm = async () => {
    if (!newSlug.trim()) {
      toast.error('Flavor name cannot be empty')
      return
    }
    await onConfirm(newSlug)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
        <h3 className="text-lg font-mono font-bold neon-text mb-4">
          &gt; Duplicate Flavor
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 font-mono">
          Creating a copy of: <span className="text-primary">{sourceFlavorSlug}</span>
        </p>
        <div className="space-y-2 mb-6">
          <label className="block text-sm font-mono text-primary">New Flavor Name</label>
          <input
            type="text"
            value={newSlug}
            onChange={(e) => setNewSlug(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 input-glow"
            placeholder="my-flavor-copy"
            autoFocus
          />
        </div>
        <div className="flex space-x-2">
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-mono disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 py-2 rounded-lg bg-primary text-bg-dark font-mono font-bold hover:bg-primary-dark disabled:opacity-50 transition"
          >
            {isLoading ? 'Duplicating...' : 'Duplicate'}
          </button>
        </div>
      </div>
    </div>
  )
}

export const FlavorList = ({ onSelectFlavor, onCreateNew, onEditFlavor, selectedId }: FlavorListProps) => {
  const { flavors, fetchFlavors, deleteFlavor, duplicateFlavor } = useHumorFlavorStore()
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)
  const [duplicatingFlavorId, setDuplicatingFlavorId] = useState<number | null>(null)
  const [isDuplicating, setIsDuplicating] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [initialLoading, setInitialLoading] = useState(true)

  const filteredFlavors = useMemo(() => {
    const q = searchQuery.trim().toLowerCase()
    if (!q) return flavors
    return flavors.filter(
      (f) => f.slug.toLowerCase().includes(q) || (f.description || '').toLowerCase().includes(q)
    )
  }, [flavors, searchQuery])

  useEffect(() => {
    fetchFlavors().finally(() => setInitialLoading(false))
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

  const handleEdit = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    onEditFlavor(id)
  }

  const handleDuplicateClick = (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    setDuplicatingFlavorId(id)
    setDuplicateModalOpen(true)
  }

  const handleDuplicateConfirm = async (newSlug: string) => {
    if (!duplicatingFlavorId) return

    try {
      setIsDuplicating(true)
      await duplicateFlavor(duplicatingFlavorId, newSlug)
      toast.success('Flavor duplicated')
      setDuplicateModalOpen(false)
      setDuplicatingFlavorId(null)
    } catch (error: any) {
      toast.error(error.message || 'Failed to duplicate flavor')
    } finally {
      setIsDuplicating(false)
    }
  }

  const sourceFlavorSlug = duplicatingFlavorId
    ? flavors.find(f => f.id === duplicatingFlavorId)?.slug || 'Flavor'
    : 'Flavor'

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-mono font-bold neon-text">&gt; Flavors</h2>
          <button
            onClick={onCreateNew}
            className="p-2 rounded-lg bg-primary text-bg-dark hover:bg-primary-dark transition flex items-center space-x-1"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-mono">New</span>
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search flavors..."
            className="w-full pl-8 pr-7 py-1.5 text-xs font-mono rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <XIcon className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {initialLoading ? (
          <div className="space-y-2">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-12 rounded-lg bg-gray-200 dark:bg-surface-dark animate-pulse" />
            ))}
          </div>
        ) : filteredFlavors.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p className="font-mono text-sm">&gt; {searchQuery ? 'no matching flavors' : 'no flavors found'}</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filteredFlavors.map((flavor, idx) => (
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
                    <p className="font-mono font-semibold text-sm">{flavor.slug}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{flavor.description}</p>
                  </div>
                  <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition">
                    <button
                      onClick={(e) => handleEdit(e, flavor.id)}
                      className="p-1 hover:bg-blue-500 hover:bg-opacity-20 rounded text-blue-500"
                      title="Edit flavor"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDuplicateClick(e, flavor.id)}
                      className="p-1 hover:bg-green-500 hover:bg-opacity-20 rounded text-green-500"
                      title="Duplicate flavor"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button className="p-1 hover:bg-gray-200 dark:hover:bg-surface-dark rounded" title="Test flavor">
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, flavor.id)}
                      className="p-1 hover:bg-red-500 hover:bg-opacity-20 rounded text-red-500"
                      title="Delete flavor"
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

      <DuplicateModal
        isOpen={duplicateModalOpen}
        sourceFlavorSlug={sourceFlavorSlug}
        onConfirm={handleDuplicateConfirm}
        onCancel={() => {
          setDuplicateModalOpen(false)
          setDuplicatingFlavorId(null)
        }}
        isLoading={isDuplicating}
      />
    </>
  )
}

'use client'

import React, { useState, useEffect } from 'react'
import { useHumorFlavorStore } from '@/lib/store'
import { X, Plus, GripVertical, Trash2 } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd'
import toast from 'react-hot-toast'

interface FlavorEditorProps {
  flavorId?: number
  onClose: () => void
}

export const FlavorEditor = ({ flavorId, onClose }: FlavorEditorProps) => {
  const { currentFlavor, flavors, fetchFlavor, createFlavor, updateFlavor, createStep, deleteStep, reorderSteps } = useHumorFlavorStore()
  
  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<any[]>([])
  const [newStepPrompt, setNewStepPrompt] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (flavorId) {
      // If we have currentFlavor and it matches, use it
      if (currentFlavor?.id === flavorId) {
        setSlug(currentFlavor.slug)
        setDescription(currentFlavor.description || '')
        setSteps(currentFlavor.steps || [])
      } else {
        // Try to find in flavors list
        const flavor = flavors.find(f => f.id === flavorId)
        if (flavor) {
          setSlug(flavor.slug)
          setDescription(flavor.description || '')
          setSteps(flavor.steps || [])
        } else {
          // Fetch the flavor if not in list
          fetchFlavor(flavorId)
        }
      }
    } else {
      // Creating new flavor - reset form
      setSlug('')
      setDescription('')
      setSteps([])
    }
    setNewStepPrompt('')
  }, [flavorId, currentFlavor, flavors, fetchFlavor])

  // Sync steps when currentFlavor changes
  useEffect(() => {
    if (flavorId && currentFlavor?.id === flavorId) {
      setSteps(currentFlavor.steps || [])
    }
  }, [currentFlavor?.steps, flavorId])

  const handleAddStep = async () => {
    if (!newStepPrompt.trim()) {
      toast.error('Step description cannot be empty')
      return
    }

    if (!flavorId) {
      toast.error('Save the flavor first before adding steps')
      return
    }

    try {
      setIsLoading(true)
      await createStep(flavorId, {
        description: newStepPrompt,
      })
      setNewStepPrompt('')
      
      // Fetch the updated flavor to refresh steps
      await fetchFlavor(flavorId)
      
      toast.success('Step added')
    } catch (error) {
      console.error('Error adding step:', error)
      toast.error('Failed to add step')
    } finally {
      setIsLoading(false)
    }
  }

  const handleDeleteStep = async (stepId: number) => {
    if (flavorId) {
      try {
        await deleteStep(flavorId, stepId)
        toast.success('Step deleted')
      } catch (error) {
        toast.error('Failed to delete step')
      }
    }
  }

  const handleDragEnd = async (result: any) => {
    const { source, destination } = result
    if (!destination) return

    const newSteps = Array.from(steps)
    const [reorderedStep] = newSteps.splice(source.index, 1)
    newSteps.splice(destination.index, 0, reorderedStep)

    setSteps(newSteps)
    
    if (flavorId) {
      try {
        await reorderSteps(flavorId, newSteps)
        toast.success('Steps reordered')
      } catch (error) {
        toast.error('Failed to reorder steps')
      }
    }
  }

  const handleSaveFlavor = async () => {
    if (!slug.trim()) {
      toast.error('Flavor slug is required')
      return
    }

    try {
      setIsLoading(true)
      if (flavorId) {
        await updateFlavor(flavorId, { slug, description })
        toast.success('Flavor updated')
      } else {
        await createFlavor({ slug, description })
        toast.success('Flavor created')
        onClose()
      }
    } catch (error) {
      toast.error('Failed to save flavor')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-surface-dark">
          <h2 className="text-lg font-mono font-bold neon-text">
            {flavorId ? '&gt; Edit Flavor' : '&gt; New Flavor'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Flavor Details */}
          <div className="space-y-2">
            <label className="block text-sm font-mono text-primary">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 input-glow"
              placeholder="my-flavor"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-mono text-primary">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 input-glow resize-none"
              placeholder="Describe what this flavor does..."
              rows={3}
            />
          </div>

          {/* Steps */}
          {flavorId && (
            <div className="space-y-2">
              <h3 className="text-sm font-mono font-bold text-primary">&gt; Steps</h3>
              
              {steps.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="steps">
                    {(provided, snapshot) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600"
                      >
                        {steps.map((step, index) => (
                          <Draggable key={step.id} draggableId={`step-${step.id}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                className="flex items-center space-x-2 p-2 rounded bg-gray-50 dark:bg-gray-700"
                              >
                                <div {...provided.dragHandleProps} className="cursor-grab">
                                  <GripVertical className="w-4 h-4 text-gray-400" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm font-mono font-semibold">Step {index + 1}</p>
                                  <p className="text-xs text-gray-500 truncate">{step.description}</p>
                                </div>
                                <button
                                  onClick={() => handleDeleteStep(step.id)}
                                  className="p-1 hover:bg-red-500 hover:bg-opacity-20 rounded text-red-500"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            )}
                          </Draggable>
                        ))}
                        {provided.placeholder}
                      </div>
                    )}
                  </Droppable>
                </DragDropContext>
              ) : (
                <p className="text-sm text-gray-500 italic">No steps yet</p>
              )}

              {/* Add Step */}
              <div className="space-y-2 pt-2">
                <textarea
                  value={newStepPrompt}
                  onChange={(e) => setNewStepPrompt(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 input-glow resize-none"
                  placeholder="Enter step description..."
                  rows={2}
                />
                <button
                  onClick={handleAddStep}
                  disabled={isLoading}
                  className="w-full py-2 rounded-lg bg-primary text-bg-dark font-mono font-bold hover:bg-primary-dark disabled:opacity-50 transition flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Step</span>
                </button>
              </div>
            </div>
          )}

          {/* Save Button */}
          <div className="flex space-x-2 pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onClose}
              className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-mono"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveFlavor}
              disabled={isLoading}
              className="flex-1 py-2 rounded-lg bg-primary text-bg-dark font-mono font-bold hover:bg-primary-dark disabled:opacity-50 transition"
            >
              {isLoading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

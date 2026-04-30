'use client'

import React, { useState, useEffect } from 'react'
import { useHumorFlavorStore } from '@/lib/store'
import { X, Plus, GripVertical, Trash2, Pencil, Check, XCircle, Maximize2, List } from 'lucide-react'
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd'
import { apiClient } from '@/lib/api-client'
import toast from 'react-hot-toast'

interface LookupItem { id: number; name: string }

interface StepFormData {
  description: string
  inputTypeId: number
  outputTypeId: number
  modelId: number
  stepTypeId: number
  temperature: string
  systemPrompt: string
  userPrompt: string
}

const DEFAULT_STEP: StepFormData = {
  description: '',
  inputTypeId: 1,
  outputTypeId: 1,
  modelId: 1,
  stepTypeId: 1,
  temperature: '0.7',
  systemPrompt: '',
  userPrompt: '',
}

const FALLBACK_INPUT_TYPES: LookupItem[] = [
  { id: 1, name: 'Text' },
  { id: 2, name: 'Image' },
  { id: 3, name: 'Image And Text' },
]
const FALLBACK_OUTPUT_TYPES: LookupItem[] = [
  { id: 1, name: 'Text' },
  { id: 2, name: 'Array' },
  { id: 3, name: 'JSON' },
]
const FALLBACK_MODELS: LookupItem[] = [
  { id: 1, name: 'GPT-4o' },
  { id: 2, name: 'GPT-4o Mini' },
  { id: 3, name: 'GPT-3.5 Turbo' },
]
const FALLBACK_STEP_TYPES: LookupItem[] = [
  { id: 1, name: 'General' },
  { id: 2, name: 'Celebrity Recognition' },
  { id: 3, name: 'Scene Description' },
  { id: 4, name: 'Caption Generation' },
]

const PROMPT_VARS = [
  { name: '{{image_url}}', desc: 'Input image URL' },
  { name: '{{previous_output}}', desc: 'Previous step output' },
  { name: '{{step_1_output}}', desc: 'Step 1 output' },
  { name: '{{step_2_output}}', desc: 'Step 2 output' },
  { name: '{{flavor_name}}', desc: 'Humor flavor name' },
]

function FullScreenEditor({ title, value, onChange, onClose }: {
  title: string
  value: string
  onChange: (v: string) => void
  onClose: () => void
}) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[70]">
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow-2xl w-full max-w-4xl h-[80vh] mx-4 flex flex-col">
        <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <span className="font-mono font-bold text-primary">&gt; {title}</span>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>
        <textarea
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 p-4 bg-transparent resize-none focus:outline-none font-mono text-sm dark:text-gray-200"
          placeholder="Write your prompt here..."
        />
        <div className="p-4 border-t border-gray-200 dark:border-gray-600 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-lg bg-primary text-bg-dark font-mono font-bold hover:bg-primary-dark transition"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}

function StepFormFields({ data, onChange, inputTypes, outputTypes, models, stepTypes }: {
  data: StepFormData
  onChange: (updates: Partial<StepFormData>) => void
  inputTypes: LookupItem[]
  outputTypes: LookupItem[]
  models: LookupItem[]
  stepTypes: LookupItem[]
}) {
  const [fullScreen, setFullScreen] = useState<'system' | 'user' | null>(null)
  const [showVars, setShowVars] = useState(false)

  return (
    <div className="space-y-3">
      {fullScreen && (
        <FullScreenEditor
          title={fullScreen === 'system' ? 'System Prompt' : 'User Prompt'}
          value={fullScreen === 'system' ? data.systemPrompt : data.userPrompt}
          onChange={(v) => {
            if (fullScreen === 'system') onChange({ systemPrompt: v })
            else onChange({ userPrompt: v, description: v })
          }}
          onClose={() => setFullScreen(null)}
        />
      )}

      {/* Input Type + Output Type */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">Input Type</label>
          <select
            value={data.inputTypeId}
            onChange={(e) => onChange({ inputTypeId: Number(e.target.value) })}
            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {inputTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">Output Type</label>
          <select
            value={data.outputTypeId}
            onChange={(e) => onChange({ outputTypeId: Number(e.target.value) })}
            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {outputTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
      </div>

      {/* LLM Model */}
      <div className="space-y-1">
        <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">LLM Model</label>
        <select
          value={data.modelId}
          onChange={(e) => onChange({ modelId: Number(e.target.value) })}
          className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
        >
          {models.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>

      {/* Step Type + Temperature */}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">Step Type</label>
          <select
            value={data.stepTypeId}
            onChange={(e) => onChange({ stepTypeId: Number(e.target.value) })}
            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
          >
            {stepTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div className="space-y-1">
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">Temperature</label>
          <input
            type="number"
            min="0"
            max="2"
            step="0.1"
            value={data.temperature}
            onChange={(e) => onChange({ temperature: e.target.value })}
            className="w-full px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono focus:outline-none focus:ring-1 focus:ring-primary"
            placeholder="0.7"
          />
        </div>
      </div>

      {/* System Prompt */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">System Prompt</label>
          <button
            type="button"
            onClick={() => setFullScreen('system')}
            className="flex items-center space-x-1 text-xs text-primary font-mono hover:underline"
          >
            <Maximize2 className="w-3 h-3" />
            <span>Full Screen Editor</span>
          </button>
        </div>
        <textarea
          value={data.systemPrompt}
          onChange={(e) => onChange({ systemPrompt: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Write system-level instructions..."
        />
      </div>

      {/* User Prompt */}
      <div className="space-y-1">
        <div className="flex items-center justify-between">
          <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">User Prompt</label>
          <div className="flex items-center space-x-3">
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowVars((p) => !p)}
                className="flex items-center space-x-1 text-xs text-primary font-mono hover:underline"
              >
                <List className="w-3 h-3" />
                <span>Prompt Variables</span>
              </button>
              {showVars && (
                <div className="absolute right-0 top-5 z-20 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-xl w-56 py-1">
                  {PROMPT_VARS.map((v) => (
                    <button
                      key={v.name}
                      type="button"
                      onClick={() => {
                        const next = data.userPrompt + v.name
                        onChange({ userPrompt: next, description: next })
                        setShowVars(false)
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                    >
                      <p className="text-xs font-mono text-primary">{v.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{v.desc}</p>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <button
              type="button"
              onClick={() => setFullScreen('user')}
              className="flex items-center space-x-1 text-xs text-primary font-mono hover:underline"
            >
              <Maximize2 className="w-3 h-3" />
              <span>Full Screen Editor</span>
            </button>
          </div>
        </div>
        <textarea
          value={data.userPrompt}
          onChange={(e) => onChange({ userPrompt: e.target.value, description: e.target.value })}
          rows={3}
          className="w-full px-3 py-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm font-mono resize-none focus:outline-none focus:ring-1 focus:ring-primary"
          placeholder="Write user-facing instructions..."
        />
      </div>
    </div>
  )
}

interface FlavorEditorProps {
  flavorId?: number
  onClose: () => void
}

export const FlavorEditor = ({ flavorId, onClose }: FlavorEditorProps) => {
  const { currentFlavor, flavors, fetchFlavor, createFlavor, updateFlavor, createStep, updateStep, deleteStep, reorderSteps } = useHumorFlavorStore()

  const [slug, setSlug] = useState('')
  const [description, setDescription] = useState('')
  const [steps, setSteps] = useState<any[]>([])
  const [isAddingStep, setIsAddingStep] = useState(false)
  const [isSavingStep, setIsSavingStep] = useState(false)
  const [isSavingFlavor, setIsSavingFlavor] = useState(false)

  // Lookup data (populated from DB, fallback to hardcoded)
  const [inputTypes, setInputTypes] = useState<LookupItem[]>(FALLBACK_INPUT_TYPES)
  const [outputTypes, setOutputTypes] = useState<LookupItem[]>(FALLBACK_OUTPUT_TYPES)
  const [models, setModels] = useState<LookupItem[]>(FALLBACK_MODELS)
  const [stepTypes, setStepTypes] = useState<LookupItem[]>(FALLBACK_STEP_TYPES)

  // New step form state
  const [newStep, setNewStep] = useState<StepFormData>({ ...DEFAULT_STEP })
  const [showNewStepForm, setShowNewStepForm] = useState(false)

  // Inline edit state
  const [editingStepId, setEditingStepId] = useState<number | null>(null)
  const [editingStepForm, setEditingStepForm] = useState<StepFormData>({ ...DEFAULT_STEP })

  // Load DB lookups once
  useEffect(() => {
    const loadLookups = async () => {
      const [it, ot, m, st] = await Promise.all([
        apiClient.getLLMInputTypes(),
        apiClient.getLLMOutputTypes(),
        apiClient.getLLMModels(),
        apiClient.getHumorFlavorStepTypes(),
      ])
      if (it.length > 0) setInputTypes(it)
      if (ot.length > 0) setOutputTypes(ot)
      if (m.length > 0) setModels(m)
      if (st.length > 0) setStepTypes(st)
    }
    loadLookups()
  }, [])

  useEffect(() => {
    if (flavorId) {
      if (currentFlavor?.id === flavorId) {
        setSlug(currentFlavor.slug)
        setDescription(currentFlavor.description || '')
        setSteps(currentFlavor.steps || [])
      } else {
        const flavor = flavors.find(f => f.id === flavorId)
        if (flavor) {
          setSlug(flavor.slug)
          setDescription(flavor.description || '')
          setSteps(flavor.steps || [])
        } else {
          fetchFlavor(flavorId)
        }
      }
    } else {
      setSlug('')
      setDescription('')
      setSteps([])
    }
    setNewStep({ ...DEFAULT_STEP })
    setShowNewStepForm(false)
    setEditingStepId(null)
  }, [flavorId, currentFlavor, flavors, fetchFlavor])

  useEffect(() => {
    if (flavorId && currentFlavor?.id === flavorId) {
      setSteps(currentFlavor.steps || [])
    }
  }, [currentFlavor?.steps, flavorId])

  const handleAddStep = async () => {
    if (!newStep.systemPrompt.trim() && !newStep.userPrompt.trim()) {
      toast.error('At least one of system prompt or user prompt is required')
      return
    }
    if (!flavorId) {
      toast.error('Save the flavor first before adding steps')
      return
    }
    try {
      setIsAddingStep(true)
      await createStep(flavorId, {
        description: newStep.description.trim() || newStep.userPrompt.trim() || newStep.systemPrompt.trim().slice(0, 100),
        llm_input_type_id: newStep.inputTypeId,
        llm_output_type_id: newStep.outputTypeId,
        llm_model_id: newStep.modelId,
        humor_flavor_step_type_id: newStep.stepTypeId,
        llm_temperature: parseFloat(newStep.temperature) || 0.7,
        llm_system_prompt: newStep.systemPrompt,
        llm_user_prompt: newStep.userPrompt,
      })
      setNewStep({ ...DEFAULT_STEP })
      setShowNewStepForm(false)
      toast.success('Step added')
    } catch {
      toast.error('Failed to add step')
    } finally {
      setIsAddingStep(false)
    }
  }

  const handleDeleteStep = async (stepId: number) => {
    if (!flavorId) return
    try {
      await deleteStep(flavorId, stepId)
      toast.success('Step deleted')
    } catch {
      toast.error('Failed to delete step')
    }
  }

  const handleStartEditStep = (step: any) => {
    setEditingStepId(step.id)
    setEditingStepForm({
      description: step.description || '',
      inputTypeId: step.llm_input_type_id || 1,
      outputTypeId: step.llm_output_type_id || 1,
      modelId: step.llm_model_id || 1,
      stepTypeId: step.humor_flavor_step_type_id || 1,
      temperature: step.llm_temperature != null ? String(step.llm_temperature) : '0.7',
      systemPrompt: step.llm_system_prompt || '',
      userPrompt: step.llm_user_prompt || step.description || '',
    })
  }

  const handleCancelEditStep = () => {
    setEditingStepId(null)
    setEditingStepForm({ ...DEFAULT_STEP })
  }

  const handleSaveStepEdit = async (stepId: number) => {
    if (!editingStepForm.systemPrompt.trim() && !editingStepForm.userPrompt.trim()) {
      toast.error('At least one of system prompt or user prompt is required')
      return
    }
    if (!flavorId) return
    try {
      setIsSavingStep(true)
      await updateStep(flavorId, stepId, {
        description: editingStepForm.description.trim() || editingStepForm.userPrompt.trim() || editingStepForm.systemPrompt.trim().slice(0, 100),
        llm_input_type_id: editingStepForm.inputTypeId,
        llm_output_type_id: editingStepForm.outputTypeId,
        llm_model_id: editingStepForm.modelId,
        humor_flavor_step_type_id: editingStepForm.stepTypeId,
        llm_temperature: parseFloat(editingStepForm.temperature) || 0.7,
        llm_system_prompt: editingStepForm.systemPrompt,
        llm_user_prompt: editingStepForm.userPrompt,
      })
      setEditingStepId(null)
      setEditingStepForm({ ...DEFAULT_STEP })
      toast.success('Step updated')
    } catch {
      toast.error('Failed to update step')
    } finally {
      setIsSavingStep(false)
    }
  }

  const handleDragEnd = async (result: any) => {
    const { source, destination } = result
    if (!destination) return
    const newSteps = Array.from(steps)
    const [moved] = newSteps.splice(source.index, 1)
    newSteps.splice(destination.index, 0, moved)
    setSteps(newSteps)
    if (flavorId) {
      try {
        await reorderSteps(flavorId, newSteps)
        toast.success('Steps reordered')
      } catch {
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
      setIsSavingFlavor(true)
      if (flavorId) {
        await updateFlavor(flavorId, { slug, description })
        toast.success('Flavor updated')
      } else {
        await createFlavor({ slug, description })
        toast.success('Flavor created')
        onClose()
      }
    } catch {
      toast.error('Failed to save flavor')
    } finally {
      setIsSavingFlavor(false)
    }
  }

  const lookupProps = { inputTypes, outputTypes, models, stepTypes }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] mx-4 flex flex-col">

        {/* Header */}
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600 bg-white dark:bg-surface-dark rounded-t-lg z-10">
          <h2 className="text-lg font-mono font-bold neon-text">
            {flavorId ? '> Edit Flavor' : '> New Flavor'}
          </h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">

          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => setSlug(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 input-glow text-sm"
              placeholder="my-humor-flavor"
            />
          </div>

          <div className="space-y-1">
            <label className="block text-xs font-mono uppercase tracking-wider text-gray-400">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 input-glow resize-none text-sm"
              placeholder="Describe what this flavor does..."
              rows={2}
            />
          </div>

          {/* Steps section */}
          {flavorId && (
            <div className="space-y-3">
              <h3 className="text-sm font-mono font-bold text-primary">&gt; Steps</h3>

              {steps.length > 0 ? (
                <DragDropContext onDragEnd={handleDragEnd}>
                  <Droppable droppableId="steps">
                    {(provided) => (
                      <div
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                        className="space-y-2 p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
                      >
                        {steps.map((step, index) => (
                          <Draggable key={step.id} draggableId={`step-${step.id}`} index={index}>
                            {(provided, snapshot) => (
                              <div
                                ref={provided.innerRef}
                                {...provided.draggableProps}
                                style={provided.draggableProps.style}
                                className={`rounded-lg transition ${
                                  snapshot.isDragging
                                    ? 'bg-primary bg-opacity-20 shadow-lg'
                                    : 'bg-gray-50 dark:bg-gray-700'
                                }`}
                              >
                                {editingStepId === step.id ? (
                                  /* Inline edit with full form */
                                  <div className="p-3 space-y-3">
                                    <p className="text-xs font-mono font-bold text-primary uppercase tracking-wider">
                                      Edit Step {index + 1}
                                    </p>
                                    <StepFormFields
                                      data={editingStepForm}
                                      onChange={(u) => setEditingStepForm((p) => ({ ...p, ...u }))}
                                      {...lookupProps}
                                    />
                                    <div className="flex space-x-2 pt-1">
                                      <button
                                        onClick={() => handleSaveStepEdit(step.id)}
                                        disabled={isSavingStep}
                                        className="flex items-center space-x-1 px-3 py-1.5 rounded bg-primary text-bg-dark text-xs font-mono disabled:opacity-50 hover:bg-primary-dark transition"
                                      >
                                        <Check className="w-3 h-3" /><span>{isSavingStep ? 'Saving...' : 'Save'}</span>
                                      </button>
                                      <button
                                        onClick={handleCancelEditStep}
                                        className="flex items-center space-x-1 px-3 py-1.5 rounded border border-gray-300 dark:border-gray-500 text-xs font-mono hover:bg-gray-100 dark:hover:bg-gray-600 transition"
                                      >
                                        <XCircle className="w-3 h-3" /><span>Cancel</span>
                                      </button>
                                    </div>
                                  </div>
                                ) : (
                                  /* Normal step display */
                                  <div className="flex items-start space-x-2 p-2">
                                    <div
                                      {...provided.dragHandleProps}
                                      className="flex-shrink-0 cursor-grab active:cursor-grabbing mt-1"
                                    >
                                      <GripVertical className="w-4 h-4 text-gray-400" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-mono font-bold text-primary">Step {index + 1}</p>
                                      <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-2 whitespace-pre-wrap break-words">
                                        {step.llm_user_prompt || step.description}
                                      </p>
                                      <div className="flex flex-wrap gap-1 mt-1.5">
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-mono">
                                          in: {inputTypes.find(t => t.id === step.llm_input_type_id)?.name ?? step.llm_input_type_id ?? '—'}
                                        </span>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-mono">
                                          out: {outputTypes.find(t => t.id === step.llm_output_type_id)?.name ?? step.llm_output_type_id ?? '—'}
                                        </span>
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-mono">
                                          {models.find(m => m.id === step.llm_model_id)?.name ?? `model ${step.llm_model_id ?? '—'}`}
                                        </span>
                                        {step.llm_temperature != null && (
                                          <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-mono">
                                            temp: {step.llm_temperature}
                                          </span>
                                        )}
                                        <span className="text-xs px-1.5 py-0.5 rounded bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 font-mono">
                                          {stepTypes.find(t => t.id === step.humor_flavor_step_type_id)?.name ?? `type ${step.humor_flavor_step_type_id ?? '—'}`}
                                        </span>
                                      </div>
                                    </div>
                                    <div className="flex-shrink-0 flex items-center space-x-1 mt-0.5">
                                      <button
                                        onClick={() => handleStartEditStep(step)}
                                        className="p-1 hover:bg-blue-500 hover:bg-opacity-20 rounded text-blue-500 transition"
                                        title="Edit step"
                                      >
                                        <Pencil className="w-3.5 h-3.5" />
                                      </button>
                                      <button
                                        onClick={() => handleDeleteStep(step.id)}
                                        className="p-1 hover:bg-red-500 hover:bg-opacity-20 rounded text-red-500 transition"
                                        title="Delete step"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    </div>
                                  </div>
                                )}
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
                <p className="text-sm text-center text-gray-500 italic py-4">
                  No steps yet. Add your first step below.
                </p>
              )}

              {/* Add Step panel */}
              {showNewStepForm ? (
                <div className="border border-dashed border-primary rounded-lg p-4 space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-xs font-mono uppercase tracking-wider text-gray-400">New Step</p>
                      <p className="text-sm font-mono font-bold neon-text mt-0.5">Define the pipeline step</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Choose the model, types, and prompts for this step.</p>
                    </div>
                    <button
                      onClick={() => { setShowNewStepForm(false); setNewStep({ ...DEFAULT_STEP }) }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded mt-0.5"
                    >
                      <XCircle className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>

                  <StepFormFields
                    data={newStep}
                    onChange={(u) => setNewStep((p) => ({ ...p, ...u }))}
                    {...lookupProps}
                  />

                  <button
                    onClick={handleAddStep}
                    disabled={isAddingStep}
                    className="w-full py-2 rounded-lg bg-primary text-bg-dark font-mono font-bold hover:bg-primary-dark disabled:opacity-50 transition flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{isAddingStep ? 'Adding...' : 'Add Step'}</span>
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowNewStepForm(true)}
                  className="w-full py-2.5 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 hover:border-primary text-gray-500 hover:text-primary font-mono text-sm transition flex items-center justify-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>New Step</span>
                </button>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-gray-200 dark:border-gray-600 bg-white dark:bg-surface-dark flex space-x-2 p-4 rounded-b-lg">
          <button
            onClick={onClose}
            className="flex-1 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-mono text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSaveFlavor}
            disabled={isSavingFlavor}
            className="flex-1 py-2 rounded-lg bg-primary text-bg-dark font-mono font-bold hover:bg-primary-dark disabled:opacity-50 transition text-sm"
          >
            {isSavingFlavor ? 'Saving...' : 'Save Flavor'}
          </button>
        </div>
      </div>
    </div>
  )
}

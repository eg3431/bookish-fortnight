'use client'

import React, { useState, useRef } from 'react'
import { useHumorFlavorStore } from '@/lib/store'
import { X, Play, Loader, Upload, Trash2, ImageIcon, ExternalLink } from 'lucide-react'
import { cachedAccessToken } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface FlavorTesterProps {
  flavorId: number
  onClose: () => void
  onViewCaptions?: () => void
}

type ImageStatus = 'pending' | 'uploading' | 'loading' | 'done' | 'error'

interface TestImage {
  id: string
  file?: File
  preview: string     // local blob URL or final public URL
  publicUrl?: string  // after upload
  status: ImageStatus
  captions?: string[]
  error?: string
}

export const FlavorTester = ({ flavorId, onClose, onViewCaptions }: FlavorTesterProps) => {
  const { testFlavor } = useHumorFlavorStore()
  const [images, setImages] = useState<TestImage[]>([])
  const [phase, setPhase] = useState<'setup' | 'running' | 'done'>('setup')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLDivElement>(null)
  const captionsSectionRef = useRef<HTMLDivElement>(null)

  const updateImage = (id: string, patch: Partial<TestImage>) =>
    setImages((prev) => prev.map((img) => (img.id === id ? { ...img, ...patch } : img)))

  const handleFiles = (files: FileList | null) => {
    if (!files) return
    const newImages: TestImage[] = []
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue
      if (file.size > 10 * 1024 * 1024) { toast.error(`${file.name} is too large (max 10MB)`); continue }
      newImages.push({
        id: `${Date.now()}-${Math.random()}`,
        file,
        preview: URL.createObjectURL(file),
        status: 'pending',
      })
    }
    setImages((prev) => [...prev, ...newImages])
  }

  const handleRemove = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id)
      if (img?.preview.startsWith('blob:')) URL.revokeObjectURL(img.preview)
      return prev.filter((i) => i.id !== id)
    })
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    handleFiles(e.dataTransfer.files)
  }

  const handleRun = async () => {
    if (images.length === 0) { toast.error('Add at least one image'); return }
    const token = cachedAccessToken
    if (!token) { toast.error('Not authenticated'); return }

    setPhase('running')

    for (const img of images) {
      // 1. Get presigned URL
      let publicUrl = img.publicUrl
      if (!publicUrl && img.file) {
        try {
        const presignRes = await fetch('/api/upload', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({ contentType: img.file.type }),
        })
        if (!presignRes.ok) {
          const e = await presignRes.json().catch(() => ({}))
          throw new Error(e.error || `Presign failed (${presignRes.status})`)
        }
        const { presignedUrl, cdnUrl } = await presignRes.json()

        // Step 2: PUT image bytes directly to S3
        const putRes = await fetch(presignedUrl, {
          method: 'PUT',
          headers: { 'Content-Type': img.file.type },
          body: img.file,
        })
        if (!putRes.ok) throw new Error(`S3 upload failed (${putRes.status})`)

        publicUrl = cdnUrl
        updateImage(img.id, { publicUrl: cdnUrl, preview: cdnUrl })
        } catch (err: any) {
          updateImage(img.id, { status: 'error', error: err.message })
          continue
        }
      }

      // 2. Generate captions
      updateImage(img.id, { status: 'loading' })
      try {
        const result = await testFlavor(flavorId, publicUrl!)
        // API returns an array of caption objects with a `content` field directly
        const rawList: any[] = Array.isArray(result)
          ? result
          : Array.isArray(result?.captions)
            ? result.captions
            : result?.caption
              ? [result.caption]
              : []
        const captions: string[] = rawList.length > 0
          ? rawList.map((c: any) => typeof c === 'string' ? c : c.content ?? c.text ?? JSON.stringify(c))
          : [JSON.stringify(result)]
        updateImage(img.id, { status: 'done', captions })
      } catch (err: any) {
        const raw = err.message ?? ''
        const friendly = raw.includes('500') || raw.includes('Server Error') || raw.includes('not valid JSON')
          ? 'Caption generation failed — please check your step configuration. Common issues: Output Type should be "Array", system prompt must instruct the model to return only a JSON array, and all intermediate steps must also return valid JSON.'
          : raw
        updateImage(img.id, { status: 'error', error: friendly })
      }
    }

    setPhase('done')
  }

  const allDone = images.length > 0 && images.every((i) => i.status === 'done' || i.status === 'error')
  const running = phase === 'running' && !allDone
  const doneImages = images.filter((i) => i.status === 'done')

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] mx-4 flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-gray-400">Caption Requests</p>
            <h2 className="text-lg font-bold font-mono neon-text mt-0.5">&gt; Test Flavor</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Upload images to generate captions for each one.</p>
          </div>
          <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div ref={bodyRef} className="flex-1 overflow-y-auto p-5 space-y-4 min-h-0">

          {/* Upload zone — only show in setup phase */}
          {phase === 'setup' && (
            <div
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-gray-300 dark:border-gray-600 hover:border-primary rounded-xl p-8 text-center cursor-pointer transition group"
            >
              <Upload className="w-8 h-8 mx-auto text-gray-400 group-hover:text-primary transition mb-2" />
              <p className="text-sm font-mono text-gray-500 group-hover:text-primary transition">
                Click or drag &amp; drop images here
              </p>
              <p className="text-xs text-gray-400 mt-1">PNG, JPG, WEBP · up to 10MB each</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
          )}

          {/* Image list */}
          {images.length > 0 && (
            <div className="space-y-2">
              {images.map((img, idx) => (
                <div key={img.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  {/* Thumbnail */}
                  <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                    {img.preview ? (
                      <img src={img.preview} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-5 h-5 text-gray-400" />
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono uppercase tracking-wider text-gray-400">Image {idx + 1}</p>
                    {img.captions && img.captions.length > 0 ? (
                      <ol className="mt-0.5 space-y-0.5 list-decimal list-inside">
                        {img.captions.map((c, i) => (
                          <li key={i} className="text-xs text-gray-600 dark:text-gray-300">{c}</li>
                        ))}
                      </ol>
                    ) : img.error ? (
                      <p className="text-xs text-red-500 mt-0.5">{img.error}</p>
                    ) : (
                      <p className="text-xs text-gray-400 mt-0.5 italic">
                        {img.status === 'uploading' ? 'Uploading...' : img.status === 'loading' ? 'Generating...' : 'Ready'}
                      </p>
                    )}
                  </div>

                  {/* Status badge / remove */}
                  <div className="flex-shrink-0 flex items-center gap-2">
                    {img.status === 'pending' && phase === 'setup' && (
                      <button onClick={() => handleRemove(img.id)} className="p-1 text-gray-400 hover:text-red-500 transition">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                    {(img.status === 'uploading' || img.status === 'loading') && (
                      <span className="text-xs font-mono text-yellow-500 uppercase tracking-wider flex items-center gap-1">
                        <Loader className="w-3 h-3 animate-spin" /> Loading...
                      </span>
                    )}
                    {img.status === 'done' && (
                      <span className="text-xs font-mono text-primary uppercase tracking-wider">Done!</span>
                    )}
                    {img.status === 'error' && (
                      <span className="text-xs font-mono text-red-500 uppercase tracking-wider">Error</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Captions view — shown after done */}
          {phase === 'done' && doneImages.length > 0 && (
            <div ref={captionsSectionRef} className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-4">
              <h3 className="text-sm font-mono font-bold text-primary uppercase tracking-wider">&gt; Generated Captions</h3>
              {doneImages.map((img, imgIdx) => (
                <div key={img.id} className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <img src={img.preview} alt="" className="w-7 h-7 rounded object-cover" />
                    <span className="text-xs font-mono text-gray-400 uppercase">Image {images.indexOf(img) + 1}</span>
                  </div>
                  {img.captions?.map((caption, i) => (
                    <div key={i} className="flex gap-2 items-start pl-9">
                      <span className="text-primary font-mono font-bold text-xs flex-shrink-0">{i + 1}.</span>
                      <p className="text-sm dark:text-gray-200">{caption}</p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-surface-dark rounded-b-xl">
          <span className="text-xs font-mono uppercase tracking-wider text-gray-400">
            {running ? 'Requests Running' : phase === 'done' ? 'Requests Complete' : `${images.length} image${images.length !== 1 ? 's' : ''} queued`}
          </span>
          <div className="flex gap-2">
            {phase === 'done' && doneImages.length > 0 && onViewCaptions && (
              <button
                onClick={() => { onClose(); onViewCaptions() }}
                className="px-4 py-2 rounded-lg bg-primary text-bg-dark font-mono font-bold text-sm hover:bg-primary-dark transition"
              >
                View Captions
              </button>
            )}
            {phase === 'setup' && (
              <button
                onClick={handleRun}
                disabled={images.length === 0}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary text-bg-dark font-mono font-bold text-sm hover:bg-primary-dark disabled:opacity-40 disabled:cursor-not-allowed transition"
              >
                <Play className="w-4 h-4" />
                Run Test
              </button>
            )}
            {phase === 'done' && (
              <button
                onClick={() => { setImages([]); setPhase('setup') }}
                className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
              >
                New Test
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}



'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Star, Play, Loader, ChevronDown, Check } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'

interface HumorFlavor {
  id: number
  slug: string
  description?: string
}

interface GeneratedCaption {
  text: string
  score: number | null
  submitted: boolean
}

// Stable anonymous token for the tab session
function getOrCreateToken(): string {
  if (typeof window === 'undefined') return 'ssr'
  let token = sessionStorage.getItem('rater_token')
  if (!token) {
    token = `anon_${Date.now()}_${Math.random().toString(36).slice(2)}`
    sessionStorage.setItem('rater_token', token)
  }
  return token
}

const StarRating = ({
  value,
  onChange,
  disabled,
}: {
  value: number | null
  onChange: (n: number) => void
  disabled?: boolean
}) => (
  <div className="flex items-center space-x-1">
    {[1, 2, 3, 4, 5].map((n) => (
      <button
        key={n}
        disabled={disabled}
        onClick={() => onChange(n)}
        className={`transition-colors disabled:cursor-not-allowed ${
          value !== null && n <= value
            ? 'text-yellow-400'
            : 'text-gray-300 dark:text-gray-600 hover:text-yellow-300'
        }`}
        aria-label={`Rate ${n} star${n > 1 ? 's' : ''}`}
      >
        <Star className="w-6 h-6 fill-current" />
      </button>
    ))}
  </div>
)

export default function RatePage() {
  const [flavors, setFlavors] = useState<HumorFlavor[]>([])
  const [selectedFlavor, setSelectedFlavor] = useState<HumorFlavor | null>(null)
  const [imageUrl, setImageUrl] = useState('')
  const [captions, setCaptions] = useState<GeneratedCaption[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState<number | null>(null)
  const userToken = getOrCreateToken()

  useEffect(() => {
    const loadFlavors = async () => {
      const { data } = await supabase
        .from('humor_flavors')
        .select('id, slug, description')
        .order('created_datetime_utc', { ascending: false })
      if (data && data.length > 0) {
        setFlavors(data)
        setSelectedFlavor(data[0])
      }
    }
    loadFlavors()
  }, [])

  const handleGenerate = async () => {
    if (!imageUrl.trim()) { toast.error('Please enter an image URL'); return }
    if (!selectedFlavor) { toast.error('Please select a humor flavor'); return }

    try {
      setIsGenerating(true)
      setCaptions([])

      const { data: steps } = await supabase
        .from('humor_flavor_steps')
        .select('*')
        .eq('humor_flavor_id', selectedFlavor.id)
        .order('order_by', { ascending: true })

      const promptChain = (steps || []).map((s: any) => ({
        order: s.order_by,
        description: s.description,
      }))

      const res = await fetch('/api/captions/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          flavorSlug: selectedFlavor.slug,
          flavorDescription: selectedFlavor.description || '',
          promptChain,
          imageUrl: imageUrl.trim(),
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: res.statusText }))
        throw new Error(err.error || 'Failed to generate captions')
      }

      const result = await res.json()

      const raw: string[] =
        result.captions ||
        result.results ||
        (typeof result.caption === 'string' ? [result.caption] : null) ||
        (typeof result === 'string' ? [result] : null) ||
        []

      if (raw.length === 0) {
        toast.error('No captions returned — check the API or flavor steps')
        return
      }

      setCaptions(raw.map((text) => ({ text, score: null, submitted: false })))
      toast.success(`${raw.length} caption${raw.length > 1 ? 's' : ''} generated!`)
    } catch (err: any) {
      toast.error(err.message || 'Failed to generate captions')
    } finally {
      setIsGenerating(false)
    }
  }

  const handleRate = useCallback((idx: number, score: number) => {
    setCaptions((prev) => prev.map((c, i) => (i === idx ? { ...c, score } : c)))
  }, [])

  const handleSubmitVote = async (idx: number) => {
    const caption = captions[idx]
    if (caption.score === null) { toast.error('Select a star rating first'); return }

    try {
      setIsSubmitting(idx)
      const res = await fetch('/api/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          captionText: caption.text,
          humorFlavorId: selectedFlavor?.id ?? null,
          score: caption.score,
          imageUrl: imageUrl.trim(),
          userToken,
        }),
      })

      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: 'Server error' }))
        throw new Error(err.error)
      }

      setCaptions((prev) => prev.map((c, i) => (i === idx ? { ...c, submitted: true } : c)))
      toast.success('Rating submitted!')
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit rating')
    } finally {
      setIsSubmitting(null)
    }
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      {/* Minimal header */}
      <header className="sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-surface-dark">
        <div className="flex h-14 items-center justify-between px-4 max-w-4xl mx-auto">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-7 h-7 bg-primary rounded flex items-center justify-center">
              <span className="text-bg-dark font-bold text-xs">HF</span>
            </div>
            <span className="font-mono font-bold neon-text text-sm">&gt; caption_rater</span>
          </Link>
          <Link
            href="/dashboard"
            className="text-xs font-mono text-gray-500 hover:text-primary transition"
          >
            ← prompt chain tool
          </Link>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-mono font-bold neon-text">&gt; Rate Captions</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
            Generate captions with a humor flavor and rate each one
          </p>
        </div>

        {/* Config panel */}
        <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-5 bg-white dark:bg-surface-dark space-y-4">
          {/* Flavor selector */}
          <div className="space-y-1">
            <label className="block text-sm font-mono text-primary">Humor Flavor</label>
            <div className="relative">
              <select
                value={selectedFlavor?.id ?? ''}
                onChange={(e) => {
                  const f = flavors.find((fl) => fl.id === Number(e.target.value))
                  setSelectedFlavor(f ?? null)
                }}
                className="w-full appearance-none px-3 py-2 pr-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
              >
                {flavors.length === 0 && <option value="">Loading flavors...</option>}
                {flavors.map((f) => (
                  <option key={f.id} value={f.id}>{f.slug}</option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none text-gray-400" />
            </div>
            {selectedFlavor?.description && (
              <p className="text-xs text-gray-400 font-mono pl-1">{selectedFlavor.description}</p>
            )}
          </div>

          {/* Image URL */}
          <div className="space-y-1">
            <label className="block text-sm font-mono text-primary">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Image preview */}
          {imageUrl && (
            <div className="rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 max-h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={imageUrl}
                alt="Preview"
                className="max-h-48 object-contain"
                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
              />
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !imageUrl.trim() || !selectedFlavor}
            className="w-full flex items-center justify-center space-x-2 py-2.5 rounded-lg bg-primary text-bg-dark font-mono font-bold hover:bg-primary-dark disabled:opacity-50 transition"
          >
            {isGenerating ? (
              <><Loader className="w-4 h-4 animate-spin" /><span>Generating...</span></>
            ) : (
              <><Play className="w-4 h-4" /><span>Generate Captions</span></>
            )}
          </button>
        </div>

        {/* Captions list */}
        {captions.length > 0 && (
          <div className="space-y-4">
            <h2 className="font-mono font-bold text-primary">&gt; Rate Each Caption</h2>
            {captions.map((caption, idx) => (
              <div
                key={idx}
                className={`border rounded-lg p-4 space-y-3 bg-white dark:bg-surface-dark transition ${
                  caption.submitted
                    ? 'border-green-400 dark:border-green-600 opacity-75'
                    : 'border-gray-300 dark:border-gray-600'
                }`}
              >
                <div className="flex items-start justify-between space-x-2">
                  <p className="text-sm dark:text-gray-200 leading-relaxed flex-1">{caption.text}</p>
                  {caption.submitted && <Check className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />}
                </div>

                {!caption.submitted ? (
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <StarRating
                      value={caption.score}
                      onChange={(n) => handleRate(idx, n)}
                      disabled={isSubmitting === idx}
                    />
                    <button
                      onClick={() => handleSubmitVote(idx)}
                      disabled={caption.score === null || isSubmitting === idx}
                      className="flex items-center space-x-1 px-4 py-1.5 rounded-lg bg-primary text-bg-dark font-mono text-xs font-bold hover:bg-primary-dark disabled:opacity-40 transition"
                    >
                      {isSubmitting === idx
                        ? <Loader className="w-3 h-3 animate-spin" />
                        : <span>Submit Rating</span>}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-green-600 dark:text-green-400 font-mono">
                    ✓ Rated {caption.score}/5 — thank you!
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {captions.length === 0 && !isGenerating && (
          <div className="text-center py-12 text-gray-400 font-mono text-sm">
            <p>&gt; enter an image URL and generate captions to start rating</p>
          </div>
        )}
      </main>
    </div>
  )
}

'use client'

import React, { useEffect, useState } from 'react'
import { X, ChevronLeft, ChevronRight } from 'lucide-react'
import { cachedAccessToken } from '@/lib/supabase'

interface Caption {
  id: string
  content: string
  created_datetime_utc: string
  image_id: string
  caption_request_id: number
  llm_prompt_chain_id: number
  images?: { cdn_image_url?: string; url?: string }
}

interface FlavorCaptionsProps {
  flavorId: number
  flavorSlug: string
  flavorDescription?: string
  onClose: () => void
}

const PAGE_SIZE = 6

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
    hour: 'numeric', minute: '2-digit',
  })
}

export const FlavorCaptions = ({ flavorId, flavorSlug, flavorDescription, onClose }: FlavorCaptionsProps) => {
  const [captions, setCaptions] = useState<Caption[]>([])
  const [imageMap, setImageMap] = useState<Record<string, string>>({})
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE))

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      setError(null)
      try {
        const token = cachedAccessToken
        if (!token) throw new Error('Not authenticated')
        const res = await fetch(
          `/api/captions?flavorId=${flavorId}&page=${page}&pageSize=${PAGE_SIZE}`,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        if (!res.ok) {
          const e = await res.json().catch(() => ({}))
          throw new Error(e.error || `HTTP ${res.status}`)
        }
        const { captions: rows, total: t, imageMap: im } = await res.json()
        setCaptions(rows)
        setTotal(t)
        setImageMap(im ?? {})
      } catch (err: any) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [flavorId, page])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-surface-dark rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] mx-4 flex flex-col">

        {/* Header */}
        <div className="flex items-start justify-between px-6 py-5 border-b border-gray-200 dark:border-gray-700">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-gray-400">Captions</p>
            <h2 className="text-2xl font-bold font-mono neon-text mt-0.5">{flavorSlug}</h2>
            {flavorDescription && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{flavorDescription}</p>
            )}
          </div>
          <div className="flex items-center gap-4 mt-1">
            {total > 0 && (
              <span className="text-xs font-mono uppercase tracking-wider text-primary">
                {total} caption{total !== 1 ? 's' : ''}
              </span>
            )}
            {totalPages > 1 && (
              <span className="text-xs font-mono text-gray-400">
                Page {page} / {totalPages}
              </span>
            )}
            <button onClick={onClose} className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 min-h-0">
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : error ? (
            <p className="text-red-500 text-sm font-mono text-center py-12">{error}</p>
          ) : captions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 font-mono text-center py-12">
              &gt; no captions yet. run a test to generate some.
            </p>
          ) : (
            <>
              <p className="text-xs text-gray-400 font-mono mb-4">
                Latest caption entries &mdash; ordered by newest first with images attached to each caption.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {captions.map((caption) => {
                  const imgUrl = imageMap[caption.image_id]
                  return (
                    <div
                      key={caption.id}
                      className="flex gap-3 p-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                    >
                      {imgUrl ? (
                        <img
                          src={imgUrl}
                          alt=""
                          className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0 space-y-1">
                        <p className="text-xs font-mono text-gray-400 uppercase tracking-wider">
                          {formatDate(caption.created_datetime_utc)}
                        </p>
                        <p className="text-sm dark:text-gray-200 leading-snug">{caption.content}</p>
                        <p className="text-xs font-mono text-primary opacity-70">
                          {caption.caption_request_id} &lt;&gt; {caption.llm_prompt_chain_id}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </>
          )}
        </div>

        {/* Pagination footer */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              <ChevronLeft className="w-4 h-4" /> Prev
            </button>
            <span className="text-xs font-mono text-gray-400">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-sm disabled:opacity-40 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

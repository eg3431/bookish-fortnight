'use client'

import React, { useState } from 'react'
import { useHumorFlavorStore } from '@/lib/store'
import { X, Play, Loader } from 'lucide-react'
import toast from 'react-hot-toast'

interface FlavorTesterProps {
  flavorId: number
  onClose: () => void
}

export const FlavorTester = ({ flavorId, onClose }: FlavorTesterProps) => {
  const { testFlavor } = useHumorFlavorStore()
  const [imageUrl, setImageUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [results, setResults] = useState<any>(null)

  const hasApiKey = !!process.env.NEXT_PUBLIC_API_KEY
  const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL

  const handleTest = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL')
      return
    }

    if (!hasApiKey) {
      toast.error('API key not configured. Set NEXT_PUBLIC_API_KEY in .env.local')
      return
    }

    try {
      setIsLoading(true)
      const result = await testFlavor(flavorId, imageUrl)
      setResults(result)
      toast.success('Captions generated successfully!')
    } catch (error: any) {
      console.error('Test error:', error)
      toast.error(error.message || 'Failed to generate captions')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-surface-dark rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto mx-4">
        <div className="sticky top-0 flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-600">
          <h2 className="text-lg font-mono font-bold neon-text">&gt; Test Flavor</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 space-y-4">
          {/* Configuration warning */}
          {!hasApiKey && (
            <div className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-400 font-mono">
                ⚠️ API key not configured. Add NEXT_PUBLIC_API_KEY to .env.local
              </p>
            </div>
          )}

          {/* API Info */}
          <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs">
            <p className="text-blue-700 dark:text-blue-300 font-mono">
              API: {apiUrl || 'Not configured'}
            </p>
          </div>
          {/* Image URL Input */}
          <div className="space-y-2">
            <label className="block text-sm font-mono text-primary">Image URL</label>
            <input
              type="url"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://example.com/image.jpg"
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 input-glow"
            />
          </div>

          {/* Image Preview */}
          {imageUrl && (
            <div className="space-y-2">
              <label className="block text-sm font-mono text-primary">Preview</label>
              <img
                src={imageUrl}
                alt="Preview"
                className="w-full rounded-lg max-h-64 object-cover border border-gray-300 dark:border-gray-600"
                onError={() => toast.error('Failed to load image')}
              />
            </div>
          )}

          {/* Test Button */}
          <button
            onClick={handleTest}
            disabled={isLoading || !hasApiKey}
            className="w-full py-2 rounded-lg bg-primary text-bg-dark font-mono font-bold hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
              </>
            ) : !hasApiKey ? (
              <>
                <span>Configure API Key First</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                <span>Generate Captions</span>
              </>
            )}
          </button>

          {/* Results */}
          {results && (
            <div className="space-y-2 pt-4 border-t border-gray-200 dark:border-gray-600">
              <h3 className="text-sm font-mono font-bold text-primary">&gt; Generated Captions</h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {results.captions && Array.isArray(results.captions) && results.captions.length > 0 ? (
                  results.captions.map((caption: string | { text?: string; confidence?: number }, idx: number) => {
                    const captionText = typeof caption === 'string' ? caption : caption.text || JSON.stringify(caption)
                    const confidence = typeof caption === 'object' && caption.confidence ? ` (${Math.round(caption.confidence * 100)}%)` : ''
                    return (
                      <div
                        key={idx}
                        className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border-l-4 border-primary"
                      >
                        <div className="flex items-start space-x-2">
                          <span className="text-primary font-mono font-bold text-xs mt-0.5">{idx + 1}.</span>
                          <div className="flex-1">
                            <p className="text-sm">{captionText}</p>
                            {confidence && <p className="text-xs text-gray-500 mt-1">{confidence}</p>}
                          </div>
                        </div>
                      </div>
                    )
                  })
                ) : (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700 border-l-4 border-yellow-500">
                    <p className="text-sm font-mono">
                      Raw response: {JSON.stringify(results, null, 2)}
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-4 border-t border-gray-200 dark:border-gray-600">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition font-mono"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

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

  const handleTest = async () => {
    if (!imageUrl.trim()) {
      toast.error('Please enter an image URL')
      return
    }

    try {
      setIsLoading(true)
      const result = await testFlavor(flavorId, imageUrl)
      setResults(result)
      toast.success('Captions generated')
    } catch (error: any) {
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
            disabled={isLoading}
            className="w-full py-2 rounded-lg bg-primary text-bg-dark font-mono font-bold hover:bg-primary-dark disabled:opacity-50 transition flex items-center justify-center space-x-2"
          >
            {isLoading ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                <span>Generating...</span>
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
              <div className="space-y-2">
                {Array.isArray(results.captions) ? (
                  results.captions.map((caption: string, idx: number) => (
                    <div
                      key={idx}
                      className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700 border-l-2 border-primary"
                    >
                      <p className="text-sm">{caption}</p>
                    </div>
                  ))
                ) : (
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-700">
                    <p className="text-sm">{JSON.stringify(results.captions)}</p>
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

'use client'

import React, { useState, useEffect } from 'react'
import { Header } from '@/components'
import { FlavorList } from '@/components'
import { FlavorEditor } from '@/components'
import { FlavorTester } from '@/components'
import { FlavorCaptions } from '@/components'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'
import { useHumorFlavorStore } from '@/lib/store'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const { isLoading: authLoading, session, isAdmin } = useAuth()
  const router = useRouter()
  const { currentFlavor, fetchFlavor } = useHumorFlavorStore()
  
  const [selectedFlavorId, setSelectedFlavorId] = useState<number>()
  const [showEditor, setShowEditor] = useState(false)
  const [showTester, setShowTester] = useState(false)
  const [showCaptions, setShowCaptions] = useState(false)
  const [editingFlavor, setEditingFlavor] = useState(false)

  useEffect(() => {
    if (!authLoading) {
      if (!session) {
        router.push('/')
      }
    }
  }, [authLoading, session, router])

  const handleSelectFlavor = (id: number) => {
    setSelectedFlavorId(id)
    setEditingFlavor(false)
    fetchFlavor(id)
  }

  const handleCreateNew = () => {
    setSelectedFlavorId(undefined)
    setShowEditor(true)
    setEditingFlavor(true)
  }

  const handleEditFlavor = (id: number) => {
    setSelectedFlavorId(id)
    fetchFlavor(id)
    setEditingFlavor(true)
    setShowEditor(true)
  }

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="font-mono text-primary">&gt; loading...</p>
        </div>
      </div>
    )
  }

  if (!session) {
    return null
  }

  // Block non-admin users
  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg-light dark:bg-bg-dark px-4">
        <div className="text-center space-y-4 border border-red-400 rounded-lg p-8 bg-white dark:bg-surface-dark max-w-md">
          <div className="w-12 h-12 bg-red-500 rounded flex items-center justify-center mx-auto">
            <span className="text-white font-bold text-xl">✕</span>
          </div>
          <h2 className="text-xl font-mono font-bold text-red-500">Access Denied</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 font-mono">
            This tool requires superadmin or matrix admin privileges.<br />
            Your account does not have the required permissions.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="px-6 py-2 rounded-lg border border-gray-300 dark:border-gray-600 font-mono text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      <Header />

      <main className="container mx-auto px-4 py-6 max-w-7xl">
        <div className="grid grid-cols-1 lg:grid-cols-7 gap-6">
          {/* Sidebar - Flavor List */}
          <div className="lg:col-span-2">
            <div className="sticky top-20 border border-gray-300 dark:border-gray-600 rounded-lg p-4 bg-white dark:bg-surface-dark">
              <FlavorList
                onSelectFlavor={handleSelectFlavor}
                onCreateNew={handleCreateNew}
                onEditFlavor={handleEditFlavor}
                selectedId={selectedFlavorId}
              />
            </div>
          </div>

          {/* Main Content - Flavor Details */}
          <div className="lg:col-span-5">
            {selectedFlavorId && currentFlavor ? (
              <div className="space-y-6">
                {/* Flavor Header */}
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-surface-dark">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h1 className="text-3xl font-mono font-bold neon-text">{currentFlavor.slug}</h1>
                      <p className="text-gray-600 dark:text-gray-400 mt-2">{currentFlavor.description}</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => {
                          setEditingFlavor(true)
                          setShowEditor(true)
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-500 text-white font-mono hover:bg-blue-600 transition"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setShowCaptions(true)}
                        className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 font-mono hover:bg-gray-100 dark:hover:bg-gray-700 transition text-sm"
                      >
                        Captions
                      </button>
                      <button
                        onClick={() => setShowTester(true)}
                        className="px-4 py-2 rounded-lg bg-primary text-bg-dark font-mono hover:bg-primary-dark transition"
                      >
                        Test
                      </button>
                    </div>
                  </div>
                </div>

                {/* Steps List */}
                <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-surface-dark">
                  <h2 className="text-lg font-mono font-bold neon-text mb-4">&gt; Steps ({currentFlavor.steps?.length || 0})</h2>
                  {currentFlavor.steps && currentFlavor.steps.length > 0 ? (
                    <div className="space-y-2">
                      {currentFlavor.steps.map((step, idx) => (
                        <div
                          key={step.id}
                          className="p-4 rounded-lg border-l-4 border-primary bg-gray-50 dark:bg-gray-700"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <p className="font-mono font-semibold text-primary">Step {idx + 1}</p>
                              <p className="text-sm mt-1 dark:text-gray-300 line-clamp-3 break-words">{step.description}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500 dark:text-gray-400 text-center py-8 font-mono">
                      &gt; no steps configured. edit the flavor to add steps.
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-12 bg-white dark:bg-surface-dark text-center">
                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-400 font-mono text-lg">&gt; select a flavor or create a new one</p>
                  <button
                    onClick={handleCreateNew}
                    className="px-6 py-3 rounded-lg bg-primary text-bg-dark font-mono font-bold hover:bg-primary-dark transition"
                  >
                    Create New Flavor
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Modals */}
      {showEditor && (
        <FlavorEditor
          flavorId={editingFlavor ? selectedFlavorId : undefined}
          onClose={() => {
            setShowEditor(false)
            setEditingFlavor(false)
          }}
        />
      )}

      {showTester && selectedFlavorId && (
        <FlavorTester
          flavorId={selectedFlavorId}
          onClose={() => setShowTester(false)}
          onViewCaptions={() => { setShowTester(false); setShowCaptions(true) }}
        />
      )}

      {showCaptions && selectedFlavorId && currentFlavor && (
        <FlavorCaptions
          flavorId={selectedFlavorId}
          flavorSlug={currentFlavor.slug}
          flavorDescription={currentFlavor.description}
          onClose={() => setShowCaptions(false)}
        />
      )}
    </div>
  )
}

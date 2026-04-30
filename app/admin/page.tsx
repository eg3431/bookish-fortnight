'use client'

import React, { useEffect, useState } from 'react'
import { Header } from '@/components'
import { useAuth } from '@/lib/auth-provider'
import { useRouter } from 'next/navigation'
import { BarChart2, Layers, Star, MessageSquare, RefreshCw } from 'lucide-react'

interface FlavorStat {
  id: number
  slug: string
  description: string
  stepCount: number
  captionCount: number
  createdAt: string
}

interface ScoreBucket {
  score: number
  count: number
}

interface StatsData {
  totalFlavors: number
  totalSteps: number
  totalCaptions: number
  totalRatings: number
  avgScore: string
  flavorStats: FlavorStat[]
  scoreDistribution: ScoreBucket[]
}

const StatCard = ({
  icon: Icon,
  label,
  value,
  color,
}: {
  icon: React.ElementType
  label: string
  value: string | number
  color: string
}) => (
  <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-5 bg-white dark:bg-surface-dark flex items-center space-x-4">
    <div className={`p-3 rounded-lg ${color} bg-opacity-10 dark:bg-opacity-20`}>
      <Icon className={`w-6 h-6 ${color.replace('bg-', 'text-')}`} />
    </div>
    <div>
      <p className="text-2xl font-mono font-bold">{value}</p>
      <p className="text-sm text-gray-500 dark:text-gray-400 font-mono">{label}</p>
    </div>
  </div>
)

const CSSBarChart = ({ data, maxValue, labelKey, valueKey, color }: {
  data: any[]
  maxValue: number
  labelKey: string
  valueKey: string
  color: string
}) => (
  <div className="space-y-2">
    {data.map((item, idx) => {
      const pct = maxValue > 0 ? (item[valueKey] / maxValue) * 100 : 0
      return (
        <div key={idx} className="flex items-center space-x-2">
          <span className="w-28 text-xs font-mono text-right truncate shrink-0 text-gray-600 dark:text-gray-400">
            {item[labelKey]}
          </span>
          <div className="flex-1 h-5 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
            <div
              className={`h-full rounded transition-all duration-500 ${color}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="w-8 text-xs font-mono text-right shrink-0">{item[valueKey]}</span>
        </div>
      )
    })}
  </div>
)

export default function AdminPage() {
  const { isLoading: authLoading, session } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<StatsData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !session) {
      router.push('/')
    }
  }, [authLoading, session, router])

  const fetchStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const res = await fetch('/api/admin/stats')
      if (!res.ok) throw new Error('Failed to load statistics')
      const data = await res.json()
      setStats(data)
    } catch (err: any) {
      setError(err.message || 'Unknown error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (session) fetchStats()
  }, [session])

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!session) return null

  const maxSteps =
    stats ? Math.max(...stats.flavorStats.map((f) => f.stepCount), 1) : 1
  const maxCaptions =
    stats ? Math.max(...stats.flavorStats.map((f) => f.captionCount), 1) : 1
  const maxScoreBucket =
    stats ? Math.max(...stats.scoreDistribution.map((b) => b.count), 1) : 1

  return (
    <div className="min-h-screen bg-bg-light dark:bg-bg-dark">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl space-y-8">
        {/* Page title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-mono font-bold neon-text">&gt; admin_dashboard</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 font-mono mt-1">
              Caption generation &amp; rating statistics
            </p>
          </div>
          <button
            onClick={fetchStats}
            disabled={loading}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:border-primary transition font-mono text-sm disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 font-mono text-sm">
            Error: {error}
          </div>
        )}

        {loading && !stats ? (
          <div className="flex items-center justify-center py-24">
            <div className="text-center space-y-3">
              <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="font-mono text-primary text-sm">&gt; loading statistics...</p>
            </div>
          </div>
        ) : stats ? (
          <>
            {/* Summary Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard
                icon={Layers}
                label="Total Flavors"
                value={stats.totalFlavors}
                color="bg-primary"
              />
              <StatCard
                icon={BarChart2}
                label="Total Steps"
                value={stats.totalSteps}
                color="bg-blue-500"
              />
              <StatCard
                icon={MessageSquare}
                label="Captions Generated"
                value={stats.totalCaptions}
                color="bg-purple-500"
              />
              <StatCard
                icon={Star}
                label={`Avg Score (${stats.totalRatings} votes)`}
                value={stats.totalRatings > 0 ? stats.avgScore : '—'}
                color="bg-yellow-500"
              />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Steps per flavor */}
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-surface-dark">
                <h2 className="text-base font-mono font-bold neon-text mb-4">
                  &gt; Steps per Flavor
                </h2>
                {stats.flavorStats.length === 0 ? (
                  <p className="text-gray-500 font-mono text-sm text-center py-8">
                    No flavors yet
                  </p>
                ) : (
                  <CSSBarChart
                    data={stats.flavorStats}
                    maxValue={maxSteps}
                    labelKey="slug"
                    valueKey="stepCount"
                    color="bg-primary"
                  />
                )}
              </div>

              {/* Captions per flavor */}
              <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-surface-dark">
                <h2 className="text-base font-mono font-bold neon-text mb-4">
                  &gt; Captions Generated per Flavor
                </h2>
                {stats.flavorStats.every((f) => f.captionCount === 0) ? (
                  <p className="text-gray-500 font-mono text-sm text-center py-8">
                    No captions recorded yet
                  </p>
                ) : (
                  <CSSBarChart
                    data={stats.flavorStats}
                    maxValue={maxCaptions}
                    labelKey="slug"
                    valueKey="captionCount"
                    color="bg-purple-500"
                  />
                )}
              </div>
            </div>

            {/* Score distribution */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-surface-dark">
              <h2 className="text-base font-mono font-bold neon-text mb-4">
                &gt; Caption Score Distribution (1–5)
              </h2>
              {stats.totalRatings === 0 ? (
                <p className="text-gray-500 font-mono text-sm text-center py-8">
                  No votes recorded yet — share the rating app to collect data
                </p>
              ) : (
                <div className="space-y-2 max-w-lg">
                  {stats.scoreDistribution.map((bucket) => {
                    const pct =
                      maxScoreBucket > 0
                        ? (bucket.count / maxScoreBucket) * 100
                        : 0
                    return (
                      <div key={bucket.score} className="flex items-center space-x-3">
                        <span className="w-16 shrink-0 text-xs font-mono text-right text-gray-600 dark:text-gray-400">
                          {'★'.repeat(bucket.score)}
                        </span>
                        <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                          <div
                            className="h-full bg-yellow-400 rounded transition-all duration-500"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className="w-10 shrink-0 text-xs font-mono text-right">
                          {bucket.count}
                        </span>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            {/* Flavor Detail Table */}
            <div className="border border-gray-300 dark:border-gray-600 rounded-lg p-6 bg-white dark:bg-surface-dark">
              <h2 className="text-base font-mono font-bold neon-text mb-4">
                &gt; Flavor Summary Table
              </h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm font-mono">
                  <thead>
                    <tr className="border-b border-gray-200 dark:border-gray-700 text-left text-gray-500 dark:text-gray-400">
                      <th className="pb-2 pr-4">Flavor</th>
                      <th className="pb-2 pr-4 text-right">Steps</th>
                      <th className="pb-2 pr-4 text-right">Captions</th>
                      <th className="pb-2 text-right">Created</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {stats.flavorStats.map((f) => (
                      <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
                        <td className="py-2 pr-4 text-primary">{f.slug}</td>
                        <td className="py-2 pr-4 text-right">{f.stepCount}</td>
                        <td className="py-2 pr-4 text-right">{f.captionCount}</td>
                        <td className="py-2 text-right text-gray-500 dark:text-gray-400 text-xs">
                          {new Date(f.createdAt).toLocaleDateString()}
                        </td>
                      </tr>
                    ))}
                    {stats.flavorStats.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-400">
                          No flavors found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        ) : null}
      </main>
    </div>
  )
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY

  if (!supabaseUrl || !serviceKey) {
    return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
  }

  const supabase = createClient(supabaseUrl, serviceKey)

  // Query humor flavors
  const { data: flavors, error: flavorsError } = await supabase
    .from('humor_flavors')
    .select('id, slug, description, created_datetime_utc')
    .order('created_datetime_utc', { ascending: false })

  if (flavorsError) {
    return NextResponse.json({ error: 'Failed to query flavors' }, { status: 500 })
  }

  // Query steps
  const { data: steps } = await supabase
    .from('humor_flavor_steps')
    .select('id, humor_flavor_id')

  // Try to query captions (table may not exist – ignore error)
  const { data: captions } = await supabase
    .from('captions')
    .select('id, humor_flavor_id, created_at')

  // Try to query caption votes / ratings
  const { data: votes } = await supabase
    .from('caption_votes')
    .select('id, caption_id, score, created_at')

  // Build per-flavor statistics
  const flavorStats = (flavors || []).map((f) => ({
    id: f.id,
    slug: f.slug,
    description: f.description || '',
    stepCount: (steps || []).filter((s) => s.humor_flavor_id === f.id).length,
    captionCount: (captions || []).filter((c) => c.humor_flavor_id === f.id).length,
    createdAt: f.created_datetime_utc,
  }))

  const totalRatings = (votes || []).length
  const scores = (votes || []).map((v: any) => Number(v.score)).filter((s) => !isNaN(s))
  const avgScore =
    scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0

  // Score distribution (1–5)
  const scoreDistribution = [1, 2, 3, 4, 5].map((s) => ({
    score: s,
    count: scores.filter((sc) => sc === s).length,
  }))

  // Recent captions (last 10)
  const recentCaptions = captions ? [...captions]
    .sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 10) : []

  return NextResponse.json({
    totalFlavors: flavors?.length ?? 0,
    totalSteps: steps?.length ?? 0,
    totalCaptions: captions?.length ?? 0,
    totalRatings,
    avgScore: avgScore.toFixed(1),
    flavorStats,
    scoreDistribution,
    recentCaptions,
  })
}

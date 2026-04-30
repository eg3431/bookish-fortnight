import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) throw new Error('Supabase service config missing')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

// GET /api/captions?flavorId=X&page=1&pageSize=12
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sc = getServiceClient()
    const { data: { user } } = await sc.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const flavorId = Number(searchParams.get('flavorId'))
    const page = Math.max(1, Number(searchParams.get('page') ?? '1'))
    const pageSize = Math.min(50, Math.max(1, Number(searchParams.get('pageSize') ?? '12')))
    if (!flavorId) return NextResponse.json({ error: 'flavorId is required' }, { status: 400 })

    const from = (page - 1) * pageSize
    const to = from + pageSize - 1

    const { data, error, count } = await sc
      .from('captions')
      .select('id, content, created_datetime_utc, image_id, caption_request_id, llm_prompt_chain_id', { count: 'exact' })
      .eq('humor_flavor_id', flavorId)
      .order('created_datetime_utc', { ascending: false })
      .range(from, to)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    // Fetch image URLs for all unique image_ids
    const imageIds = [...new Set((data ?? []).map((c: any) => c.image_id).filter(Boolean))]
    let imageMap: Record<string, string> = {}
    if (imageIds.length > 0) {
      const { data: images } = await sc
        .from('images')
        .select('*')
        .in('id', imageIds)
      if (images && images.length > 0) {
        console.log('[captions] image row keys:', Object.keys(images[0]))
      }
      for (const img of images ?? []) {
        imageMap[img.id] = img.cdn_image_url || img.cdn_url || img.image_url || img.file_url || img.url || img.public_url || ''
      }
    }

    return NextResponse.json({ captions: data ?? [], total: count ?? 0, imageMap })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}

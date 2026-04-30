import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) throw new Error('Supabase service config missing')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

function slugToTitle(slug: string) {
  return slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}

// GET /api/lookups — returns all lookup tables in one request
export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sc = getServiceClient()
    const { data: { user } } = await sc.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const [inputTypes, outputTypes, models, stepTypes] = await Promise.all([
      sc.from('llm_input_types').select('*').order('id'),
      sc.from('llm_output_types').select('*').order('id'),
      sc.from('llm_models').select('*').order('id'),
      sc.from('humor_flavor_step_types').select('*').order('id'),
    ])

    return NextResponse.json({
      inputTypes: (inputTypes.data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name || r.display_name || r.description || (r.slug ? slugToTitle(r.slug) : String(r.id)),
      })),
      outputTypes: (outputTypes.data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name || r.display_name || r.description || (r.slug ? slugToTitle(r.slug) : String(r.id)),
      })),
      models: (models.data ?? []).map((r: any) => {
        const label = r.display_name || r.name || String(r.id)
        const modelId = r.provider_model_id || r.model_id || null
        return { id: r.id, name: modelId ? `${label} (${modelId})` : label }
      }),
      stepTypes: (stepTypes.data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name || r.display_name || (r.slug ? slugToTitle(r.slug) : r.description || String(r.id)),
      })),
    })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}

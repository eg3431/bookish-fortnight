import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) throw new Error('Supabase service config missing')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

async function getUser(request: NextRequest) {
  const token = request.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const sc = getServiceClient()
  const { data: { user } } = await sc.auth.getUser(token)
  return user ?? null
}

// GET /api/flavors — list all flavors with steps
export async function GET(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const sc = getServiceClient()
    const { data, error } = await sc
      .from('humor_flavors')
      .select('*, humor_flavor_steps(*)')
      .order('created_datetime_utc', { ascending: false })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data ?? [])
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}

// POST /api/flavors — create flavor
export async function POST(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { slug, description } = await request.json()
    if (!slug) return NextResponse.json({ error: 'slug is required' }, { status: 400 })

    const sc = getServiceClient()
    const { data: rows, error } = await sc
      .from('humor_flavors')
      .insert({ slug, description: description ?? '', created_by_user_id: user.id, modified_by_user_id: user.id })
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!rows?.length) return NextResponse.json({ error: 'Insert returned no rows' }, { status: 500 })
    return NextResponse.json(rows[0])
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}

// PATCH /api/flavors — update flavor
export async function PATCH(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id, slug, description } = await request.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const sc = getServiceClient()
    const { data: rows, error } = await sc
      .from('humor_flavors')
      .update({ slug, description, modified_by_user_id: user.id, modified_datetime_utc: new Date().toISOString() })
      .eq('id', id)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!rows?.length) return NextResponse.json({ error: 'Flavor not found' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/flavors — delete flavor
export async function DELETE(request: NextRequest) {
  try {
    const user = await getUser(request)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 })

    const sc = getServiceClient()

    // Delete steps first to avoid foreign key constraint errors
    const { error: stepsError } = await sc.from('humor_flavor_steps').delete().eq('humor_flavor_id', id)
    if (stepsError) return NextResponse.json({ error: stepsError.message }, { status: 500 })

    const { error } = await sc.from('humor_flavors').delete().eq('id', id)
    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}

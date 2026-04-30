import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_KEY
  if (!url || !serviceKey) throw new Error('Supabase service config missing')
  return createClient(url, serviceKey, { auth: { persistSession: false } })
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const serviceClient = getServiceClient()

    // Verify the user token
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token)
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { flavorId, ...data } = body

    if (!flavorId) {
      return NextResponse.json({ error: 'flavorId is required' }, { status: 400 })
    }

    const payload = {
      humor_flavor_id: flavorId,
      order_by: data.order_by ?? 1,
      llm_input_type_id: data.llm_input_type_id ?? 1,
      llm_output_type_id: data.llm_output_type_id ?? 1,
      llm_model_id: data.llm_model_id ?? 1,
      humor_flavor_step_type_id: data.humor_flavor_step_type_id ?? 1,
      llm_temperature: data.llm_temperature ?? 0.7,
      llm_system_prompt: data.llm_system_prompt ?? '',
      llm_user_prompt: data.llm_user_prompt || data.description || '',
      description: data.description || data.llm_user_prompt || '',
      created_by_user_id: user.id,
      modified_by_user_id: user.id,
    }

    const { data: rows, error } = await serviceClient
      .from('humor_flavor_steps')
      .insert(payload)
      .select()

    if (error) {
      console.error('[POST /api/steps] insert error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (!rows || rows.length === 0) {
      return NextResponse.json({ error: 'Insert returned no rows' }, { status: 500 })
    }

    return NextResponse.json(rows[0])
  } catch (err: any) {
    console.error('[POST /api/steps] unexpected error:', err)
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}

// PATCH /api/steps — update a single step
export async function PATCH(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = getServiceClient()
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { stepId, flavorId, ...data } = body
    if (!stepId || !flavorId) return NextResponse.json({ error: 'stepId and flavorId are required' }, { status: 400 })

    const updatePayload: Record<string, any> = {
      description: data.description || data.llm_user_prompt || '',
      modified_by_user_id: user.id,
      modified_datetime_utc: new Date().toISOString(),
    }
    if (data.llm_input_type_id != null)         updatePayload.llm_input_type_id = data.llm_input_type_id
    if (data.llm_output_type_id != null)        updatePayload.llm_output_type_id = data.llm_output_type_id
    if (data.llm_model_id != null)              updatePayload.llm_model_id = data.llm_model_id
    if (data.humor_flavor_step_type_id != null) updatePayload.humor_flavor_step_type_id = data.humor_flavor_step_type_id
    if (data.llm_temperature != null)           updatePayload.llm_temperature = data.llm_temperature
    if (data.llm_system_prompt != null)         updatePayload.llm_system_prompt = data.llm_system_prompt
    if (data.llm_user_prompt != null)           updatePayload.llm_user_prompt = data.llm_user_prompt

    const { data: rows, error } = await serviceClient
      .from('humor_flavor_steps')
      .update(updatePayload)
      .eq('id', stepId)
      .eq('humor_flavor_id', flavorId)
      .select()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    if (!rows || rows.length === 0) return NextResponse.json({ error: 'Step not found' }, { status: 404 })
    return NextResponse.json(rows[0])
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}

// PUT /api/steps — reorder steps (upsert order_by for all steps in a flavor)
export async function PUT(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = getServiceClient()
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { steps } = body as { steps: Array<{ id: number; order_by: number }> }
    if (!steps?.length) return NextResponse.json({ error: 'steps array is required' }, { status: 400 })

    const updates = steps.map((s) => ({
      id: s.id,
      order_by: s.order_by,
      modified_by_user_id: user.id,
      modified_datetime_utc: new Date().toISOString(),
    }))

    const { error } = await serviceClient
      .from('humor_flavor_steps')
      .upsert(updates, { onConflict: 'id' })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}

// DELETE /api/steps — delete a single step
export async function DELETE(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = getServiceClient()
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { stepId, flavorId } = await request.json()
    if (!stepId || !flavorId) return NextResponse.json({ error: 'stepId and flavorId are required' }, { status: 400 })

    const { error } = await serviceClient
      .from('humor_flavor_steps')
      .delete()
      .eq('id', stepId)
      .eq('humor_flavor_id', flavorId)

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message ?? 'Internal error' }, { status: 500 })
  }
}

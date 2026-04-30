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
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const serviceClient = getServiceClient()
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(token)
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { flavorId, imageUrl } = body

    if (!flavorId || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields: flavorId and imageUrl' }, { status: 400 })
    }

    // Fetch flavor + steps server-side (no client session needed)
    const { data: flavor, error: flavorError } = await serviceClient
      .from('humor_flavors')
      .select('*')
      .eq('id', flavorId)
      .single()
    if (flavorError) return NextResponse.json({ error: flavorError.message }, { status: 500 })

    const { data: steps, error: stepsError } = await serviceClient
      .from('humor_flavor_steps')
      .select('*')
      .eq('humor_flavor_id', flavorId)
      .order('order_by', { ascending: true })
    if (stepsError) return NextResponse.json({ error: stepsError.message }, { status: 500 })

    const promptChain = (steps || []).map((step: any) => ({
      order: step.order_by,
      description: step.description,
      llm_system_prompt: step.llm_system_prompt,
      llm_user_prompt: step.llm_user_prompt,
    }))

    const apiKey = process.env.API_KEY
    const apiBaseUrl = process.env.API_BASE_URL
    if (!apiKey || !apiBaseUrl) {
      return NextResponse.json({ error: 'API configuration is incomplete' }, { status: 500 })
    }

    const response = await fetch(`${apiBaseUrl}/captions/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        flavorSlug: flavor.slug,
        flavorDescription: flavor.description,
        promptChain,
        imageUrl,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Caption API error: ${response.status} ${errorText}`)
      return NextResponse.json({ error: `Caption generation failed: ${response.statusText}` }, { status: response.status })
    }

    const result = await response.json()
    return NextResponse.json(result)
  } catch (error) {
    console.error('Caption generation error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate captions' },
      { status: 500 }
    )
  }
}

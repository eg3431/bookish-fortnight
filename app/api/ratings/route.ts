import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { captionText, humorFlavorId, score, imageUrl, userToken } = body

    if (!captionText || !score || score < 1 || score > 5) {
      return NextResponse.json(
        { error: 'captionText and a score between 1-5 are required' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_KEY

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: 'Missing Supabase configuration' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, serviceKey)

    // Upsert a caption record first
    const { data: caption, error: captionError } = await supabase
      .from('captions')
      .upsert(
        {
          humor_flavor_id: humorFlavorId ?? null,
          caption_text: captionText,
          image_url: imageUrl ?? null,
          created_at: new Date().toISOString(),
        },
        { onConflict: 'caption_text', ignoreDuplicates: false }
      )
      .select('id')
      .single()

    if (captionError) {
      // If caption table doesn't exist, record vote without FK
      const { error: voteError } = await supabase.from('caption_votes').insert({
        caption_text: captionText,
        humor_flavor_id: humorFlavorId ?? null,
        score: Number(score),
        user_token: userToken ?? null,
        created_at: new Date().toISOString(),
      })

      if (voteError) {
        console.error('Vote insert error:', voteError)
        return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 })
      }
    } else {
      const { error: voteError } = await supabase.from('caption_votes').insert({
        caption_id: caption?.id ?? null,
        caption_text: captionText,
        humor_flavor_id: humorFlavorId ?? null,
        score: Number(score),
        user_token: userToken ?? null,
        created_at: new Date().toISOString(),
      })

      if (voteError) {
        console.error('Vote insert error:', voteError)
        return NextResponse.json({ error: 'Failed to save vote' }, { status: 500 })
      }
    }

    return NextResponse.json({ success: true })
  } catch (err: any) {
    console.error('Ratings route error:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

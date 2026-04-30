import { NextRequest, NextResponse } from 'next/server'

const EXTERNAL_API = 'https://api.almostcrackd.ai'

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { flavorId, imageUrl } = body

    if (!flavorId || !imageUrl) {
      return NextResponse.json({ error: 'Missing required fields: flavorId and imageUrl' }, { status: 400 })
    }

    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    }

    // Step 3: Register the uploaded image URL
    const registerRes = await fetch(`${EXTERNAL_API}/pipeline/upload-image-from-url`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageUrl, isCommonUse: false }),
    })
    const registerBody = await registerRes.text()
    console.error('[captions] register status:', registerRes.status, registerBody)
    if (!registerRes.ok) {
      return NextResponse.json({ error: `Image registration failed (${registerRes.status}): ${registerBody}` }, { status: registerRes.status })
    }
    let registerJson: any
    try { registerJson = JSON.parse(registerBody) } catch { registerJson = {} }
    const imageId = registerJson.imageId ?? registerJson.image_id ?? registerJson.id
    console.error('[captions] imageId:', imageId, '| full register json:', registerJson)
    if (!imageId) {
      return NextResponse.json({ error: `Image registration returned no imageId. Response: ${registerBody}` }, { status: 500 })
    }

    // Step 4: Generate captions for this flavor
    const captionsRes = await fetch(`${EXTERNAL_API}/pipeline/generate-captions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ imageId, humorFlavorId: flavorId }),
    })
    const captionsBody = await captionsRes.text()
    console.error('[captions] generate status:', captionsRes.status, captionsBody)
    if (!captionsRes.ok) {
      return NextResponse.json({ error: `Caption generation failed (${captionsRes.status}): ${captionsBody}` }, { status: captionsRes.status })
    }

    let result: any
    try { result = JSON.parse(captionsBody) } catch { result = { raw: captionsBody } }
    return NextResponse.json(result)
  } catch (error) {
    console.error('[captions] unexpected error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate captions' },
      { status: 500 }
    )
  }
}


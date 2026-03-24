import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { flavorSlug, flavorDescription, promptChain, imageUrl } = body

    // Validate required fields
    if (!flavorSlug || !imageUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: flavorSlug and imageUrl' },
        { status: 400 }
      )
    }

    // Get API credentials from environment (server-side only)
    const apiKey = process.env.API_KEY
    const apiBaseUrl = process.env.API_BASE_URL

    if (!apiKey || !apiBaseUrl) {
      console.error('API configuration missing')
      return NextResponse.json(
        { error: 'API configuration is incomplete' },
        { status: 500 }
      )
    }

    // Call the external API with the secret key
    const response = await fetch(`${apiBaseUrl}/captions/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        flavorSlug,
        flavorDescription,
        promptChain,
        imageUrl,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error(`Caption API error: ${response.status} ${errorText}`)
      return NextResponse.json(
        { error: `Caption generation failed: ${response.statusText}` },
        { status: response.status }
      )
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

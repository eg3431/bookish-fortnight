import { NextRequest, NextResponse } from 'next/server'

const EXTERNAL_API = 'https://api.almostcrackd.ai'

// POST /api/upload — get a presigned S3 URL to upload an image directly from the browser
export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '')
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { contentType } = await request.json()
    if (!contentType) return NextResponse.json({ error: 'contentType is required' }, { status: 400 })

    const res = await fetch(`${EXTERNAL_API}/pipeline/generate-presigned-url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ contentType }),
    })

    if (!res.ok) {
      const text = await res.text()
      console.error('[presign] error:', res.status, text)
      return NextResponse.json({ error: `Presign failed: ${res.statusText}` }, { status: res.status })
    }

    const { presignedUrl, cdnUrl } = await res.json()
    return NextResponse.json({ presignedUrl, cdnUrl })
  } catch (err: any) {
    console.error('[presign] unexpected error:', err)
    return NextResponse.json({ error: err?.message ?? 'Failed to get presigned URL' }, { status: 500 })
  }
}


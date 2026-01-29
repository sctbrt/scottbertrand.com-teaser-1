// POST /api/admin/deliverables - Upload a new deliverable (admin only)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { uploadDeliverable, markDeliverableForReview } from '@/lib/deliverable-storage'
import { checkRateLimit } from '@/lib/rate-limit'
import type { DeliverableState } from '@prisma/client'

export async function POST(request: NextRequest) {
  try {
    // Auth check - admin only
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    if (session.user.role !== 'INTERNAL_ADMIN') {
      return NextResponse.json(
        { message: 'Admin access required' },
        { status: 403 }
      )
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await checkRateLimit(
      `admin-upload:${session.user.id}`,
      "ADMIN"
    )
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Too many upload requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const projectId = formData.get('projectId') as string | null
    const title = formData.get('title') as string | null
    const state = (formData.get('state') as DeliverableState) || 'DRAFT'
    const sendForReview = formData.get('sendForReview') === 'true'

    // Validate required fields
    if (!file || !projectId || !title) {
      return NextResponse.json(
        { message: 'Missing required fields: file, projectId, title' },
        { status: 400 }
      )
    }

    // Validate file size (max 50MB)
    const MAX_FILE_SIZE = 50 * 1024 * 1024
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { message: 'File too large. Maximum size is 50MB.' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer())

    // Upload deliverable with watermarking
    const deliverable = await uploadDeliverable({
      file: buffer,
      filename: file.name,
      mimeType: file.type,
      projectId,
      title,
      state,
    })

    // If requested, mark for review (updates project stage)
    if (sendForReview) {
      await markDeliverableForReview(deliverable.id, projectId)
      deliverable.state = 'REVIEW'
    }

    return NextResponse.json({
      success: true,
      deliverable,
    })
  } catch (error) {
    console.error('Deliverable upload error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

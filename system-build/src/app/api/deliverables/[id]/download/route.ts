// GET /api/deliverables/[id]/download - Gated download with watermark handling
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'
import { isProjectPaid } from '@/lib/payment-status'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: deliverableId } = await params

    // Auth check
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    const rateLimitResult = await checkRateLimit(
      `download:${session.user.id}`,
      "API"
    )
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Too many download requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Get deliverable with project and client info
    const deliverable = await prisma.deliverables.findUnique({
      where: { id: deliverableId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            portalStage: true,
            paymentStatus: true,
            clients: {
              select: {
                userId: true,
              },
            },
            invoices: {
              select: {
                status: true,
                paidAt: true,
              },
            },
          },
        },
      },
    })

    if (!deliverable) {
      return NextResponse.json(
        { message: 'Deliverable not found' },
        { status: 404 }
      )
    }

    // Access control
    const isAdmin = session.user.role === 'INTERNAL_ADMIN'
    const isOwner = deliverable.project.clients.userId === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    // Payment gate - hard rule (checks explicit status OR paid invoices)
    if (!isProjectPaid(deliverable.project)) {
      return NextResponse.json(
        { message: 'Downloads unlock after payment.' },
        { status: 403 }
      )
    }

    // Determine which file to serve
    // - If released/complete AND state is FINAL: serve clean download
    // - Otherwise: serve watermarked preview
    const isReleased =
      deliverable.project.portalStage === 'RELEASED' ||
      deliverable.project.portalStage === 'COMPLETE'
    const isFinal = deliverable.state === 'FINAL'

    let fileUrl: string | null
    let isWatermarked: boolean

    if (isReleased && isFinal && deliverable.fileDownloadUrl) {
      // Clean download
      fileUrl = deliverable.fileDownloadUrl
      isWatermarked = false
    } else if (deliverable.filePreviewUrl) {
      // Watermarked download
      fileUrl = deliverable.filePreviewUrl
      isWatermarked = true
    } else {
      return NextResponse.json(
        { message: 'No download file available' },
        { status: 404 }
      )
    }

    // Fetch the file
    const fileResponse = await fetch(fileUrl)
    if (!fileResponse.ok) {
      console.error('Failed to fetch file:', fileResponse.status, fileUrl)
      return NextResponse.json(
        { message: 'Failed to retrieve file' },
        { status: 500 }
      )
    }

    const fileBuffer = await fileResponse.arrayBuffer()

    // Build filename
    const ext = getExtension(deliverable.mimeType)
    const cleanTitle = deliverable.title.replace(/[^a-zA-Z0-9-_]/g, '-')
    const watermarkSuffix = isWatermarked ? '-DRAFT' : ''
    const filename = `${cleanTitle}-v${deliverable.version}${watermarkSuffix}${ext}`

    // Return file with appropriate headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        'Content-Type': deliverable.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': fileBuffer.byteLength.toString(),
        'Cache-Control': 'private, no-cache, no-store, must-revalidate',
        'X-Watermarked': isWatermarked ? 'true' : 'false',
      },
    })
  } catch (error) {
    console.error('Download error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

function getExtension(mimeType: string | null): string {
  if (!mimeType) return ''
  const map: Record<string, string> = {
    'application/pdf': '.pdf',
    'image/png': '.png',
    'image/jpeg': '.jpg',
    'image/gif': '.gif',
    'image/webp': '.webp',
    'image/svg+xml': '.svg',
    'application/zip': '.zip',
  }
  return map[mimeType] || ''
}

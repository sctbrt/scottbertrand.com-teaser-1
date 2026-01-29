// POST /api/projects/[id]/feedback - Submit structured feedback on a deliverable
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

interface FeedbackBody {
  deliverableId: string
  type: 'APPROVE' | 'APPROVE_MINOR' | 'NEEDS_REVISION'
  notes: string | null
  submittedByName: string
  submittedByEmail: string
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: projectId } = await params

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
      `feedback:${ip}`,
      "API"
    )
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse body
    const body: FeedbackBody = await request.json()
    const { deliverableId, type, notes, submittedByName, submittedByEmail } = body

    // Validate required fields
    if (!deliverableId || !type || !submittedByName) {
      return NextResponse.json(
        { message: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate feedback type
    if (!['APPROVE', 'APPROVE_MINOR', 'NEEDS_REVISION'].includes(type)) {
      return NextResponse.json(
        { message: 'Invalid feedback type' },
        { status: 400 }
      )
    }

    // Notes required for revision requests
    if (type === 'NEEDS_REVISION' && (!notes || !notes.trim())) {
      return NextResponse.json(
        { message: 'Notes are required for revision requests' },
        { status: 400 }
      )
    }

    // Get project and verify access
    const project = await prisma.projects.findUnique({
      where: { id: projectId },
      select: {
        id: true,
        clientId: true,
        portalStage: true,
        paymentStatus: true,
        clients: {
          select: {
            userId: true,
          },
        },
      },
    })

    if (!project) {
      return NextResponse.json(
        { message: 'Project not found' },
        { status: 404 }
      )
    }

    // Access control
    const isAdmin = session.user.role === 'INTERNAL_ADMIN'
    const isOwner = project.clients.userId === session.user.id

    if (!isAdmin && !isOwner) {
      return NextResponse.json(
        { message: 'Access denied' },
        { status: 403 }
      )
    }

    // Verify deliverable exists and belongs to project
    const deliverable = await prisma.deliverables.findFirst({
      where: {
        id: deliverableId,
        projectId: projectId,
      },
    })

    if (!deliverable) {
      return NextResponse.json(
        { message: 'Deliverable not found' },
        { status: 404 }
      )
    }

    // For approval actions, verify payment status
    if ((type === 'APPROVE' || type === 'APPROVE_MINOR') && project.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { message: 'Approval requires payment to be completed' },
        { status: 400 }
      )
    }

    // Create feedback record
    const feedback = await prisma.feedbacks.create({
      data: {
        projectId,
        deliverableId,
        type,
        notes: notes?.trim() || null,
        submittedByName,
        submittedByEmail: submittedByEmail || null,
      },
    })

    // If revision requested, update project stage back to IN_DELIVERY
    if (type === 'NEEDS_REVISION') {
      await prisma.projects.update({
        where: { id: projectId },
        data: {
          portalStage: 'IN_DELIVERY',
          lastUpdateAt: new Date(),
        },
      })
    }

    return NextResponse.json({
      success: true,
      feedbackId: feedback.id,
    })
  } catch (error) {
    console.error('Feedback submission error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

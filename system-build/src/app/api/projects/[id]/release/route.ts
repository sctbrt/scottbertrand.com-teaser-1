// POST /api/projects/[id]/release - Approve and release a project (unlock clean downloads)
import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkRateLimit } from '@/lib/rate-limit'

interface ReleaseBody {
  deliverableId: string
  signedByName: string
  signedByEmail: string
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
      `release:${ip}`,
      "AUTH" // Stricter rate limit for release actions
    )
    if (!rateLimitResult.allowed) {
      return NextResponse.json(
        { message: 'Too many requests. Please try again later.' },
        { status: 429 }
      )
    }

    // Parse body
    const body: ReleaseBody = await request.json()
    const { deliverableId, signedByName, signedByEmail } = body

    // Validate required fields
    if (!deliverableId || !signedByName) {
      return NextResponse.json(
        { message: 'Missing required fields' },
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

    // Verify payment status - hard gate
    if (project.paymentStatus !== 'PAID') {
      return NextResponse.json(
        { message: 'Release requires payment to be completed' },
        { status: 400 }
      )
    }

    // Verify project is in a releasable state
    if (project.portalStage === 'RELEASED' || project.portalStage === 'COMPLETE') {
      return NextResponse.json(
        { message: 'Project is already released' },
        { status: 400 }
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

    // Perform atomic release transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Create sign-off record
      const signoff = await tx.signoffs.create({
        data: {
          projectId,
          deliverableId,
          signedByName,
          signedByEmail: signedByEmail || null,
          action: 'APPROVED_AND_RELEASED',
        },
      })

      // 2. Update deliverable state to FINAL
      await tx.deliverables.update({
        where: { id: deliverableId },
        data: { state: 'FINAL' },
      })

      // 3. Update project stage to RELEASED
      await tx.projects.update({
        where: { id: projectId },
        data: {
          portalStage: 'RELEASED',
          lastUpdateAt: new Date(),
        },
      })

      return signoff
    })

    return NextResponse.json({
      success: true,
      signoffId: result.id,
      message: 'Project released successfully. Clean downloads are now available.',
    })
  } catch (error) {
    console.error('Release error:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}

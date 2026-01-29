'use server'

/**
 * Payment Server Actions
 *
 * Handles payment link updates and manual payment overrides.
 * See docs/payments-v1.md for rules.
 */

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { markProjectPaidManually, updateProjectPaymentLink } from '@/lib/payment-status'
import { revalidatePath } from 'next/cache'

/**
 * Update the Stripe Payment Link URL for a project.
 * Admin only.
 */
export async function updatePaymentLink(
  projectId: string,
  paymentLinkUrl: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()

  // Admin only
  if (!session?.user || session.user.role !== 'INTERNAL_ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  // Validate URL format
  if (paymentLinkUrl && !paymentLinkUrl.startsWith('https://')) {
    return { success: false, error: 'Payment link must be a valid HTTPS URL' }
  }

  // Extract Payment Link ID from URL (Stripe format: https://buy.stripe.com/xxx)
  let paymentLinkId: string | null = null
  if (paymentLinkUrl) {
    const match = paymentLinkUrl.match(/buy\.stripe\.com\/([a-zA-Z0-9_]+)/)
    if (match) {
      paymentLinkId = match[1]
    }
  }

  try {
    await updateProjectPaymentLink(projectId, paymentLinkId || '', paymentLinkUrl)
    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to update payment link:', error)
    return { success: false, error: 'Failed to update payment link' }
  }
}

/**
 * Mark a project as paid manually (admin override).
 * Use only for offline payments, wire transfers, etc.
 */
export async function markProjectPaid(
  projectId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()

  // Admin only
  if (!session?.user || session.user.role !== 'INTERNAL_ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  // Require reason
  if (!reason || reason.trim().length < 5) {
    return { success: false, error: 'Please provide a reason (minimum 5 characters)' }
  }

  try {
    const result = await markProjectPaidManually(projectId, session.user.id!, reason)
    if (result.success) {
      revalidatePath(`/dashboard/projects/${projectId}`)
    }
    return result
  } catch (error) {
    console.error('Failed to mark project as paid:', error)
    return { success: false, error: 'Failed to mark project as paid' }
  }
}

/**
 * Get payment events for a project (audit log).
 */
export async function getProjectPaymentEvents(projectId: string) {
  const session = await auth()

  // Admin only
  if (!session?.user || session.user.role !== 'INTERNAL_ADMIN') {
    return []
  }

  return prisma.payment_events.findMany({
    where: { projectId },
    orderBy: { processedAt: 'desc' },
    take: 20,
  })
}

/**
 * Get all unmatched payment events (for admin reconciliation).
 */
export async function getUnmatchedPayments() {
  const session = await auth()

  // Admin only
  if (!session?.user || session.user.role !== 'INTERNAL_ADMIN') {
    return []
  }

  return prisma.payment_events.findMany({
    where: { status: 'UNMATCHED' },
    orderBy: { processedAt: 'desc' },
    take: 50,
  })
}

/**
 * Reconcile an unmatched payment to a project.
 */
export async function reconcilePayment(
  paymentEventId: string,
  projectId: string
): Promise<{ success: boolean; error?: string }> {
  const session = await auth()

  // Admin only
  if (!session?.user || session.user.role !== 'INTERNAL_ADMIN') {
    return { success: false, error: 'Unauthorized' }
  }

  try {
    const [event, project] = await Promise.all([
      prisma.payment_events.findUnique({ where: { id: paymentEventId } }),
      prisma.projects.findUnique({ where: { id: projectId } }),
    ])

    if (!event) {
      return { success: false, error: 'Payment event not found' }
    }
    if (!project) {
      return { success: false, error: 'Project not found' }
    }
    if (event.status !== 'UNMATCHED') {
      return { success: false, error: 'Payment event is not unmatched' }
    }

    // Update event and project in transaction
    await prisma.$transaction([
      prisma.payment_events.update({
        where: { id: paymentEventId },
        data: {
          projectId,
          status: 'SUCCESS',
          metadata: {
            ...(event.metadata as object),
            reconciledBy: session.user.id,
            reconciledAt: new Date().toISOString(),
          },
        },
      }),
      prisma.projects.update({
        where: { id: projectId },
        data: {
          paymentStatus: 'PAID',
          paymentProvider: 'STRIPE',
          paidAt: event.processedAt,
          lastPaymentEventId: event.eventId,
        },
      }),
    ])

    revalidatePath(`/dashboard/projects/${projectId}`)
    return { success: true }
  } catch (error) {
    console.error('Failed to reconcile payment:', error)
    return { success: false, error: 'Failed to reconcile payment' }
  }
}

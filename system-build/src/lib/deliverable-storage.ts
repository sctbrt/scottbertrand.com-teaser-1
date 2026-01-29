// Deliverable Storage with Watermarking
// Handles upload of deliverables with automatic watermark generation

import { put, del } from '@vercel/blob'
import { v4 as uuidv4 } from 'uuid'
import { prisma } from './prisma'
import { applyWatermark, supportsWatermark } from './watermark'
import type { DeliverableState } from '@prisma/client'

interface UploadDeliverableOptions {
  file: Buffer
  filename: string
  mimeType: string
  projectId: string
  title: string
  state?: DeliverableState
}

interface DeliverableUploadResult {
  id: string
  title: string
  version: number
  state: DeliverableState
  filePreviewUrl: string | null
  fileDownloadUrl: string | null
  mimeType: string
  fileSize: number
}

/**
 * Upload a deliverable file with automatic watermarking
 * Creates both a watermarked preview version and stores the clean original
 */
export async function uploadDeliverable({
  file,
  filename,
  mimeType,
  projectId,
  title,
  state = 'DRAFT',
}: UploadDeliverableOptions): Promise<DeliverableUploadResult> {
  const uniqueId = uuidv4()

  // Get next version number for this project
  const latestDeliverable = await prisma.deliverables.findFirst({
    where: { projectId },
    orderBy: { version: 'desc' },
    select: { version: true },
  })
  const version = (latestDeliverable?.version || 0) + 1

  // Upload the clean original file
  const cleanPathname = `deliverables/${projectId}/${uniqueId}-clean-${filename}`
  const cleanBlob = await put(cleanPathname, file, {
    access: 'public', // Access controlled via API
    addRandomSuffix: false,
  })

  // Generate watermarked version if supported
  let watermarkedUrl: string | null = null

  if (supportsWatermark(mimeType)) {
    try {
      const watermarkedBuffer = await applyWatermark(file, mimeType)
      const watermarkPathname = `deliverables/${projectId}/${uniqueId}-preview-${filename}`

      const watermarkBlob = await put(watermarkPathname, watermarkedBuffer, {
        access: 'public', // Access controlled via API
        addRandomSuffix: false,
      })

      watermarkedUrl = watermarkBlob.url
    } catch (error) {
      console.error('Failed to create watermarked version:', error)
      // Fallback: use clean version for preview too (not ideal, but functional)
      watermarkedUrl = cleanBlob.url
    }
  } else {
    // For unsupported types, use the same URL
    // Note: This means unsupported types won't have watermark protection
    watermarkedUrl = cleanBlob.url
  }

  // Create database record
  const deliverable = await prisma.deliverables.create({
    data: {
      projectId,
      title,
      version,
      state,
      filePreviewUrl: watermarkedUrl,
      fileDownloadUrl: cleanBlob.url,
      mimeType,
      fileSize: file.byteLength,
    },
  })

  // Update project's lastUpdateAt
  await prisma.projects.update({
    where: { id: projectId },
    data: { lastUpdateAt: new Date() },
  })

  return {
    id: deliverable.id,
    title: deliverable.title,
    version: deliverable.version,
    state: deliverable.state,
    filePreviewUrl: deliverable.filePreviewUrl,
    fileDownloadUrl: deliverable.fileDownloadUrl,
    mimeType: deliverable.mimeType || mimeType,
    fileSize: deliverable.fileSize || file.byteLength,
  }
}

/**
 * Delete a deliverable and its files
 */
export async function deleteDeliverable(deliverableId: string): Promise<void> {
  const deliverable = await prisma.deliverables.findUnique({
    where: { id: deliverableId },
    select: {
      filePreviewUrl: true,
      fileDownloadUrl: true,
    },
  })

  if (!deliverable) {
    throw new Error('Deliverable not found')
  }

  // Delete files from Vercel Blob
  const urlsToDelete = [
    deliverable.filePreviewUrl,
    deliverable.fileDownloadUrl,
  ].filter(Boolean) as string[]

  for (const url of urlsToDelete) {
    try {
      await del(url)
    } catch (error) {
      console.error('Failed to delete file:', url, error)
    }
  }

  // Delete database record
  await prisma.deliverables.delete({
    where: { id: deliverableId },
  })
}

/**
 * Update deliverable state (e.g., DRAFT -> REVIEW -> FINAL)
 */
export async function updateDeliverableState(
  deliverableId: string,
  state: DeliverableState
): Promise<void> {
  await prisma.deliverables.update({
    where: { id: deliverableId },
    data: { state },
  })
}

/**
 * Set a deliverable to REVIEW state (ready for client feedback)
 */
export async function markDeliverableForReview(
  deliverableId: string,
  projectId: string
): Promise<void> {
  await prisma.$transaction([
    prisma.deliverables.update({
      where: { id: deliverableId },
      data: { state: 'REVIEW' },
    }),
    prisma.projects.update({
      where: { id: projectId },
      data: {
        portalStage: 'IN_REVIEW',
        lastUpdateAt: new Date(),
      },
    }),
  ])
}

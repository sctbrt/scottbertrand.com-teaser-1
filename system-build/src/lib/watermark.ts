// Watermarking system for deliverables
// Applies subtle "DRAFT — PREVIEW ONLY" watermark to images and PDFs
import sharp from 'sharp'
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib'

const WATERMARK_TEXT = 'DRAFT — PREVIEW ONLY'
const WATERMARK_OPACITY = 0.04 // 4% opacity - subtle, premium

/**
 * Apply watermark to an image file
 * Returns a Buffer with the watermarked image
 */
export async function watermarkImage(
  inputBuffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  try {
    // Get image dimensions
    const metadata = await sharp(inputBuffer).metadata()
    const width = metadata.width || 800
    const height = metadata.height || 600

    // Create SVG watermark overlay
    // Diagonal text repeated across the image
    const fontSize = Math.max(24, Math.min(width, height) / 20)
    const svgText = createWatermarkSvg(width, height, fontSize)

    // Composite the watermark onto the image
    const watermarked = await sharp(inputBuffer)
      .composite([
        {
          input: Buffer.from(svgText),
          blend: 'over',
        },
      ])
      .toFormat(mimeType.includes('png') ? 'png' : 'jpeg', {
        quality: 90,
      })
      .toBuffer()

    return watermarked
  } catch (error) {
    console.error('Image watermarking failed:', error)
    // Return original if watermarking fails
    return inputBuffer
  }
}

/**
 * Apply watermark to a PDF file
 * Returns a Buffer with the watermarked PDF
 */
export async function watermarkPdf(inputBuffer: Buffer): Promise<Buffer> {
  try {
    const pdfDoc = await PDFDocument.load(inputBuffer)
    const pages = pdfDoc.getPages()
    const font = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

    for (const page of pages) {
      const { width, height } = page.getSize()
      const fontSize = Math.max(14, Math.min(width, height) / 30)

      // Draw diagonal watermark text across the page
      // Multiple positions for coverage
      const positions = [
        { x: width * 0.1, y: height * 0.9 },
        { x: width * 0.5, y: height * 0.5 },
        { x: width * 0.1, y: height * 0.1 },
        { x: width * 0.7, y: height * 0.3 },
        { x: width * 0.3, y: height * 0.7 },
      ]

      for (const pos of positions) {
        page.drawText(WATERMARK_TEXT, {
          x: pos.x,
          y: pos.y,
          size: fontSize,
          font,
          color: rgb(0.5, 0.5, 0.5), // Gray
          opacity: WATERMARK_OPACITY,
          rotate: degrees(-45),
        })
      }
    }

    const watermarkedBytes = await pdfDoc.save()
    return Buffer.from(watermarkedBytes)
  } catch (error) {
    console.error('PDF watermarking failed:', error)
    // Return original if watermarking fails
    return inputBuffer
  }
}

/**
 * Apply watermark based on file type
 */
export async function applyWatermark(
  inputBuffer: Buffer,
  mimeType: string
): Promise<Buffer> {
  if (mimeType === 'application/pdf') {
    return watermarkPdf(inputBuffer)
  }

  if (mimeType.startsWith('image/')) {
    return watermarkImage(inputBuffer, mimeType)
  }

  // For other file types, return as-is (consider adding more handlers)
  console.warn(`Watermarking not supported for mime type: ${mimeType}`)
  return inputBuffer
}

/**
 * Create SVG watermark overlay
 */
function createWatermarkSvg(
  width: number,
  height: number,
  fontSize: number
): string {
  // Calculate positions for diagonal pattern
  const spacing = fontSize * 8
  const positions: Array<{ x: number; y: number }> = []

  for (let y = -height; y < height * 2; y += spacing) {
    for (let x = -width; x < width * 2; x += spacing) {
      positions.push({ x, y })
    }
  }

  const textElements = positions
    .map(
      (pos) =>
        `<text x="${pos.x}" y="${pos.y}" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="bold" fill="rgba(128, 128, 128, ${WATERMARK_OPACITY})" transform="rotate(-45, ${pos.x}, ${pos.y})">${WATERMARK_TEXT}</text>`
    )
    .join('\n')

  return `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
    ${textElements}
  </svg>`
}

/**
 * Check if a file type supports watermarking
 */
export function supportsWatermark(mimeType: string): boolean {
  return (
    mimeType === 'application/pdf' ||
    mimeType.startsWith('image/')
  )
}

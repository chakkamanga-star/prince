// Client-side helper to turn an uploaded file into plain text.
// TXT  -> read directly in the browser
// DOCX -> parsed in the browser with mammoth
// PDF / images -> sent to /api/gemini (action: extractText) for text extraction / OCR

import { extractTextFromBinary } from '@/lib/gemini'

export const ACCEPT_ATTR = '.pdf,.docx,.txt,.png,.jpg,.jpeg,.webp'
export const MAX_FILE_BYTES = 4 * 1024 * 1024 // Vercel request body limit is ~4.5MB (base64 adds ~33%)
const MAX_BINARY_BYTES = 3 * 1024 * 1024

export type FileKind = 'PDF' | 'DOCX' | 'TXT' | 'IMAGE'

export function detectKind(file: File): FileKind | null {
  const name = file.name.toLowerCase()
  if (name.endsWith('.pdf') || file.type === 'application/pdf') return 'PDF'
  if (name.endsWith('.docx')) return 'DOCX'
  if (name.endsWith('.txt') || file.type === 'text/plain') return 'TXT'
  if (/\.(png|jpe?g|webp)$/.test(name) || file.type.startsWith('image/')) return 'IMAGE'
  return null
}

function toBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  let binary = ''
  const chunk = 0x8000
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk))
  }
  return btoa(binary)
}

export async function extractFileText(file: File): Promise<{ kind: FileKind; text: string }> {
  const kind = detectKind(file)
  if (!kind) throw new Error(`Unsupported file type: ${file.name}. Use PDF, DOCX, TXT or an image.`)

  if (kind === 'TXT') return { kind, text: await file.text() }

  if (kind === 'DOCX') {
    const mammoth = await import('mammoth')
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return { kind, text: value }
  }

  if (file.size > MAX_BINARY_BYTES) {
    throw new Error(`${file.name} is too large (max 3 MB for PDF and images).`)
  }
  const mimeType =
    kind === 'PDF' ? 'application/pdf' : file.type || (file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg')
  const text = await extractTextFromBinary(mimeType, toBase64(await file.arrayBuffer()))
  return { kind, text }
}

// Client-side helper to turn an uploaded file into plain text.
// TXT  -> read directly in the browser
// DOCX -> parsed in the browser with mammoth
// PDF / images -> sent to /api/gemini (action: extractText) for text extraction / OCR
//
// Large PDFs (3–10 MB) are automatically chunked into 3 MB segments,
// each extracted separately, then concatenated.

import { extractTextFromBinary } from '@/lib/gemini'

export const ACCEPT_ATTR = '.pdf,.docx,.txt,.png,.jpg,.jpeg,.webp'
export const MAX_FILE_BYTES = 10 * 1024 * 1024   // 10 MB hard cap shown to user
const CHUNK_BYTES = 3 * 1024 * 1024              // send max 3 MB base64 per API call

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

/** Split a base64 string into ~CHUNK_BYTES-worth-of-raw-bytes segments */
function splitBase64Chunks(b64: string): string[] {
  // Each raw byte becomes 4/3 base64 chars, so chunk size in chars:
  const chunkChars = Math.ceil((CHUNK_BYTES / 3) * 4)
  const chunks: string[] = []
  for (let i = 0; i < b64.length; i += chunkChars) {
    chunks.push(b64.slice(i, i + chunkChars))
  }
  return chunks
}

export async function extractFileText(file: File): Promise<{ kind: FileKind; text: string }> {
  const kind = detectKind(file)
  if (!kind) throw new Error(`Unsupported file type: ${file.name}. Use PDF, DOCX, TXT or an image.`)

  if (file.size > MAX_FILE_BYTES) {
    throw new Error(`${file.name} is too large (max 10 MB). Please compress or split the PDF.`)
  }

  if (kind === 'TXT') return { kind, text: await file.text() }

  if (kind === 'DOCX') {
    const mammoth = await import('mammoth')
    const { value } = await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })
    return { kind, text: value }
  }

  // PDF or IMAGE — encode to base64 then send to Gemini
  const mimeType =
    kind === 'PDF'
      ? 'application/pdf'
      : file.type || (file.name.toLowerCase().endsWith('.png') ? 'image/png' : 'image/jpeg')

  const b64 = toBase64(await file.arrayBuffer())

  // If the raw file fits in one chunk, send as-is
  if (file.size <= CHUNK_BYTES) {
    const text = await extractTextFromBinary(mimeType, b64)
    return { kind, text }
  }

  // Large PDF: chunk and extract in sequence, then join
  const chunks = splitBase64Chunks(b64)
  const parts: string[] = []
  for (let i = 0; i < chunks.length; i++) {
    const chunkText = await extractTextFromBinary(mimeType, chunks[i])
    parts.push(chunkText)
  }
  return { kind, text: parts.join('\n') }
}

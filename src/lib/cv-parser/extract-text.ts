import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

export class UnsupportedFileTypeError extends Error {
  constructor(mimeType: string) {
    super(`Unsupported file type: ${mimeType}`);
    this.name = 'UnsupportedFileTypeError';
  }
}

export class EmptyDocumentError extends Error {
  constructor() {
    super('Document is empty or contains insufficient text (< 50 characters)');
    this.name = 'EmptyDocumentError';
  }
}

const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export async function extractText(buffer: Buffer, mimeType: string): Promise<string> {
  if (!SUPPORTED_MIME_TYPES.includes(mimeType)) {
    throw new UnsupportedFileTypeError(mimeType);
  }

  let text = '';

  if (mimeType === 'application/pdf') {
    // pdf-parse v1.1.4 — takes a Buffer directly, returns { text }
    const result = await pdfParse(buffer);
    text = result.text;
  } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    const result = await mammoth.extractRawText({ buffer });
    text = result.value;
  }

  const trimmedText = text.trim();
  
  if (trimmedText.length < 50) {
    throw new EmptyDocumentError();
  }

  return trimmedText;
}

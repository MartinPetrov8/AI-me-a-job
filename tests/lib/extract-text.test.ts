import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UnsupportedFileTypeError, EmptyDocumentError } from '@/lib/cv-parser/extract-text';

vi.mock('pdf-parse', () => ({
  PDFParse: vi.fn()
}));

vi.mock('mammoth', () => ({
  default: {
    extractRawText: vi.fn()
  }
}));

import { extractText } from '@/lib/cv-parser/extract-text';
import { PDFParse } from 'pdf-parse';
import mammoth from 'mammoth';

describe('extractText', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should extract text from PDF buffer', async () => {
    const sampleText = 'This is a test PDF document with more than fifty characters to pass the minimum length requirement.';
    
    const mockGetText = vi.fn().mockResolvedValue({ text: sampleText });
    vi.mocked(PDFParse).mockImplementation(function(this: any) {
      this.getText = mockGetText;
      return this;
    } as any);

    const buffer = Buffer.from('mock pdf content');
    const result = await extractText(buffer, 'application/pdf');
    
    expect(result).toBe(sampleText);
    expect(PDFParse).toHaveBeenCalledWith(buffer);
  });

  it('should extract text from DOCX buffer', async () => {
    const sampleText = 'This is a test DOCX document with more than fifty characters to pass the minimum length requirement.';
    
    vi.mocked(mammoth.extractRawText).mockResolvedValue({ value: sampleText, messages: [] });

    const buffer = Buffer.from('mock docx content');
    const result = await extractText(buffer, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
    
    expect(result).toBe(sampleText);
  });

  it('should throw UnsupportedFileTypeError for unsupported MIME type', async () => {
    const buffer = Buffer.from('test');
    
    await expect(extractText(buffer, 'text/plain')).rejects.toThrow(UnsupportedFileTypeError);
    await expect(extractText(buffer, 'image/jpeg')).rejects.toThrow(UnsupportedFileTypeError);
  });

  it('should throw EmptyDocumentError if extracted text is too short', async () => {
    const mockGetText = vi.fn().mockResolvedValue({ text: 'Short' });
    vi.mocked(PDFParse).mockImplementation(function(this: any) {
      this.getText = mockGetText;
      return this;
    } as any);

    const buffer = Buffer.from('mock pdf content');
    
    await expect(extractText(buffer, 'application/pdf')).rejects.toThrow(EmptyDocumentError);
  });

  it('should throw EmptyDocumentError if extracted text is empty', async () => {
    const mockGetText = vi.fn().mockResolvedValue({ text: '   ' });
    vi.mocked(PDFParse).mockImplementation(function(this: any) {
      this.getText = mockGetText;
      return this;
    } as any);

    const buffer = Buffer.from('mock pdf content');
    
    await expect(extractText(buffer, 'application/pdf')).rejects.toThrow(EmptyDocumentError);
  });
});

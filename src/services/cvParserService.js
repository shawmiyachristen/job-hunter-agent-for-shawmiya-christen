import pdfParse from 'pdf-parse';
import mammoth from 'mammoth';

/**
 * Extracts raw text from an uploaded CV file buffer.
 * Supports PDF, DOCX, and TXT files.
 * 
 * @param {Buffer} buffer - File buffer
 * @param {string} mimeType - Mime type of the file
 * @param {string} filename - Filename of the file
 * @returns {Promise<string>} Plaintext content of the CV
 */
export async function parseCV(buffer, mimeType, filename) {
  let text = '';
  
  if (mimeType === 'application/pdf' || filename.toLowerCase().endsWith('.pdf')) {
    try {
      const data = await pdfParse(buffer);
      text = data.text;
    } catch (err) {
      throw new Error(`PDF Parsing failed: ${err.message}`);
    }
  } else if (
    mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
    filename.toLowerCase().endsWith('.docx')
  ) {
    try {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value;
    } catch (err) {
      throw new Error(`Word (.docx) parsing failed: ${err.message}`);
    }
  } else if (mimeType === 'text/plain' || filename.toLowerCase().endsWith('.txt')) {
    text = buffer.toString('utf-8');
  } else if (filename.toLowerCase().endsWith('.doc')) {
    throw new Error('Legacy Word (.doc) format is not supported. Please save as PDF or .docx first.');
  } else {
    throw new Error('Unsupported file format. Please upload a PDF or Word (.docx) file.');
  }

  // Basic cleanup: collapse whitespace sequences into single spaces
  text = text.replace(/\s+/g, ' ').trim();
  
  if (!text || text.length < 20) {
    throw new Error('Extracted text is empty or too short. Make sure your CV is not a scanned image.');
  }

  return text;
}

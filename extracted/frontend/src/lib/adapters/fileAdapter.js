/**
 * fileAdapter.js — File upload (Worker-backed, no Base44).
 *
 * Files are converted to base64 and sent to the Worker's upload_file endpoint.
 * The Worker proxies to 0x0.st or R2 (if STORAGE binding is configured).
 */

import { invokeFunctionDirect } from '@/lib/directInvoke';

function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export const fileAdapter = {
  async uploadFile(file) {
    const base64 = await fileToBase64(file);
    const result = await invokeFunctionDirect('uploadFile', {
      base64,
      filename: file.name || 'file',
      mimeType: file.type || 'application/octet-stream',
    });
    if (!result?.file_url) throw new Error('Upload failed');
    return { file_url: result.file_url };
  },

  async uploadPrivateFile(file) {
    // Worker doesn't have a separate private upload — use regular upload
    // (R2 bucket can be public or private based on configuration)
    const base64 = await fileToBase64(file);
    const result = await invokeFunctionDirect('uploadFile', {
      base64,
      filename: file.name || 'file',
      mimeType: file.type || 'application/octet-stream',
    });
    if (!result?.file_url) throw new Error('Upload failed');
    return { file_uri: result.file_url };
  },

  async getSignedUrl(fileUri, expiresIn = 300) {
    // If the Worker returned a direct URL, no signing needed
    // If it's a private R2 URI, the Worker would need a signed URL endpoint
    // For now, return the URI directly (Worker uses public 0x0.st URLs)
    return { signed_url: fileUri };
  },

  async extractDataFromFile(fileUrl, jsonSchema) {
    // Use the Worker's file analysis endpoint with the schema as the question
    const schemaStr = JSON.stringify(jsonSchema);
    return invokeFunctionDirect('fileAnalyze', {
      file_url: fileUrl,
      prompt: `Extract data from this file according to this JSON schema: ${schemaStr}`,
    });
  },
};

export default fileAdapter;
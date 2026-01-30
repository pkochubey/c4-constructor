/**
 * File service for file operations (download, upload)
 */

import { FILE_CONFIG } from '../config';

export class FileService {
  /**
   * Download content as a file
   */
  download(content: string, filename: string, mimeType = FILE_CONFIG.MIME_TYPE): void {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.style.display = 'none';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up the object URL
    setTimeout(() => URL.revokeObjectURL(url), 100);
  }

  /**
   * Read a file as text
   */
  readAsText(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onload = (event) => {
        const content = event.target?.result;
        if (typeof content === 'string') {
          resolve(content);
        } else {
          reject(new Error('File content is not text'));
        }
      };

      reader.onerror = () => {
        reject(new Error('Failed to read file'));
      };

      reader.readAsText(file);
    });
  }

  /**
   * Read multiple files as text
   */
  async readMultipleAsText(files: FileList | File[]): Promise<string[]> {
    const fileArray = Array.from(files);
    return Promise.all(fileArray.map((file) => this.readAsText(file)));
  }

  /**
   * Validate file has acceptable extension
   */
  isValidDSLFile(file: File): boolean {
    const extension = file.name.toLowerCase().split('.').pop();
    return FILE_CONFIG.TXT_EXTENSIONS.some((ext) => ext === `.${extension}`);
  }

  /**
   * Generate DSL filename from workspace name
   */
  generateDSLFilename(workspaceName: string): string {
    const sanitized = workspaceName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '_')
      .replace(/^_+|_+$/g, '');
    return sanitized || 'workspace' + FILE_CONFIG.DSL_EXTENSION;
  }
}

// Singleton instance
export const fileService = new FileService();

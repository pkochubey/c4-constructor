/**
 * Clipboard service for copying text to clipboard
 */

export class ClipboardService {
  /**
   * Copy text to clipboard
   */
  async copy(text: string): Promise<void> {
    if (!navigator.clipboard) {
      // Fallback for older browsers
      this.fallbackCopy(text);
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
    } catch (err) {
      throw new Error(`Failed to copy to clipboard: ${err}`);
    }
  }

  /**
   * Fallback copy method for browsers without Clipboard API
   */
  private fallbackCopy(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-999999px';
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (!successful) {
        throw new Error('Fallback copy failed');
      }
    } finally {
      document.body.removeChild(textArea);
    }
  }

  /**
   * Check if clipboard API is available
   */
  isSupported(): boolean {
    return !!(navigator.clipboard || document.execCommand);
  }
}

// Singleton instance
export const clipboardService = new ClipboardService();

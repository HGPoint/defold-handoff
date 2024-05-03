/**
 * Utility module for handling file downloading.
 * @packageDocumentation
 */

/**
 * Downloads the specified Blob object as a file with the given filename.
 * @param blob - The Blob object to download.
 * @param filename - The filename for the downloadable file.
 */
export default function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

/**
 * Handles downloads.
 * @packageDocumentation
 */

/**
 * Triggers the download of a blob as a file.
 * @param blob - The blob to download.
 * @param filename - The file name for the downloaded  file.
 */
export default function download(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}
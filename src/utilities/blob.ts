/**
 * Handles operations with blob data.
 * @packageDocumentation
 */

/**
 * Creates a blob from a string or an ArrayBuffer.
 * @param data - The data to create a blob from.
 * @returns The created blob.
 */
export function createBlob(data: string): Blob
export function createBlob(data: ArrayBuffer): Blob
export function createBlob(data: ArrayBuffer | string): Blob {
  const type = resolveBlobType(data);
  const blob = new Blob([data], { type });
  return blob;
}

/**
 * Resolves the MIME type of a blob based on the provided data.
 * @param data - The data to resolve the type from.
 * @returns The resolved MIME type.
 */
function resolveBlobType(data: ArrayBuffer | string): string {
  if (typeof data === "string") {
    return "text/plain";
  }
  if (data instanceof ArrayBuffer) {
    return "image/png";
  }
  return "";
}

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
export function createBlob(data: Uint8Array): Blob;
export function createBlob(data: ArrayBuffer | Uint8Array | string): Blob {
  const type = resolveBlobType(data);
  const payload = resolvePayload(data);
  const blob = new Blob([payload], { type });
  return blob;
}

function resolvePayload(data: ArrayBuffer | Uint8Array | string) {
  if (typeof data === "string" || data instanceof ArrayBuffer) {
    return data;
  }
  return data.slice().buffer;
}

/**
 * Resolves the MIME type of a blob based on the provided data.
 * @param data - The data to resolve the type from.
 * @returns The resolved MIME type.
 */
function resolveBlobType(data: ArrayBuffer | Uint8Array | string): string {
  if (typeof data === "string") {
    return "text/plain";
  }
  if (data instanceof ArrayBuffer || data instanceof Uint8Array) {
    return "image/png";
  }

  return "";
}

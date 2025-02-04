/**
 * Handles error management.
 * @packageDocumentation
 */

/**
 * Processes an error.
 * @param error - The error to process.
 * @returns The deciphered error message.
 */
export function processError(error: Error) {
  const text = decipherError(error);
  console.error(error);
  console.warn(text);
  figma.notify(text);
}

/**
 * Attempts to convert Figma's error messages to a user-friendly and readable form.
 * @param error - The error to decipher.
 * @returns The deciphered error message.
 */
function decipherError(error: Error): string {
  if (error.message === 'in get_variantProperties: Component set for node has existing errors') {
    if (error.stack?.includes("at resolveAtlasTexture")) {
      return "Atlas has some errors, probably duplicate sprite names";
    }
  }
  return error.message;
}
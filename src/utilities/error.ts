/**
 * Utility module for handling Figma's error messages.
 * @packageDocumentation
 */

/**
 * Tries to convert Figma's error messages to a more user-friendly and readable form.
 * @param error - The error to decipher.
 * @returns The deciphered error message.
 */
export function decipherError(error: Error): string {
  if (error.message === 'in get_variantProperties: Component set for node has existing errors') {
    if (error.stack?.includes("at resolveAtlasTexture")) {
      return "Atlas has some errors, probably duplicate sprite names"
    }
  }
  return error.message;
}
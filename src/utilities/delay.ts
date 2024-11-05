/**
 * Handles time delay operations.
 * @packageDocumentation
 */

/**
 * Delays the execution;
 * @param time - The delay duration in milliseconds.
 * @returns A promise that resolves after the delay.
 */
export default async function delay(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}
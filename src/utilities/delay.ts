/**
 * Waits for a specified amount of time before resolving the promise.
 * @param time – The time to delay in milliseconds.
 * @returns A promise that resolves after the specified time.
 */
export async function delay(time: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, time));
}
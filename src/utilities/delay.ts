/**
 * Waits for a specified amount of time before resolving the promise.
 * @param time – The time to delay in milliseconds.
 * @returns 
 */
export async function delay(time: number) {
  return new Promise((resolve) => setTimeout(resolve, time));
}
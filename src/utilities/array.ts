/**
 * Handles array operations.
 * @packageDocumentation
 */

/**
 * Copies an array deeply.
 * @param array - The array to copy.
 * @returns A deep copy of the array.
 */
export function copyArray<TArray>(array: TArray[]): TArray[] {
  return JSON.parse(JSON.stringify(array));
}

/**
 * Removes duplicate values from an array.
 * @param array - The array from which to remove duplicates.
 * @returns The array with duplicates removed.
 */
export function removeDoubles<TArray>(array: TArray[]): TArray[] {
  const uniqueValues = new Set(array);
  return [ ...uniqueValues ];
}

export function checkMeaningfulArray<TArray>(array?: TArray[]): array is TArray[] {
  return !!array && Array.isArray(array) && !!array.length;
}
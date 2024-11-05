/**
 * Handles clipboard interactions.
 * @packageDocumentation
 */

/**
 * Copies data on the clipboard as a string.
 * @param data - The data to be copied on the clipboard.
 */
export default function copyOnClipboard(data: string) {
  const textarea = document.createElement("textarea");
  textarea.value = data;
  textarea.style.position = "fixed";
  textarea.style.zIndex = "-100";
  textarea.style.left = "-10000px";
  textarea.style.top = "-10000px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

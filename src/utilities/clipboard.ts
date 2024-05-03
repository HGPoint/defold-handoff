/**
 * Utility module for handling the clipboard operations.
 * @packageDocumentation
 */

/**
 * Copies the specified text data on the clipboard.
 * @param data - The text data to be copied.
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

/**
 * Utility module for handling scheme boilerplate code.
 * @packageDocumentation
 */

/**
 * Extracts the scheme boilerplate code from an array of GUI node data.
 * @param nodes - An array of GUI node data.
 * @returns The extracted scheme boilerplate code as a string.
 */
export function extractScheme(nodes: GUINodeData[]): string {
  const schemeNodes = nodes.reduce((scheme, node) => {
    const { id } = node;
    return `${scheme}\n  ${id.toUpperCase()} = "${id}";`;
  }, "");
  return `local scheme = {${schemeNodes}\n}`;
}

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
    const name = (node.parent ? node.id : "root").toUpperCase();
    return `${scheme}\n  ${name} = "${id}";`;
  }, "");
  return `local scheme = {${schemeNodes}\n}`;
}

export function extractScheme(nodes: GUINodeData[]): string {
  const schemeNodes = nodes.reduce((scheme, node) => {
    const { id } = node;
    return `${scheme}\n  ${id.toUpperCase()} = "${id}";`;
  }, "");
  return `local scheme = {${schemeNodes}\n}`;
}

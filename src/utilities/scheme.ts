export function extractScheme(nodes: GUINodeData[]): string {
  const schemeNodes = nodes.reduce((scheme, node) => {
    const { id, parent } = node;
    const variableName = parent ? id.replace(`${parent}_`, "") : id;
    return `${scheme}\n  ${variableName.toUpperCase()} = "${id}";`;
  }, "");
  return `local scheme = {\n${schemeNodes}\n}`;
}

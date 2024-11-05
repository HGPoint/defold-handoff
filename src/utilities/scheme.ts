/**
 * Handles GUI scheme boilerplate Lua code.
 * @packageDocumentation
 */

/**
 * Extracts the GUI scheme boilerplate Lua code from an array of GUI node data.
 * @param nodes - An array of GUI node data.
 * @returns The extracted GUI scheme boilerplate Lua code.
 */
export function extractScheme(nodes: GUINodeData[]): string {
  const schemeNodes = generateSchemeNodes(nodes);
  const scheme = `local scheme = {${schemeNodes}\n};`; 
  return scheme;
}

/**
 * Generates the GUI scheme nodes boilerplate Lua code from an array of GUI node data.
 * @param nodes - An array of GUI node data.
 * @returns The generated scheme nodes boilerplate Lua code.
 */
function generateSchemeNodes(nodes: GUINodeData[]): string {
  const schemeNodes = nodes.reduce(schemeNodeReducer, "");
  return schemeNodes;
}

/**
 * Reducer function for generating the GUI scheme nodes boilerplate Lua code.
 * @param scheme - The cumulative GUI scheme nodes boilerplate Lua code.
 * @param node - The GUI node data.
 * @returns The updated GUI scheme nodes boilerplate Lua code.
 */
function schemeNodeReducer(scheme: string, node: GUINodeData): string {
  const { id } = node;
  const name = resolveSchemeNodeVariableName(node);
  const nodeScheme = `${scheme}\n  ${name} = "${id}",`;
  return nodeScheme;
}

/**
 * Resolves the variable name for the GUI node in the scheme.
 * @param node - The GUI node data.
 * @returns The variable name for the GUI node in the scheme.
 */
function resolveSchemeNodeVariableName(node: GUINodeData): string {
  const name = node.parent ? node.id : "root";
  const upperCaseName = name.toUpperCase(); 
  return upperCaseName;
}
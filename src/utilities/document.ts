/**
 * Handles changes to the Figma document.
 * @packageDocumentation
 */

import { getPluginData, hasNamePropertyChanged, hasSizePropertyChanged, hasVariantPropertyChanged, isDocumentDeleteChange, isDocumentPropertyChange, isFigmaComponentInstance, isFigmaRemoved, setPluginData } from "utilities/figma";
import { removeGUINodeOverridesPluginData, resolveGUINodeOverridesDataKey } from "utilities/gui";
import { isSlice9Layer, isSlice9PlaceholderLayer, tryRefreshSlice9, tryRefreshSlice9SizeMode, tryUpdateSlice9LayerName, tryUpdateSlice9PlaceholderLayerName } from "utilities/slice9";

/**
 * Processes changes to the Figma document.
 * @param event - The document change event.
 */
export function processDocumentChanges(event: DocumentChangeEvent) {
  const { documentChanges } = event;
  processNodeChanges(documentChanges);
  processPropertyChanges(documentChanges);
  tryProcessComponentInstanceChanges(documentChanges);
}

/**
 * Processes node changes.
 * @param changes - The node changes.
 */
function processNodeChanges(changes: DocumentChange[]) {
  changes.forEach(processNodeChange);
}

/**
 * Processes a node change.
 * @param change - The node change.
 */
function processNodeChange(change: DocumentChange) {
  if (isDocumentDeleteChange(change)) {
    const { node } = change;
    if (isFigmaRemoved(node)) {
      removeGUINodeOverridesPluginData(node);
    }
  }
}

/**
 * Processes property changes.
 * @param changes - The property changes.
 */
function processPropertyChanges(changes: DocumentChange[]) {
  changes.forEach(processPropertyChange);
}

/**
 * Processes a property change.
 * @param change - The property change.
 */
function processPropertyChange(change: DocumentChange) {
  if (isDocumentPropertyChange(change)) {
    const { node } = change;
    if (node && !isFigmaRemoved(node)) {
      if (hasNamePropertyChanged(change)) {
        onNamePropertyChange(node);
      }
      if (hasSizePropertyChanged(change)) {
        onSizePropertyChange(node);
      }
      if (hasVariantPropertyChanged(change)) {
        onVariantPropertyChange(node);
      }
    }
  }
}

/**
 * Handler function for name property changes on a node.
 * @param node - The node with the name property change.
 */
function onNamePropertyChange(node: SceneNode) {
  if (isSlice9PlaceholderLayer(node)) {
    tryUpdateSlice9LayerName(node);
  } else if (isSlice9Layer(node)) {
    tryUpdateSlice9PlaceholderLayerName(node);
  }
}

/**
 * Handler function for variant property changes on a node.
 * @param node - The node with the variant property change.
 */
function onVariantPropertyChange(node: SceneNode) {
  if (isSlice9Layer(node) && isFigmaComponentInstance(node)) {
    tryRefreshSlice9(node);
  }
}

function onSizePropertyChange(node: SceneNode) {
  if (isSlice9Layer(node)) {
    tryRefreshSlice9SizeMode(node);
  } else if (isSlice9PlaceholderLayer(node)) {
    tryRefreshSlice9SizeMode(node);
  }
}

/**
 * Attempts to process changes to component instances.
 * @param changes - The document changes.
 */
function tryProcessComponentInstanceChanges(changes: DocumentChange[]) {
  const changedComponentInstances = findChangedComponentInstances(changes);
  if (changedComponentInstances.length) {
    processComponentInstanceChanges(changedComponentInstances);
  }
}

/**
 * Finds unique component instances from document changes.
 * @param changes - The document changes.
 * @returns The unique component instances.
 */
function findChangedComponentInstances(changes: DocumentChange[]) {
  return changes.reduce(changedComponentInstanceReducer, [] as InstanceNode[]);
}

/**
 * Reducer function for finding unique component instances from document changes.
 * @param instances - The reduced component instances.
 * @param change - The document change.
 * @returns The reduced component instances.
 */
function changedComponentInstanceReducer(instances: InstanceNode[], change: DocumentChange) {
  if (isDocumentPropertyChange(change)) {
    const { node } = change;
    if (!isFigmaRemoved(node) && isFigmaComponentInstance(node) && !instances.includes(node)) {
      instances.push(node);
    }
  }
  return instances;
}

/**
 * Processes changes to component instances.
 * @param instances - The component instances to process.
 */
function processComponentInstanceChanges(instances: InstanceNode[]) {
  instances.forEach(tryRestoreDataFromOverrides);
}

/**
 * Attempts to restore data for a Figma component instance node from GUI overrides.
 * @param node - The Figma component instance node to restore data for.
 */
function tryRestoreDataFromOverrides(node: InstanceNode) {
  const { root: document } = figma;
  const { id } = node;
  const key = resolveGUINodeOverridesDataKey(id);
  const guiNodeDataOverrides = getPluginData(document, key);
  if (guiNodeDataOverrides) {
    const guiNodeData = { defoldGUINode: guiNodeDataOverrides }
    setPluginData(node, guiNodeData);
  }
}


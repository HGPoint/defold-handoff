/* global PKG */

/**
 * Utility moule for handling plugin UI.
 * @packageDocumentation
 */

import { exportAtlases, exportSprites, copyGUINodes, exportGUINodes, exportBundle, copyGUINodeScheme, copyGameObjects, exportGameObjects } from "utilities/resources";

/**
 * Generates a random alphanumeric ID.
 * @returns A random alphanumeric ID.
 */
export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Checks if property is an override of the original value.
 * @param value 
 * @param originalValue 
 * @returns 
 */
export function isOverride<T extends PluginGUINodeData[keyof PluginGUINodeData]>(value: T | null, originalValue: T | null): originalValue is T {
  if (originalValue != null) {
    if (typeof originalValue === "object") {
      return JSON.stringify(value) !== JSON.stringify(originalValue);
    }
    return value !== originalValue
  }
  return false;
}

/**
 * Checks if the event contains a plugin message.
 * @param event - The event to check.
 * @returns A boolean indicating if the event contains a plugin message.
 */
export function isPluginMessage(event: MessageEvent): event is MessageEvent<PluginUIMessage> {
  return !!event?.data?.pluginMessage;
}

/**
 * Checks if the data contains a valid plugin message payload.
 * @param data - The data to check.
 * @returns A boolean indicating if the data contains a valid plugin message payload.
 */
export function isPluginMessagePayload(data?: PluginMessagePayload): data is PluginMessagePayload {
  return !!data && typeof data === "object" && ("bundle" in data || "selection" in data || "scheme" in data || "image" in data);
}

/**
 * Checks if the selection data is valid.
 * @param selection - The selection data to check.
 * @returns A boolean indicating if the selection data is valid.
 */
export function isSelectionData(selection?: SelectionUIData): selection is SelectionUIData {
  return !!selection && "gui" in selection && "atlases" in selection && "layers" in selection;
}

/**
 * Checks if the UI mode is valid.
 * @param mode - The UI mode to check.
 * @returns A boolean indicating if the UI mode is valid.
 */
export function isUIMode(mode?: string): mode is UIMode {
  return mode === null || (!!mode && (mode === "developer" || mode === "designer" || mode === "game-designer"));
}

export function isDeveloperUIMode(mode?: UIMode): mode is "developer" {
  return mode === "developer";
}

export function isDesignerUIMode(mode?: UIMode): mode is "designer" {
  return mode === "designer";
}

export function isGameDesignerUIMode(mode?: UIMode): mode is "game-designer" {
  return mode === "game-designer";
}

export function currentUIMode(): UIMode {
  return figma.command as UIMode;
}

export function isCurrentDeveloperUIMode(): boolean {
  const mode = currentUIMode();
  return isDeveloperUIMode(mode);
}

export function isCurrentDesignerUIMode(): boolean {
  const mode = currentUIMode();
  return isDesignerUIMode(mode);
}

export function isCurrentGameDesignerUIMode(): boolean {
  const mode = currentUIMode();
  return isGameDesignerUIMode(mode);
}

/**
 * Checks if the selection has been updated.
 * @param currentSelection - The current selection.
 * @param selection - The new selection.
 * @returns A boolean indicating if the selection has been updated.
 */
export function isUpdatedSelection(currentSelection: SelectionUIData, selection: SelectionUIData): boolean {
  return JSON.stringify(currentSelection) !== JSON.stringify(selection);
}

/**
 * Posts a message to the plugin.
 * @param type - The type of plugin message.
 * @param data - The data associated with the message.
 */
export function postMessageToPlugin(type: PluginMessageAction, data?: PluginMessagePayload) {
  parent.postMessage({ pluginMessage: { type, data } }, "*");
}

function onAtlasesExported(data: PluginMessagePayload) {
  exportAtlases(data);
}

function onSpritesExported(data: PluginMessagePayload) {
  exportSprites(data);
}

function onGUINodesCopied(data: PluginMessagePayload) {
  copyGUINodes(data);
}

function onGUINodesExported(data: PluginMessagePayload) {
  exportGUINodes(data);
}

function onGUINodeSchemeCopied(data: PluginMessagePayload) {
  copyGUINodeScheme(data);
}

function onBundleExported(data: PluginMessagePayload) {
  exportBundle(data);
}

function onGameObjectsCopied(data: PluginMessagePayload) {
  copyGameObjects(data);
}

function onGameObjectsExported(data: PluginMessagePayload) {
  exportGameObjects(data);
}

/**
 * Processes a plugin message and triggers corresponding actions.
 * @param type - The type of plugin message.
 * @param data - The data associated with the message.
 */
export function processPluginMessage(type: PluginMessageAction, data?: PluginMessagePayload) {
  if (data) {
    if ((type === "atlasesExported" || type === "guiNodeAtlasesExported" || type === "gameObjectAtlasesExported")) {
      onAtlasesExported(data);
    } else if (type === "spritesExported") {
      onSpritesExported(data);
    } else if (type === "guiNodesCopied") {
      onGUINodesCopied(data);
    } else if (type === "guiNodesExported") {
      onGUINodesExported(data);
    } else if (type === "guiNodeSchemeCopied") {
      onGUINodeSchemeCopied(data);
    } else if (type === "gameObjectsCopied") {
      onGameObjectsCopied(data);
    } else if (type === "gameObjectsExported") {
      onGameObjectsExported(data);
    } else if (type === "bundleExported") {
      onBundleExported(data);
    }
  }
}

export function resolveVersion() {
  // @ts-expect-error: Undefined PKG variable.
  return PKG.version;
}
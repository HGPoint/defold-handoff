/* global PKG */

/**
 * Handles operations within UI application.
 * @packageDocumentation
 */

import { copyGUI, copyGUIScheme, copyGameObjects, exportAtlases, exportBundle, exportGUI, exportGameObjects, exportSprites } from "utilities/resources";

/**
 * Resolves the plugin version.
 * @returns The plugin version.
 */
export function resolvePluginVersion() {
  // @ts-expect-error: Undefined PKG variable.
  return PKG.version;
}

/**
 * Generates a random alphanumeric ID.
 * @returns A random alphanumeric ID.
 */
export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

/**
 * Determines whether a property value overrides the original value.
 * @param value - The value to check.
 * @param originalValue - The original value to compare against.
 * @returns True if the value is an override, otherwise false.
 */
export function isValueOverridden<T extends PluginGUINodeData[keyof PluginGUINodeData]>(value: WithNull<T>, originalValue: WithNull<T>): originalValue is T {
  if (originalValue) {
    if (typeof originalValue === "object") {
      return JSON.stringify(value) !== JSON.stringify(originalValue);
    }
    return value !== originalValue
  }
  return false;
}

/**
 * Determines whether the message event contains a message from the plugin.
 * @param event - The message event to check.
 * @returns True if the message event contains a message from the plugin, otherwise false.
 */
export function isPluginMessage(event: MessageEvent): event is MessageEvent<uiMessage> {
  return !!event?.data?.pluginMessage;
}

/**
 * Determines whether the data contains a valid plugin message payload.
 * @param data - The data to check.
 * @returns True if the data contains a valid plugin message payload, otherwise false.
 */
export function isPluginMessagePayload(data?: PluginMessagePayload): data is PluginMessagePayload {
  return !!data &&
    typeof data === "object" &&
    (
      "mode" in data ||
      "selection" in data ||
      "project" in data ||
      "bundle" in data ||
      "gui" in data ||
      "guiNode" in data ||
      "gameObject" in data ||
      "section" in data ||
      "scheme" in data ||
      "image" in data ||
      "option" in data
    );
}

/**
 * Determines whether the selection data is valid.
 * @param selection - The selection data to check.
 * @returns True if the selection data is valid, otherwise false.
 */
export function isSelectionUIData(selection?: SelectionUIData): selection is SelectionUIData {
  return !!selection &&
    "gui" in selection &&
    "gameObjects" in selection &&
    "atlases" in selection &&
    "layers" in selection &&
    "sections" in selection &&
    "project" in selection &&
    "context" in selection &&
    "meta" in selection;
}

/**
 * Determines whether the UI mode is valid.
 * @param mode - The UI mode to check.
 * @returns True if the UI mode is valid, otherwise false.
 */
export function isUIMode(mode?: string): mode is UIMode {
  return mode === null ||
  (
    !!mode && (
      mode === "developer" ||
      mode === "designer" ||
      mode === "game-designer"
    )
  );
}

/**
 * Checks if the UI mode is "developer".
 * @param mode - The UI mode to check.
 * @returns True if the UI mode is "developer", otherwise false.
 */
export function isUIModeDeveloper(mode?: UIMode): mode is "developer" {
  return mode === "developer";
}

/**
 * Checks if the UI mode is "designer".
 * @param mode - The UI mode to check.
 * @returns True if the UI mode is "designer", otherwise false.
 */
export function isUIModeDesigner(mode?: UIMode): mode is "designer" {
  return mode === "designer";
}

/**
 * Checks if the UI mode is "game designer".
 * @param mode - The UI mode to check.
 * @returns True if the UI mode is "game designer", otherwise false.
 */
export function isUIModeGameDesigner(mode?: UIMode): mode is "game-designer" {
  return mode === "game-designer";
}

/**
 * Retrieves the current UI mode.
 * @returns The current UI mode.
 */
export function getCurrentUIMode() {
  return figma.command as UIMode;
}

/**
 * Determines whether the current UI mode is "developer".
 * @returns True if the current UI mode is "developer", otherwise false.
 */
export function isCurrentUIModeDeveloper(): boolean {
  const mode = getCurrentUIMode();
  return isUIModeDeveloper(mode);
}

/**
 * Determines whether the current UI mode is "designer".
 * @returns True if the current UI mode is "designer", otherwise false.
 */
export function isCurrentUIModeDesigner(): boolean {
  const mode = getCurrentUIMode();
  return isUIModeDesigner(mode);
}

/**
 * Determines whether the current UI mode is "game designer".
 * @returns True if the current UI mode is "game designer", otherwise false.
 */
export function isCurrentUIModeGameDesigner(): boolean {
  const mode = getCurrentUIMode();
  return isUIModeGameDesigner(mode);
}

/**
 * Determines whether the selection has been updated.
 * @param selection - The new selection.
 * @param currentSelection - The current selection.
 * @returns True if the selection has been updated, otherwise false.
 */
export function isSelectionUpdated(selection: SelectionUIData, currentSelection: SelectionUIData): boolean {
  return JSON.stringify(selection) !== JSON.stringify(currentSelection);
}

/**
 * Sends a message to the plugin.
 * @param type - The type of plugin message.
 * @param data - The data associated with the message.
 */
export function postMessageToPlugin(type: PluginMessageAction, data?: PluginMessagePayload) {
  parent.postMessage({ pluginMessage: { type, data } }, "*");
}

/**
 * Processes a plugin message and triggers corresponding action.
 * @param type - The type of plugin message.
 * @param data - The data associated with the message.
 */
export function onPluginMessage(type: PluginMessageAction, data?: PluginMessagePayload) {
  if (data) {
    if (type === "guiExported") {
      onGUIExported(data);
    } else if (type === "guiCopied") {
      onGUICopied(data);
    } else if (type === "guiSchemeCopied") {
      onGUISchemeCopied(data);
    } else if (type === "gameCollectionsExported") {
      onGameCollectionsExported(data);
    } else if (type === "gameCollectionCopied") {
      onGameCollectionCopied(data);
    } else if (type === "atlasesExported") {
      onAtlasesExported(data);
    } else if (type === "spritesExported") {
      onSpritesExported(data);
    } else if (type === "bundleExported") {
      onBundleExported(data);
    }
  }
}

function onGUIExported(data: PluginMessagePayload) {
  exportGUI(data);
}

function onGUICopied(data: PluginMessagePayload) {
  copyGUI(data);
}

function onGUISchemeCopied(data: PluginMessagePayload) {
  copyGUIScheme(data);
}

function onGameCollectionsExported(data: PluginMessagePayload) {
  exportGameObjects(data);
}

function onGameCollectionCopied(data: PluginMessagePayload) {
  copyGameObjects(data);
}

function onAtlasesExported(data: PluginMessagePayload) {
  exportAtlases(data);
}

function onSpritesExported(data: PluginMessagePayload) {
  exportSprites(data);
}

function onBundleExported(data: PluginMessagePayload) {
  exportBundle(data);
}

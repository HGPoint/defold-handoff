import { exportAtlases, copyComponent, exportGUI, exportResources, copyScheme } from "utilities/resources";

export function generateRandomId(): string {
  return Math.random().toString(36).substring(2, 9);
}

export function isPluginMessage(event: MessageEvent): event is MessageEvent<PluginUIMessage> {
  return !!event?.data?.pluginMessage;
}

export function isPluginMessagePayload(data?: PluginMessagePayload): data is PluginMessagePayload {
  return !!data && typeof data === "object" && ("bundle" in data || "selection" in data || "scheme" in data || "image" in data);
}

export function isSelectionData(selection?: SelectionUIData): selection is SelectionUIData {
  return !!selection && "gui" in selection && "atlases" in selection && "layers" in selection;
}

export function isUIMode(mode?: string): mode is UIMode {
  return mode === null || (!!mode && (mode === "developer" || mode === "designer"));
}

export function isUpdatedSelection(currentSelection: SelectionUIData, selection: SelectionUIData): boolean {
  return JSON.stringify(currentSelection) !== JSON.stringify(selection);
}

export function postMessageToPlugin(type: PluginMessageAction, data?: PluginMessagePayload) {
  parent.postMessage({ pluginMessage: { type, data } }, "*");
}

function onDefoldAtlasesExported(data: PluginMessagePayload) {
  exportAtlases(data);
}

function onComponentsCopiedToDefold(data: PluginMessagePayload) {
  copyComponent(data);
}

function onComponentsExportedToDefold(data: PluginMessagePayload) {
  exportGUI(data);
}

function onBundleExportedToDefold(data: PluginMessagePayload) {
  exportResources(data);
}

function onGUINodeSchemeCopied(data: PluginMessagePayload) {
  copyScheme(data);
}

export function processPluginMessage(type: PluginMessageAction, data?: PluginMessagePayload) {
  if (type === "atlasesExported" && data) {
    onDefoldAtlasesExported(data);
  } else if (type === "guiNodesCopied" && data) {
    onComponentsCopiedToDefold(data);
  } else if (type === "guiNodesExported" && data) {
    onComponentsExportedToDefold(data);
  } else if (type === "bundleExported" && data) {
    onBundleExportedToDefold(data);
  } else if (type === "guiNodeSchemeCopied" && data) {
    onGUINodeSchemeCopied(data);
  }
}

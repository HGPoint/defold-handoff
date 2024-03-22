import { exportAtlases, copyComponent, exportComponent, exportResources } from "utilities/resources";

export function isPluginMessage(event: MessageEvent): event is MessageEvent<PluginUIMessage> {
  return !!event?.data?.pluginMessage;
}

export function isPluginMessagePayload(data?: PluginMessagePayload): data is PluginMessagePayload {
  return !!data && typeof data === "object" && ("bundle" in data || "selection" in data);
}

export function isSelectionData(selection?: SelectionUIData): selection is SelectionUIData {
  return !!selection && "gui" in selection && "atlases" in selection && "layers" in selection;
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
  exportComponent(data);
}

function onBundleExportedToDefold(data: PluginMessagePayload) {
  exportResources(data);
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
  }
}

import { exportAtlases, copyComponent, exportComponent, exportResources } from "./resources";

export function isPluginMessage(event: MessageEvent): event is MessageEvent<PluginUIMessage> {
  return !!event?.data?.pluginMessage;
}

export function isSelectionData(data?: PluginMessagePayload): data is SelectionData {
  return !!data && typeof data === "object" && "gui" in data && "atlases" in data && "layers" in data;
}

export function postMessageToPlugin(type: PluginMessageAction) {
  parent.postMessage({ pluginMessage: { type } }, "*");
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
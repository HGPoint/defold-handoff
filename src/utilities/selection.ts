import config from "config/config.json";
import { isSlice9PlaceholderLayer, isSlice9ServiceLayer, findOriginalLayer } from "utilities/slice9";
import { isAtlas, isFigmaFrame, isFigmaSection, isFigmaComponentInstance, isFigmaBox, isFigmaText, isExportable, getPluginData, hasChildren } from "utilities/figma";
import { isTemplateGUINode } from "utilities/gui";
import { projectConfig } from "handoff/project";

function isSelectable(layer: SceneNode): boolean {
  return !isSlice9ServiceLayer(layer);
}

export function isGUINodeSelected(selection: SelectionData | SelectionUIData) {
  return selection?.gui?.length === 1;
}

export function areMultipleGUINodesSelected(selection: SelectionData | SelectionUIData) {
  return selection?.gui?.length > 1;
}

export function isAtlasSelected(selection: SelectionData | SelectionUIData) {
  return selection?.atlases?.length === 1;
}

export function areMultipleAtlasesSelected(selection: SelectionData | SelectionUIData) {
  return selection?.atlases?.length > 1;
}

export function isLayerSelected(selection: SelectionData | SelectionUIData) {
  return selection?.layers?.length === 1;
}

export function areMultipleLayersSelected(selection: SelectionData | SelectionUIData) {
  return selection?.layers?.length > 1;
}

export function isSectionSelected(selection: SelectionData | SelectionUIData) {
  return selection?.sections?.length === 1;
}

export function areMultipleSectionsSelected(selection: SelectionData | SelectionUIData) {
  return selection?.sections?.length > 1;
}

function pluginSelectionReducer(selection: SelectionData, layer: SceneNode): SelectionData {
  if (isSelectable(layer)) {
    if (isAtlas(layer)) {
      selection.atlases.push(layer);
    } else if (isFigmaSection(layer)) {
      selection.sections.push(layer);
    } else if (isFigmaFrame(layer) || isFigmaComponentInstance(layer) || isFigmaText(layer)) {
      const originalLayer = isSlice9PlaceholderLayer(layer) ? findOriginalLayer(layer) : layer;
      if (originalLayer) {
        selection.gui.push(originalLayer);
      }
    } else {
      selection.layers.push(layer);
    }
  }
  return selection;
}

export function reducePluginSelection(): SelectionData {
  const selection: SelectionData = { gui: [], atlases: [], layers: [], sections: [] };
  return figma.currentPage.selection.reduce(pluginSelectionReducer, selection);
}

function guiNodePluginUISelectionConverter(data: PluginGUINodeData[], layer: ExportableLayer): PluginGUINodeData[] {
  const pluginData = getPluginData(layer, "defoldGUINode");
  const { name: id } = layer;
  const type = isFigmaText(layer) ? "TYPE_TEXT" : "TYPE_BOX";
  const template_name = pluginData?.template_name || id;
  const guiNodeData: PluginGUINodeData = {
    ...config.guiNodeDefaultValues,
    ...config.guiNodeDefaultSpecialValues,
    ...pluginData,
    template_name,
    id,
    type
  };
  data.push(guiNodeData);
  return data;
}

function atlasPluginUISelectionConverter(data: PluginAtlasData[], layer: SceneNode): PluginAtlasData[] {
  const pluginData = getPluginData(layer, "defoldAtlas");
  if (pluginData) {
    data.push(pluginData);
  }
  return data;
}

function sectionPluginUISelectionConverter(data: PluginSectionData[], layer: SectionNode): PluginSectionData[] {
  const pluginData = getPluginData(layer, "defoldSection");
  const { name: id } = layer;
  const sectionData: PluginSectionData = {
    ...config.sectionDefaultValues,
    ...pluginData,
    id
  };
  data.push(sectionData);
  return data;
}

export function convertPluginUISelection(selection: SelectionData): SelectionUIData {
  return {
    gui: selection.gui.reduce(guiNodePluginUISelectionConverter, []),
    atlases: selection.atlases.reduce(atlasPluginUISelectionConverter, []),
    layers: selection.layers,
    sections: selection.sections.reduce(sectionPluginUISelectionConverter, []),
    project: projectConfig,
  }
}

export function reduceAtlases(selection: SelectionData): ComponentSetNode[] {
  const atlases = selection.sections.reduce((atlases, section) => {
    const sectionAtlases = section.children.filter((child): child is ComponentSetNode => isAtlas(child) && !atlases.includes(child));
    return [ ...atlases, ...sectionAtlases ]
  },  [...selection.atlases ] as ComponentSetNode[]);
  return atlases;
}

export function findTemplateNodes(guiNode: ExportableLayer): ExportableLayer[] {
  const templateNodes: ExportableLayer[] = [];
  if (isFigmaBox(guiNode) && hasChildren(guiNode)) {
    const { children } = guiNode;
    for (const child of children) {
      if (isExportable(child)) {
        if (isTemplateGUINode(child)) {
          templateNodes.push(child);
        } else {
          const childTemplateNodes = findTemplateNodes(child);
          templateNodes.push(...childTemplateNodes);
        }
      }
    }
  }
  return templateNodes;
}

export function reduceGUINodes(selection: SelectionData): ExportableLayer[] {
  const nodes = selection.gui.reduce((nodes, guiNode) => {
    const templateNodes = findTemplateNodes(guiNode);
    return [ ...nodes, ...templateNodes ]
  }, [ ...selection.gui ]);
  return nodes;
}

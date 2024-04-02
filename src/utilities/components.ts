import config from "config/config.json";
import { vector4 } from "utilities/math";

function pickGUINodeId(gui?: PluginGUINodeData): string {
  if (!gui || !gui.id) {
    return "";
  }
  return gui.id;
}

function pickGUINodePropertyValue<T extends keyof Omit<PluginGUINodeData, NonDefoldProperties>>(gui: PluginGUINodeData | undefined, property: T): NonNullable<PluginGUINodeData[T]> {
  if (!gui) {
    const defaultValue = config.guiNodeDefaultValues[property];
    if (typeof defaultValue === "object") {
      return { ...defaultValue };
    }
    return defaultValue;
  }
  const value = gui[property];
  if (value != null && value != undefined) {
    if (typeof value === "object") {
      return { ...value };
    }
    return value;
  }
  const defaultValue = config.guiNodeDefaultValues[property];
  if (typeof defaultValue === "object") {
    return { ...defaultValue };
  }
  return defaultValue;
}

export function generateGUINodeProperties(gui: PluginGUINodeData) {
  return {
    id: pickGUINodeId(gui),
    skip: !!gui?.skip,
    cloneable: !!gui?.cloneable,
    wrapper: !!gui?.wrapper,
    wrapper_padding: gui?.wrapper_padding || vector4(0),
    enabled: pickGUINodePropertyValue(gui, "enabled"),
    visible: pickGUINodePropertyValue(gui, "visible"),
    inherit_alpha: pickGUINodePropertyValue(gui, "inherit_alpha"),
    blend_mode: pickGUINodePropertyValue(gui, "blend_mode"),
    size_mode: pickGUINodePropertyValue(gui, "size_mode"),
    scale: pickGUINodePropertyValue(gui, "scale"),
    pivot: pickGUINodePropertyValue(gui, "pivot"),
    xanchor: pickGUINodePropertyValue(gui, "xanchor"),
    yanchor: pickGUINodePropertyValue(gui, "yanchor"),
    adjust_mode: pickGUINodePropertyValue(gui, "adjust_mode"),
    clipping_mode: pickGUINodePropertyValue(gui, "clipping_mode"),
    clipping_inverted: pickGUINodePropertyValue(gui, "clipping_inverted"),
    slice9: pickGUINodePropertyValue(gui, "slice9"),
    material: pickGUINodePropertyValue(gui, "material"),
    layer: pickGUINodePropertyValue(gui, "layer"),
  }
}

function pickSectionId(section?: PluginSectionData) {
  if (!section || !section.id) {
    return "";
  }
  return section.id;
}

function pickSectionPropertyValue<T extends keyof Omit<PluginSectionData, "id">>(section: PluginSectionData | undefined, property: T) {
  if (!section) {
    const defaultValue = config.sectionDefaultValues[property];
    return defaultValue;
  }
  const value = section[property];
  if (value != null && value != undefined) {
    return value;
  }
  const defaultValue = config.sectionDefaultValues[property];
  return defaultValue;
}

export function generateSectionProperties(section: PluginSectionData) {
  return {
    id: pickSectionId(section),
    bundled: pickSectionPropertyValue(section, "bundled"),
    jumbo: pickSectionPropertyValue(section, "jumbo"),
  }
}
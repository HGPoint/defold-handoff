import config from "config/config.json";

function pickGUINodeId(gui: PluginGUINodeData | undefined): string {
  if (!gui || !gui.id) {
    return "";
  }
  return gui.id;
}

function pickGUINodePropertyValue<T extends keyof Omit<PluginGUINodeData, "id" | "type" >>(gui: PluginGUINodeData | undefined, property: T): NonNullable<PluginGUINodeData[T]> {
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
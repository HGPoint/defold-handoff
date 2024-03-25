import config from "config/config.json";

function pickGUINodePropertyValue<T extends keyof Omit<PluginGUINodeData, "id" | "type" >>(gui: PluginGUINodeData | undefined, property: T): NonNullable<PluginGUINodeData[T]> {
  if (!gui) {
    return config.guiNodeDefaultValues[property];
  }
  const value = gui[property];
  if (value != null && value != undefined) {
    return value;
  }
  return config.guiNodeDefaultValues[property];
}

export function generateGUINodeProperties(gui: PluginGUINodeData) {
  return {
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
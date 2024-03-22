import config from "config/config.json";
import { isAtlas, isFigmaSceneNode, isFigmaText, isFigmaComponentInstance, hasSolidFills, findMainComponent } from "utilities/figma";
import { vector4 } from "utilities/math";

function calculateId(layer: ExportableLayer) {
  return layer.name;
}

function calculateType(layer: ExportableLayer): GUINodeType {
  return isFigmaText(layer) ? "TYPE_TEXT" : "TYPE_BOX";
}

function convertParent(parentId?: string) {
  return parentId ? { parent: parentId } : {};
}

function convertRootPosition(layer: ExportableLayer) {
  return vector4(layer.x, layer.y, 0, 1);
}

function convertCenteredPosition(layer: ExportableLayer, parentSize: Vector4) {
  const x = layer.x + (layer.width / 2) - (parentSize.x / 2);
  const y = (parentSize.y / 2) - layer.y - (layer.height / 2);
  return vector4(x, y, 0, 1);
}

function convertPosition(layer: ExportableLayer, parentSize?: Vector4) {
  if (!parentSize) {
    return convertRootPosition(layer);
  }
  return convertCenteredPosition(layer, parentSize);
}

function convertRotation(layer: ExportableLayer) {
  return vector4(0, 0, layer.rotation, 1);
}

function convertBoxScale() {
  return vector4(1);
}

function calculateMixedTextScale() {
  return vector4(1);
}

function calculateTextScale(fontSize: number) {
  const scale = fontSize / config.fontSize;
  return vector4(scale, scale, scale, 1);
}

function convertTextScale(layer: TextNode) {
  const { fontSize } = layer;
  if (typeof fontSize !== "number") {
    return calculateMixedTextScale();
  }
  return calculateTextScale(fontSize);
}

function convertSize(layer: ExportableLayer) {
  return vector4(layer.width, layer.height, 0, 1);
}

function calculateSizeMode(texture?: string): SizeMode {
  return texture ? "SIZE_MODE_AUTO" : "SIZE_MODE_MANUAL";
}

function convertBaseTransformations(layer: ExportableLayer, parentSize?: Vector4) {
  const position = convertPosition(layer, parentSize);
  const rotation = convertRotation(layer);
  const size = convertSize(layer);
  return {
    position,
    rotation,
    size
  };

}

function convertBoxTransformations(layer: BoxLayer, parentSize?: Vector4) {
  const baseTransformations = convertBaseTransformations(layer, parentSize);
  const scale = convertBoxScale();
  return {
    ...baseTransformations,
    scale,
  };
}

function convertTextTransformations(layer: TextLayer, parentSize?: Vector4) {
  const baseTransformations = convertBaseTransformations(layer, parentSize);
  const scale = convertTextScale(layer);
  return {
    ...baseTransformations,
    scale,
  };
}

function calculateBaseColor() {
  return vector4(1);
}

function calculateFillColor(fills: readonly SolidPaint[]) {
  const [ fill ] = fills;
  const { r, g, b } = fill.color ;
  return vector4(r, g, b, fill.opacity);
}

function calculateColor(layer: ExportableLayer) {
  const { fills } = layer;
  if (!hasSolidFills(fills)) {
    return calculateBaseColor();
  }
  return calculateFillColor(fills);
}

function calculateAtlasTexture(atlas: ComponentSetNode, layer: InstanceNode) {
  const texture = atlas.name;
  const sprite = layer.variantProperties?.Sprite;
  return sprite ? `${texture}/${sprite}` : "";
}

function calculateEmptyTexture() {
  return "";
}

async function calculateTexture(layer: ExportableLayer) {
  if (isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainComponent(layer);
    if (mainComponent) {
      const { parent } = mainComponent;
      if (isFigmaSceneNode(parent) && isAtlas(parent)) {
        return calculateAtlasTexture(parent, layer);
      }
    }
  }
  return calculateEmptyTexture();
}

function calculateSlice9(layer: ExportableLayer, texture?: string) {
  if (!!texture || isFigmaText(layer)) {
    return vector4(0);
  }
  return vector4(0);
}

function calculateVisible(layer: ExportableLayer, texture?: string) {
  return !!texture || isFigmaText(layer);
}

async function convertBoxVisuals(layer: BoxLayer) {
  const color = calculateColor(layer);
  const texture = await calculateTexture(layer);
  const visible = calculateVisible(layer, texture);
  const slice9 = calculateSlice9(layer, texture);
  return {
    visible,
    color,
    texture,
    slice9
  };
}

function calculateFont() {
  return config.fontFamily;
}

function calculateOutline() {
  return vector4(0);
}

function calculateShadow() {
  return vector4(0);
}

function convertTextVisuals(layer: TextLayer) {
  const color = calculateColor(layer);
  const visible = calculateVisible(layer);
  const slice9 = calculateSlice9(layer);
  const font = calculateFont();
  const outline = calculateOutline();
  const shadow = calculateShadow();
  return {
    visible,
    color,
    slice9,
    outline,
    shadow,
    font
  };

}

function injectGUINodeDefaults() {
  return {
    ...config.guiNodeDefaultValues,
  };
}

export async function convertBoxGUINodeData(layer: FrameNode | InstanceNode, parentId?: string, parentSize?: Vector4): Promise<GUINodeData> {
  const id = calculateId(layer)
  const defaults = injectGUINodeDefaults();
  const type = calculateType(layer);
  const visuals = await convertBoxVisuals(layer);
  const sizeMode = calculateSizeMode(visuals.texture);
  const transformations = convertBoxTransformations(layer, parentSize);
  const parent = convertParent(parentId);
  return {
    ...defaults,
    id,
    type,
    size_mode: sizeMode,
    ...parent,
    ...transformations,
    ...visuals,
  };
}

export function convertTextGUINodeData(layer: TextNode, parentId?: string, parentSize?: Vector4): GUINodeData {
  const id = calculateId(layer)
  const defaults = injectGUINodeDefaults();
  const type = calculateType(layer);
  const visuals = convertTextVisuals(layer);
  const sizeMode = calculateSizeMode();
  const transformations = convertTextTransformations(layer, parentSize);
  const parent = convertParent(parentId);
  const text = layer.characters;
  return {
    ...defaults,
    id,
    type,
    text,
    size_mode: sizeMode,
    ...parent,
    ...transformations,
    ...visuals,
  };
}

function calculateBackgroundColor() {
  return vector4(0);
}

function injectGUIDefaults() {
  return config.guiDefaultValues;

}

export function convertGUIData(): GUIComponentData {
  const backgroundColor = calculateBackgroundColor();
  const defaults = injectGUIDefaults();
  return {
    ...defaults,
    background_color: backgroundColor,
  };
}
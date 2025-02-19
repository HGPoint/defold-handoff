/**
 * Handles operations with Figma layers, properties and plugin data storage.
 * @packageDocumentation
 */

import { convertPaintToRGBA, isNonWhiteRGBColor, resolveBaseFill, resolveBaseTextOutline } from "utilities/color";
import { canChangeGUINodeOverridesPluginData, resolveGUINodeOverridesDataKey } from "utilities/gui";
import { absFloor, vector4 } from "utilities/math";
import { isSlice9PlaceholderLayer } from "utilities/slice9";

/**
 * Determines whether the Figma layer is a scene node.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a scene node, otherwise false.
 */
export function isFigmaSceneNode(layer: BaseNode): layer is SceneNode {
  return (
    isFigmaComponent(layer) ||
    isFigmaComponentSet(layer) ||
    isFigmaComponentInstance(layer) ||
    isFigmaFrame(layer) ||
    isFigmaText(layer) ||
    isFigmaSection(layer) 
  );
}

/**
 * Determines whether the Figma layer is the document.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is the document, otherwise false.
 */
export function isFigmaDocument(layer: BaseNode): layer is DocumentNode {
  return layer.type === "DOCUMENT";
}

/**
 * Determines whether the Figma layer is a page.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a Figma page, otherwise false.
 */
export function isFigmaPage(layer: BaseNode): layer is PageNode {
  return layer.type === "PAGE";
}

/**
 * Determines whether the Figma layer is a group.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a group, otherwise false.
 */
export function isFigmaGroup(layer: BaseNode): layer is GroupNode {
  return layer.type === "GROUP";
}

/**
 * Determines whether the Figma layer is a section.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a section, otherwise false.
 */
export function isFigmaSection(layer: BaseNode): layer is SectionNode {
  return layer.type === "SECTION";
}

/**
 * Determines whether the Figma layer is a box node.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a box node, otherwise false.
 */
export function isFigmaBox(layer: BaseNode): layer is BoxLayer {
  return isFigmaFrame(layer) || isFigmaComponentInstance(layer) || isFigmaComponent(layer);
}

/**
 * Determines whether the Figma layer is a component.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a component, otherwise false.
 */
export function isFigmaComponent(layer: BaseNode): layer is ComponentNode {
  return layer.type === "COMPONENT";
}

/**
 * Determines whether the Figma layer is a component set.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a component set, otherwise false.
 */
export function isFigmaComponentSet(layer: BaseNode): layer is ComponentSetNode {
  return layer.type === "COMPONENT_SET";
}

/**
 * Determines whether the Figma layer is a component instance.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a component instance, otherwise false.
 */
export function isFigmaComponentInstance(layer: BaseNode): layer is InstanceNode {
  return layer.type === "INSTANCE";
}

/**
 * Determines whether the Figma layer is a frame.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a frame, otherwise false.
 */
export function isFigmaFrame(layer: BaseNode): layer is FrameNode {
  return layer.type === "FRAME";
}

/**
 * Determines whether the Figma layer is a text layer.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a text layer, otherwise false.
 */
export function isFigmaText(layer: BaseNode): layer is TextNode {
  return layer.type === "TEXT";
}

/**
 * Determines whether the Figma layer is a rectangle.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a rectangle, otherwise false.
 */
export function isFigmaRectangle(layer: BaseNode): layer is RectangleNode {
  return layer.type === "RECTANGLE";
}

/**
 * Determines whether the Figma layer is a slice.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a slice, otherwise false.
 */
export function isFigmaSlice(layer: BaseNode): layer is SliceNode {
  return layer.type === "SLICE";
}

/**
 * Determines whether Figma layer type is a component type.
 * @param type - The type to check.
 * @returns True if the Figma layer type is a component type, otherwise false.
 */
export function isFigmaComponentType(figmaNodeType: NodeType) {
  return figmaNodeType === "COMPONENT";
}

/**
 * Determines whether Figma layer type is a component instance type.
 * @param type - The type to check.
 * @returns True if the Figma layer type is a component instance type, otherwise false.
 */
export function isFigmaComponentInstanceType(figmaNodeType: NodeType) {
  return figmaNodeType === "INSTANCE";
}

/**
 * Determines whether Figma layer type is a frame type.
 * @param type - The type to check.
 * @returns True if the Figma layer type is a frame type, otherwise false.
 */
export function isFigmaFrameType(figmaNodeType: NodeType) {
  return figmaNodeType === "FRAME";
}

/**
 * Determines whether Figma layer type is a section type.
 * @param type - The type to check.
 * @returns True if the Figma layer type is a section type, otherwise false.
 */
export function isFigmaSectionType(figmaNodeType: NodeType) {
  return figmaNodeType === "SECTION";
}

/**
 * Determines whether the Figma scene node has been removed.
 * @param layer - The Figma scene node to check.
 * @returns True if the Figma scene node has been removed, otherwise false.
 */
export function isFigmaRemoved(layer: SceneNode | RemovedNode): layer is RemovedNode {
  return layer.removed;
}

/**
 * Determines whether the Figma layer can have data bound to it.
 * @param layer - The Figma layer to check.
 * @returns True if the layer can have data bound to it, otherwise false.
 */
export function isLayerData(layer: BaseNode): layer is DataLayer {
  return isLayerNode(layer) || isFigmaComponentSet(layer) || isFigmaSection(layer) || isFigmaDocument(layer);
}

/**
 * Determines whether the Figma layer is exportable.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is exportable, otherwise false.
 */
export function isLayerExportable(layer: BaseNode): layer is ExportableLayer {
  return isLayerNode(layer) || isFigmaSlice(layer);
}

export function isLayerContext(layer: BaseNode): layer is ContextLayer {
  return isLayerExportable(layer) || isFigmaComponentSet(layer);
}

/**
 * Determines whether the Figma layer is a node layer.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a node layer, otherwise false.
 */
export function isLayerNode(layer: BaseNode): layer is BoxLayer | TextNode {
  return isFigmaBox(layer) || isFigmaText(layer) || isFigmaRectangle(layer);
}

/**
 * Determines whether the Figma layer is a GUI node.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a GUI node, otherwise false.
 */
export function isLayerGUINode(layer: BaseNode) {
  return hasPluginData(layer, "defoldGUINode");
}

/**
 * Determines whether the Figma layer is a game object.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a game object, otherwise false.
 */
export function isLayerGameObject(layer: BaseNode) {
  return hasPluginData(layer, "defoldGameObject");
}

/**
 * Determines whether the Figma layer is a context section.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a context section, otherwise false.
 */
export function isLayerContextSection(layer: BaseNode): layer is SectionNode {
  return isFigmaSection(layer) && hasPluginData(layer, "defoldSection");
}

/**
 * Determines whether the Figma layer is an atlas.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is an atlas, otherwise false.
 */
export function isLayerAtlas(layer: BaseNode): layer is ComponentSetNode {
  return isFigmaComponentSet(layer) && hasPluginData(layer, "defoldAtlas");
}

/**
 * Determines whether the Figma layer is a sprite.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a sprite, otherwise false.
 */
export async function isLayerSprite(layer: BaseNode): Promise<boolean> {
  if (isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainFigmaComponent(layer);
    if (mainComponent) {
      const { parent } = mainComponent;
      return !!parent && isLayerAtlas(parent);
    }
  }
  return false;
}

/**
 * Determines whether the Figma layer is a sprite holder.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer is a sprite holder, otherwise false.
 */
export async function isLayerSpriteHolder(layer: BaseNode): Promise<boolean> {
  if (isFigmaComponentInstance(layer)) {
    if (layer.children.length === 1) {
      const [child] = layer.children;
      if (!isSlice9PlaceholderLayer(child)) {
        const sameSize = layer.width === child.width && layer.height == child.height;
        return sameSize && await isLayerSprite(child);
      }
      return await isLayerSprite(child);
    }
  }
  return false;
}

export function isVisible(layer: SceneNode): boolean {
  let currentLayer: WithNull<BaseNode> = layer;
  do {
    if (!currentLayer.visible) {
      return false;
    }
    currentLayer = currentLayer.parent || null
  }
  while (currentLayer && isFigmaSceneNode(currentLayer))
  return true;
}

/**
 * Determines whether the Figma layer has a parent.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer has a parent, otherwise false.
 */
export function hasParent(layer: BaseNode): layer is SceneNode & { parent: SceneNode } {
  const { parent } = layer;
  return !!parent && isFigmaSceneNode(parent)
}

/**
 * Determines whether the Figma layer has children.
 * @param layer - The Figma layer to check.
 * @returns True if the Figma layer has children, otherwise false.
 */
export function hasChildren(layer: BoxLayer): boolean {
  return !!layer.children?.length;
}

export function hasAbsoluteRenderBounds(layer: ExportableLayer): layer is ExportableLayer & { absoluteRenderBounds: Rect } {
  return !!layer.absoluteRenderBounds;
}

export function hasAbsoluteBoundingBox(layer: ExportableLayer): layer is ExportableLayer & { absoluteBoundingBox: Rect } {
  return !!layer.absoluteBoundingBox;
}

/**
 * Determines whether there are solid fills among the fills of a Figma layer.
 * @param fills - The fills to check.
 * @returns True if there are solid fills among the fills, otherwise false.
 */
export function hasSolidVisibleFills(fills: readonly Paint[] | typeof figma.mixed) {
  return typeof fills === "object" && !!fills.length && fills.some(isVisibleSolidFill);
}

/**
 * Determines whether the fill is a visible solid fill.
 * @param fill - The fill to check.
 * @returns True if the fill is a visible solid fill, otherwise false.
 */
function isVisibleSolidFill(fill: Paint): fill is SolidPaint {
  return !!fill.visible && fill.type === "SOLID";
}

/**
 * Determines whether there are solid non-white fills among the fills of a Figma layer.
 * @param fills - The fills to check.
 * @returns True if there are solid non-white fills among the fills, otherwise false.
 */
export function hasSolidNonWhiteFills(fills: readonly Paint[] | typeof figma.mixed) {
  return typeof fills === "object" && !!fills.length && fills.some(isVisibleSolidNonWhiteFill);
}

/**
 * Determines whether the fill is a visible solid non-white fill.
 * @param fill - The fill to check.
 * @returns True if the fill is a visible solid non-white fill, otherwise false.
 */
function isVisibleSolidNonWhiteFill(fill: Paint): fill is SolidPaint {
  return isVisibleSolidFill(fill) && isNonWhiteRGBColor(fill.color);
}

function isTextAlignedRight(layer: TextNode) {
  return layer.textAlignHorizontal === "RIGHT";
}

function isTextAlignedLeft(layer: TextNode) {
  return layer.textAlignHorizontal === "LEFT"
}

function isTextAlignedTop(layer: TextNode) {
  return layer.textAlignVertical === "TOP";
}

function isTextAlignedBottom(layer: TextNode) {
  return layer.textAlignVertical === "BOTTOM";
}

/**
 * Resolves the fill color.
 * @param fills - The fills to resolve the color from.
 * @returns The resolved fill color.
 */
export function resolveFillColor(fills: readonly Paint[] | typeof figma.mixed) {
  if (Array.isArray(fills)) {
    const fill: SolidPaint | undefined = fills.find(isSolidPaint);
    if (fill) {
      return convertPaintToRGBA(fill);
    }
  }
  return resolveBaseFill();
}

/**
 * Resolves the outline color.
 * @param strokes - The strokes to resolve the color from.
 * @returns The resolved outline color.
 */
export function resolveTextOutlineColor(strokes: readonly Paint[]) {
  const stroke: SolidPaint | undefined = strokes.find(isSolidPaint);
  if (stroke) {
    return convertPaintToRGBA(stroke);
  }
  return resolveBaseTextOutline();
}

/**
 * Resolves the shadow color.
 * @param effect - The drop shadow effect to resolve the shadow color from.
 * @returns The resolved shadow color.
 */
export function resolveTextShadowColor(effect: DropShadowEffect) {
  const { color: { r, g, b, a } } = effect;
  return vector4(r, g, b, a);
}

export function resolveFontSize(layer: TextNode) {
  const { fontSize } = layer;
  if (typeof fontSize === "number") {
    return fontSize;
  }
  const firstCharacterFontSize = layer.getRangeFontSize(0, 1);
  if (typeof firstCharacterFontSize === "number") {
    return firstCharacterFontSize;
  }
  return 12;
}

/**
 * Determines whether there are solid strokes among the strokes of a Figma layer.
 * @param strokes - The strokes to check.
 * @returns True if there are solid strokes among the strokes, otherwise false.
 */
export function hasSolidStrokes(strokes: readonly Paint[] | typeof figma.mixed) {
  return typeof strokes == "object" && !!strokes.length && strokes.some(isSolidStroke);
}

/**
 * Determines whether the stroke is a solid stroke.
 * @param stroke - The stroke to check.
 * @returns True if the stroke is a solid stroke, otherwise false.
 */
function isSolidStroke(stroke: Paint): stroke is SolidPaint {
  return stroke.type === "SOLID";
}

/**
 * Determines whether the paint is a solid color.
 * @param paint - The paint to check.
 * @returns True if the paint is a solid color, otherwise false.
 */
export function isSolidPaint(paint: Paint): paint is SolidPaint {
  return paint.type === "SOLID";
}

/**
 * Determines whether the effect is a drop shadow effect.
 * @param effect - The effect to check.
 * @returns True if the effect is a drop shadow effect, otherwise false.
 */
export function isShadowEffect(effect: Effect): effect is DropShadowEffect {
  return effect.type === "DROP_SHADOW";
}

/**
 * Determines whether the font name is provided.
 * @param fontName - The font name to check.
 * @returns True if the font name is provided, otherwise false.
 */
export function hasFont(fontName: FontName | typeof figma.mixed): fontName is FontName {
  return typeof fontName === "object" && !!fontName.family;
}

/**
 * Determines whether the variant property has changed.
 * @param change - The property change to check.
 * @returns True if the variant property has changed, otherwise false.
 */
export function hasVariantPropertyChanged(change: PropertyChange) {
  return hasPropertyChanged(change, "variant");
}

/**
 * Determines whether the name property has changed.
 * @param change - The property change to check.
 * @returns True if the name property has changed, otherwise false.
 */
export function hasNamePropertyChanged(change: PropertyChange) {
  return hasPropertyChanged(change, "name");
}

/**
 * Determines whether the property has changed.
 * @param change - The property change to check.
 * @param property - The property to check.
 * @returns True if the property has changed, otherwise false.
 */
function hasPropertyChanged(change: PropertyChange, property: NodeChangePropertyExtended) {
  return change.properties.some(changeProperty => changeProperty === property);
}

/**
 * Determines whether width or height properties have changed.
 * @param change - The property change to check.
 * @returns True if width or height properties have changed, otherwise false.
 */
export function hasSizePropertyChanged(change: PropertyChange) {
  return hasPropertyChanged(change, "width") || hasPropertyChanged(change, "height");
}

/**
 * Determines whether the document change is a property change.
 * @param change - The document change to check.
 * @returns True if the document change is a property change, otherwise false.
 */
export function isDocumentPropertyChange(change: DocumentChange): change is PropertyChange {
  return change.type === "PROPERTY_CHANGE";
}

/**
 * Determines whether the document change is a delete change.
 * @param change - The document change to check.
 * @returns True if the document change is a delete change, otherwise false.
 */
export function isDocumentDeleteChange(change: DocumentChange): change is DeleteChange {
  return change.type === "DELETE";
} 

/**
 * Determines whether two component properties are equal. Text properties are always considered equal.
 * @param property1 - The first component property to compare.
 * @param property2 - The second component property to compare.
 * @returns True if the component properties are equal, otherwise false.
 */
export function areEqualComponentProperties(property1: ComponentProperties[keyof ComponentProperties], property2: ComponentProperties[keyof ComponentProperties]) {
  return (property1.type == "TEXT" && property2.type == "TEXT") || property1.value === property2.value;
}

/**
 * Determines whether two sets of component properties are equal.
 * @param properties1 - The first set of component properties to compare.
 * @param properties2 - The second set of component properties to compare.
 * @returns True if the component property sets are equal, otherwise false.
 */
export function areEqualComponentPropertySets(properties1: ComponentProperties, properties2: ComponentProperties) {
  if (properties1 == null && properties1 === properties2) {
    return true;
  }
  if (properties1 && properties2) {
    return Object.keys(properties1).every(key => areEqualComponentProperties(properties1[key], properties2[key]));
  }
  return false;
}

/**
 * Determines if the two exposed component instances are equal by comparing their properties.
 * @param exposedInstance1 - The first exposed component instance to compare.
 * @param exposedInstance2 - The second exposed component instance to compare.
 * @returns True if the exposed component instances are equal, otherwise false.
 */
export function haveEqualExposedComponentProperties(exposedInstance1: InstanceNode, exposedInstance2: InstanceNode) {
  return (
    (!isVisible(exposedInstance1) && !isVisible(exposedInstance2)) ||
    (
      isVisible(exposedInstance1) &&
      isVisible(exposedInstance2) &&
      areEqualComponentPropertySets(exposedInstance1.componentProperties, exposedInstance2.componentProperties)
    )
  )
}

/**
 * Determines if the two sets of exposed component instances are equal by comparing their properties.
 * @param exposedInstances1 - The first set of exposed component instances to compare.
 * @param exposedInstances2 - The second set of exposed component instances to compare.
 * @returns True if the exposed component instances are equal, otherwise false.
 */
export function equalExposedComponentProperties(exposedInstances1: InstanceNode[], exposedInstances2: InstanceNode[]) {
  if ((exposedInstances1 == null && exposedInstances1 === exposedInstances2) || (exposedInstances1.length === 0 && exposedInstances1.length === exposedInstances2.length)) {
    return true;
  }
  if (exposedInstances1 && exposedInstances2) {
    return exposedInstances1.every((instance1, index) => haveEqualExposedComponentProperties(instance1, exposedInstances2[index]));
  }
  return false;
}

/**
 * Retrieves the bound plugin data from the Figma layer.
 * @param layer - The Figma layer to retrieve plugin data from.
 * @param key - The key of the plugin data to retrieve.
 * @returns The bound plugin data if found, otherwise null.
 */
export function getPluginData<T extends PluginDataKey>(layer: DataLayer, key: T): WithNull<NonNullable<PluginData[T]>> {
  const value = layer.getPluginData(key);
  if (value) {
    const data: PluginData[T] = JSON.parse(value);
    if (data) {
      return data;
    }
  }
  return null;
}

/**
 * Determines whether the Figma layer has plugin data bound to it. 
 * @param layer - The Figma layer to check.
 * @param key - The key of the plugin data to check.
 * @returns True if the Figma layer has plugin data bound to it, otherwise false.
 */
export function hasPluginData(layer: BaseNode, key: PluginDataKey): layer is DataLayer {
  return !!layer.getPluginData(key);
}

/**
 * Determines whether the Figma layer has GUI node plugin data bound to it.
 * @param data - The plugin data to check.
 * @returns True if the Figma layer has GUI node plugin data bound to it, otherwise false.
 */
function hasGUINodePluginData(data: PluginData): data is PluginData & { defoldGUINode: PluginGUINodeData } {
  return "defoldGUINode" in data && !!data.defoldGUINode;
}

/**
 * Sets the plugin data for the Figma layer.
 * @async
 * @param layer - The Figma layer to set plugin data for.
 * @param data - The plugin data to set.
 */
export async function setPluginData(layer: DataLayer, data: PluginData) {
  const entries = Object.entries(data) as [PluginDataKey, PluginData[PluginDataKey]][];
  entries.forEach(([key, value]) => { pluginDataSetter(layer, key, value); });
  trySetOverridesPluginData(layer, data);
}

/**
 * Setter function for setting plugin data for the Figma layer.
 * @param layer - The Figma layer to set plugin data for.
 * @param data - The plugin data to set.
 */
function pluginDataSetter<TKey extends PluginDataKey>(layer: DataLayer, key: TKey, value: PluginData[TKey]) {
  layer.setPluginData(key, JSON.stringify(value))
}

/**
 * Attempts to set the overrides plugin data for the Figma layer.
 * @param layer - The Figma layer to set the overrides plugin data for.
 * @param data - The plugin data to set as overrides.
 */
function trySetOverridesPluginData(layer: DataLayer, data: PluginData) {
  if (hasGUINodePluginData(data)) {
    const { defoldGUINode } = data;
    trySetGUINodeOverridesPluginData(layer, defoldGUINode);
  }
}

/**
 * Attempts to set the GUI node overrides plugin data for the Figma layer.
 * @param layer - The Figma layer to set the GUI node overrides plugin data for.
 * @param data - The plugin data to set as GUI node overrides.
 */
async function trySetGUINodeOverridesPluginData(layer: DataLayer, data: PluginGUINodeData) {
  if (await canChangeGUINodeOverridesPluginData(layer)) {
    const { root: document } = figma;
    const { id } = layer;
    const key = resolveGUINodeOverridesDataKey(id);
    pluginDataSetter(document, key, data);
  }
}

/**
 * Removes the bound plugin data from the Figma layer.
 * @param layer - The Figma layer to remove bound plugin data from.
 * @param key - The key of the plugin data to remove.
 */
export function removePluginData<T extends PluginDataKey>(layer: DataLayer, key: T) {
  if (hasPluginData(layer, key)) {
    layer.setPluginData(key, "");
  }
}

/**
 * Resizes the parent layer to fit the child layer.
 * @param parent - The parent layer to resize.
 * @param layer - The layer to fit the parent to.
 */
export function fitLayerToChildLayer(parent: BoxLayer, layer: ExportableLayer) {
  const { width, height, x, y } = layer;
  parent.resizeWithoutConstraints(width, height);
  parent.x += x;
  parent.y += y;
  layer.x = 0;
  layer.y = 0;
  for (const child of parent.children) {
    if (child != layer) {
      child.x -= x;
      child.y -= y;
    }
  }
}

/**
 * Resizes the child layer to fit the parent layer.
 * @param parent - The parent layer to fit the child to.
 * @param layer - The child layer to resize.
 */
export function fitLayerToParentLayer(parent: BoxLayer, layer: BoxLayer) {
  const { width, height } = parent;
  layer.resizeWithoutConstraints(width, height);
  layer.x = 0;
  layer.y = 0;
}

/**
 * Finds the main component of a Figma instance node.
 * @param layer - The Figma instance node to find the main component for.
 * @returns The main component of the Figma instance node.
 */
export async function findMainFigmaComponent(layer: InstanceNode) {
  return await layer.getMainComponentAsync();
}

/**
 * Finds the closest Figma component instance in the parent hierarchy.
 * @param layer - The Figma layer to find the closest component instance for.
 * @returns The closest Figma component instance.
 */
export function findClosestFigmaComponentInstance(layer: SceneNode): WithNull<InstanceNode> {
  let currentLayer: WithNull<BaseNode> = layer;
  do {
    if (isFigmaComponentInstance(currentLayer)) {
      return currentLayer;
    }
    currentLayer = currentLayer.parent || null;
  }
  while (currentLayer && isFigmaSceneNode(currentLayer))
  return null;
}

/**
 * Finds the reflection of the Figma layer in the Figma component from the Figma instance node.
 * @param component - The Figma component to find the reflection in.
 * @param layer - The Figma layer to find the reflection for.
 * @returns The reflection of the Figma layer in the Figma component.
 */
export function findFigmaLayerReflection(component: ComponentNode, layer: SceneNode): WithNull<SceneNode> {
  const { id } = layer;
  const { children } = component;
  if (!children || !children.length) {
    return null;
  }
  const reflection = children.find((child) => figmaLayerReflectionChecker(child, id));
  if (reflection) {
    return reflection;
  }
  return null;
}

function figmaLayerReflectionChecker(layer: SceneNode, id: string) {
  return id.includes(`;${layer.id}`)
}

/**
 * Attempts to update the name of the Figma layer.
 * @param layer - The Figma layer to update the name for.
 * @param name - The new name to set for the Figma layer.
 */
export function tryUpdateFigmaLayerName(layer: ExportableLayer, name?: string) {
  if (!!name && layer.name !== name) {
    layer.name = name;
  }
}

/**
 * Selects the Figma layers.
 * @param layers - The Figma layers to select.
 */
export function selectFigmaLayers(layers: SceneNode[], dontFocus?: boolean) {
  figma.currentPage.selection = layers;
  if (!dontFocus) {
    figma.viewport.scrollAndZoomIntoView(layers);
  }
}

/**
 * Selects the Figma layer.
 * @param layer - The Figma layer to select.
 */
export function selectFigmaLayer(layer: SceneNode, dontFocus?: boolean) {
  selectFigmaLayers([layer], dontFocus);
}

export function calculateTextSpriteAdjustment(layer: TextNode): Vector4 {
  if (hasAbsoluteRenderBounds(layer) && hasAbsoluteBoundingBox(layer)) {
    const { absoluteBoundingBox, absoluteRenderBounds } = layer;
    const { x: boundingBoxX, y: boundingBoxY, width: boundingBoxWidth, height: boundingBoxHeight } = absoluteBoundingBox;
    const { x: renderBoundsX, y: renderBoundsY, width: renderBoundsWidth, height: renderBoundsHeight } = absoluteRenderBounds;
    const leftSpace = Math.ceil(renderBoundsX) - boundingBoxX;
    const rightSpace = (boundingBoxX + boundingBoxWidth) - (Math.ceil(renderBoundsX) + Math.ceil(renderBoundsWidth))
    const topSpace = Math.ceil(renderBoundsY) - boundingBoxY;
    const bottomSpace = (boundingBoxY + boundingBoxHeight) - (Math.ceil(renderBoundsY) + Math.ceil(renderBoundsHeight))
    const x = calculateTextSpriteHorizontalAdjustmentShift(layer, leftSpace, rightSpace)
    const y = calculateTextSpriteVerticalAdjustmentShift(layer, topSpace, bottomSpace)
    return vector4(x, y, 0, 0)
  }
  return vector4(0);
}

function calculateTextSpriteHorizontalAdjustmentShift(layer: TextNode, leftSpace: number, rightSpace: number) {
  if (isTextAlignedRight(layer)) {
    return -absFloor(rightSpace);
  }
  if (isTextAlignedLeft(layer)) {
    return absFloor(leftSpace);
  }
  const shift = (leftSpace + rightSpace) / 2 - rightSpace;
  return absFloor(shift);
}

function calculateTextSpriteVerticalAdjustmentShift(layer: TextNode, topSpace: number, bottomSpace: number) {
  if (isTextAlignedTop(layer)) {
    return -absFloor(topSpace);
  }
  if (isTextAlignedBottom(layer)) {
    return absFloor(bottomSpace);
  }
  const shift = (topSpace + bottomSpace) / 2 - bottomSpace;
  return absFloor(shift);
}

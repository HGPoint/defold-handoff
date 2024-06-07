/**
 * Utility module for handling the work with Figma layers and properties.
 * @packageDocumentation
 */

import { nonWhiteRGB } from "utilities/color"

/**
 * Checks if a layer is a Figma scene node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a Figma scene node, otherwise false.
 */
export function isFigmaSceneNode(layer: BaseNode | null): layer is SceneNode {
  return !!layer && (
    isFigmaComponent(layer) ||
    isFigmaComponentSet(layer) ||
    isFigmaComponentInstance(layer) ||
    isFigmaFrame(layer) ||
    isFigmaText(layer) ||
    isFigmaSection(layer) 
  );
}

/**
 * Checks if a Figma scene node has been removed from the canvas.
 * @param layer - The Figma scene node to check.
 * @returns True if the scene node has been removed, otherwise false.
 */
export function isFigmaRemoved(layer: SceneNode): boolean {
  return layer.removed;
}

/**
 * Checks if a layer is a Figma group node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a Figma group node, otherwise false.
 */
export function isFigmaGroup(layer: BaseNode): layer is GroupNode {
  return layer.type === "GROUP";
}

/**
 * Checks if a layer is a Figma section node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a Figma section node, otherwise false.
 */
export function isFigmaSection(layer: BaseNode): layer is SectionNode {
  return layer.type === "SECTION";
}

/**
 * Checks if a layer is a Figma page.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a Figma page, otherwise false.
 */
export function isFigmaPage(layer: BaseNode): layer is PageNode {
  return layer.type === "PAGE";
}

/**
 * Checks if a layer is a Figma component node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a Figma component node, otherwise false.
 */
export function isFigmaComponent(layer: BaseNode): layer is ComponentNode {
  return layer.type === "COMPONENT";
}

/**
 * Checks if a layer is a Figma component set node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a Figma component set node, otherwise false.
 */
export function isFigmaComponentSet(layer: BaseNode): layer is ComponentSetNode {
  return layer.type === "COMPONENT_SET";
}

/**
 * Checks if a layer is a Figma component instance node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a Figma component instance node, otherwise false.
 */
export function isFigmaComponentInstance(layer: BaseNode): layer is InstanceNode {
  return layer.type === "INSTANCE";
}

/**
 * Checks if a layer is a Figma frame node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a Figma frame node, otherwise false.
 */
export function isFigmaFrame(layer: BaseNode): layer is FrameNode {
  return layer.type === "FRAME";
}

/**
 * Checks if a layer is a Figma text node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a Figma text node, otherwise false.
 */
export function isFigmaText(layer: BaseNode): layer is TextNode {
  return layer.type === "TEXT";
}

/**
 * Checks if a layer is a (Defold) box node (either a frame or a component instance).
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a Figma box node, otherwise false.
 */
export function isFigmaBox(layer: BaseNode): layer is (FrameNode | InstanceNode) {
  return isFigmaFrame(layer) || isFigmaComponentInstance(layer);
}

/**
 * Checks if a layer is exportable (either a (Defold) box node or a Figma text node).
 * @param layer - The Figma layer to check.
 * @returns True if the layer is exportable, otherwise false.
 */
export function isExportable(layer: BaseNode): layer is ExportableLayer {
  return isFigmaBox(layer) || isFigmaText(layer);
}

/**
 * Checks if a Figma layer has the specified plugin data indicating it's a Defold GUI node.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is a GUI node, otherwise false.
 */
export function isGUINode(layer: SceneNode) {
  return !!getPluginData(layer, "defoldGUINode");
}

/**
 * Checks if a Figma layer has the specified plugin data indicating it's a Defold atlas.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is an atlas, otherwise false.
 */
export function isAtlas(layer: SceneNode): layer is ComponentSetNode {
  return isFigmaComponentSet(layer) && !!getPluginData(layer, "defoldAtlas");
}

/**
 * Checks if a Figma layer has the specified plugin data indicating it's a Defold atlas section.
 * @param layer - The Figma layer to check.
 * @returns True if the layer is an atlas section, otherwise false.
 */
export function isAtlasSection(layer: SceneNode): layer is SectionNode {
  return isFigmaSection(layer) && !!getPluginData(layer, "defoldSection");
}

/**
 * Checks if a Figma layer is an atlas sprite (a component instance of an atlas component).
 * @param layer - The Figma layer to check.
 * @returns True if the layer is an atlas sprite, otherwise false.
 */
export async function isAtlasSprite(layer: SceneNode): Promise<boolean> {
  if (isFigmaComponentInstance(layer)) {
    const mainComponent = await findMainComponent(layer);
    if (mainComponent) {
      const { parent } = mainComponent;
      return isFigmaSceneNode(parent) && isAtlas(parent);
    }
  }
  return false;
}

/**
 * Checks if a layer has children.
 * @param layer - The Figma layer to check.
 * @returns True if the layer has children, otherwise false.
 */
export function hasChildren(layer: BoxLayer): boolean {
  return !!layer.children?.length;
}

/**
 * Checks if fills contain solid colors.
 * @param fills - The fills to check.
 * @returns True if the fills contain solid colors, otherwise false.
 */
export function hasSolidFills(fills: readonly Paint[] | typeof figma.mixed) {
  return typeof fills === "object" && !!fills.length && fills.some(fill => fill.visible && fill.type === "SOLID");
}

/**
 * Checks if fills contain solid non-default colors.
 * @param fills - The fills to check.
 * @returns True if the fills contain solid non-default colors, otherwise false.
 */
export function hasSolidVisibleFills(fills: readonly Paint[] | typeof figma.mixed) {
  return typeof fills === "object" && !!fills.length && fills.some(fill => fill.visible && fill.type === "SOLID" && nonWhiteRGB(fill.color));
}

/**
 * Checks if strokes contain solid colors.
 * @param strokes - The strokes to check.
 * @returns True if the strokes contain solid colors, otherwise false.
 */
export function hasSolidStrokes(strokes: readonly Paint[] | typeof figma.mixed) {
  return typeof strokes == "object" && !!strokes.length && strokes.some(stroke => stroke.type === "SOLID");
}

/**
 * Checks if a paint is a solid color.
 * @param paint - The paint to check.
 * @returns True if the paint is a solid color, otherwise false.
 */
export function isSolidPaint(paint: Paint): paint is SolidPaint {
  return paint.type === "SOLID";
}

/**
 * Checks if an effect is a drop shadow effect.
 * @param effect - The effect to check.
 * @returns True if the effect is a drop shadow effect, otherwise false.
 */
export function isShadowEffect(effect: Effect): effect is DropShadowEffect {
  return effect.type === "DROP_SHADOW";
}

/**
 * Checks if a font name is provided.
 * @param fontName - The font name to check.
 * @returns True if the font name is provided, otherwise false.
 */
export function hasFont(fontName: FontName | typeof figma.mixed): fontName is FontName {
  return typeof fontName === "object" && !!fontName.family;
}

/**
 * Checks a particular property has changed.  
 * @param change - The document change to check.
 * @param property - The property to check.
 * @returns True if the property has changed, otherwise false
 */
function hasPropertyChange(change: PropertyChange, property: NodeChangePropertyExtended) {
  return change.properties.some(prop => prop === property);
}

/**
 * Checks if a variant property has changed.
 * @param change - The document change to check.
 * @returns True if the variant property has changed, otherwise false.
 */
export function hasVariantPropertyChanged(change: PropertyChange) {
  return hasPropertyChange(change, "variant");
}

/**
 * Checks if a name property has changed.
 * @param change - The document change to check.
 * @returns True if the name property has changed, otherwise false.
 */
export function hasNamePropertyChanged(change: PropertyChange) {
  return hasPropertyChange(change, "name");
}

/**
 * Checks if a particular document change is a property change.
 * @param change - The document change to check.
 * @returns True if the document change is a property change, otherwise false.
 */
export function isPropertyChange(change: DocumentChange): change is PropertyChange {
  return change.type === "PROPERTY_CHANGE";
}

/**
 * Finds the main component of a Figma instance node.
 * @param layer - The Figma instance node to find the main component for.
 * @returns A promise that resolves with the main component if found, otherwise null.
 */
export async function findMainComponent(layer: InstanceNode) {
  return await layer.getMainComponentAsync();
}

/**
 * Tries to update the name of a Figma layer if a new name is provided.
 * @param layer - The Figma layer to update the name for.
 * @param name - The new name for the layer.
 */
export function tryUpdateLayerName(layer: SceneNode, name?: string) {
  if (!!name && layer.name !== name) {
    layer.name = name;
  }
}

/**
 * Sets a particular type of plugin data for a Figma layer.
 * @param layer - The Figma layer to set plugin data for.
 * @param data - The plugin data to set.
 */
function pluginDataSetter(key: PluginDataKey, value: PluginData[PluginDataKey], layer: BaseNode) {
  layer.setPluginData(key, JSON.stringify(value))
}

/**
 * Sets plugin data for a Figma layer.
 * @param layer - The Figma layer to set plugin data for.
 * @param data - The plugin data to set.
 */
export function setPluginData(layer: BaseNode, data: PluginData) {
  Object.entries(data).forEach(([key, value]) => { pluginDataSetter(key as PluginDataKey, value, layer); });
}

/**
 * Retrieves plugin data from a Figma layer.
 * @param layer - The Figma layer to retrieve plugin data from.
 * @param key - The key of the plugin data to retrieve.
 * @returns The plugin data associated with the specified key, or null if not found.
 */
export function getPluginData<T extends PluginDataKey>(layer: BaseNode, key: T): PluginData[T] | null {
  const value = layer.getPluginData(key);
  if (value) {
    const data: PluginData[T] = JSON.parse(value);
    return data;
  }
  return null;
}

/**
 * Removes plugin data from a Figma layer.
 * @param layer - The Figma layer to remove plugin data from.
 * @param key - The key of the plugin data to remove.
 */
export function removePluginData<T extends PluginDataKey>(layer: SceneNode, key: T) {
  layer.setPluginData(key, "");
}

/**
 * Checks if values of two properties are equal. Text values are always considered equal.
 * @param property1 - The first component property to compare.
 * @param property2 - The second component property to compare.
 * @returns True if the component properties are equal, otherwise false.
 */
export function equalComponentProperty(property1: ComponentProperties[keyof ComponentProperties], property2: ComponentProperties[keyof ComponentProperties]) {
  return (property1.type == "TEXT" && property2.type == "TEXT") || property1.value === property2.value;
}

/**
 * Checks if two sets of component properties are equal.
 * @param properties1 - The first set of component properties to compare.
 * @param properties2 - The second set of component properties to compare.
 * @returns True if the component properties are equal, otherwise false.
 */
export function equalComponentProperties(properties1: ComponentProperties, properties2: ComponentProperties) {
  if (properties1 == null && properties1 === properties2) {
    return true;
  }
  if (properties1 && properties2) {
    return Object.keys(properties1).every(key => equalComponentProperty(properties1[key], properties2[key]));
  }
  return false;
}

/**
 * Checks if two exposed component instances have equal properties.
 * @param instance1 - The first exposed component instance to compare.
 * @param instance2 - The second exposed component instance to compare.
 * @returns True if the exposed component instances have equal properties, otherwise false.
 */
export function equalExposedComponentProperty(instance1: InstanceNode, instance2: InstanceNode) {
  return (
    (!instance1.visible && !instance2.visible) ||
    (
      instance1.visible &&
      instance2.visible &&
      equalComponentProperties(instance1.componentProperties, instance2.componentProperties)
    )
  )
}

/**
 * Checks if two sets of exposed component instances have equal properties.
 * @param exposedInstances1 - The first set of exposed component instances to compare.
 * @param exposedInstances2 - The second set of exposed component instances to compare.
 * @returns True if the exposed component instances have equal properties, otherwise false.
 */
export function equalExposedComponentProperties(exposedInstances1: InstanceNode[], exposedInstances2: InstanceNode[]) {
  if ((exposedInstances1 == null && exposedInstances1 === exposedInstances2) || (exposedInstances1.length === 0 && exposedInstances1.length === exposedInstances2.length)) {
    return true;
  }
  if (exposedInstances1 && exposedInstances2) {
    return exposedInstances1.every((instance1, index) => equalExposedComponentProperty(instance1, exposedInstances2[index]));
  }
  return false;
}
 
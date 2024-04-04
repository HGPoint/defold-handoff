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

export function isFigmaGroup(layer: BaseNode): layer is GroupNode {
  return layer.type === "GROUP";
}

export function isFigmaSection(layer: BaseNode): layer is SectionNode {
  return layer.type === "SECTION";
}

export function isFigmaRemoved(layer: SceneNode): boolean {
  return layer.removed;
}

export function isFigmaComponent(layer: BaseNode): layer is ComponentNode {
  return layer.type === "COMPONENT";
}

export function isFigmaComponentSet(layer: BaseNode): layer is ComponentSetNode {
  return layer.type === "COMPONENT_SET";
}

export function isFigmaComponentInstance(layer: BaseNode): layer is InstanceNode {
  return layer.type === "INSTANCE";
}

export function isFigmaFrame(layer: BaseNode): layer is FrameNode {
  return layer.type === "FRAME";
}

export function isFigmaText(layer: BaseNode): layer is TextNode {
  return layer.type === "TEXT";
}

export function isFigmaBox(layer: BaseNode): layer is (FrameNode | InstanceNode) {
  return isFigmaFrame(layer) || isFigmaComponentInstance(layer);
}

export function isExportable(layer: BaseNode): layer is ExportableLayer {
  return isFigmaBox(layer) || isFigmaText(layer);
}

export function isGUINode(layer: SceneNode) {
  return !!getPluginData(layer, "defoldGUINode");
}

export function isAtlas(layer: SceneNode): layer is ComponentSetNode {
  return isFigmaComponentSet(layer) && !!getPluginData(layer, "defoldAtlas");
}

export function isAtlasSection(layer: SceneNode): layer is SectionNode {
  return isFigmaSection(layer) && !!getPluginData(layer, "defoldSection");
}

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

export function hasChildren(layer: BoxLayer): boolean {
  return !!layer.children?.length;
}

export function hasSolidFills(fills: readonly Paint[] | typeof figma.mixed) {
  return Array.isArray(fills) && !!fills.length && fills.some(fill => fill.type === "SOLID");
}

export function hasSolidStrokes(strokes: readonly Paint[] | typeof figma.mixed) {
  return Array.isArray(strokes) && !!strokes.length && strokes.some(stroke => stroke.type === "SOLID");
}

export function isSolidPaint(paint: Paint): paint is SolidPaint {
  return paint.type === "SOLID";
}

export function isShadowEffect(effect: Effect): effect is DropShadowEffect {
  return effect.type === "DROP_SHADOW";
}

export function hasFont(fontName: FontName | typeof figma.mixed): fontName is FontName {
  return typeof fontName === "object" && !!fontName.family;
}

export function hasVariantPropertyChanged(event: DocumentChangeEvent) {
  return event.documentChanges.some(change => change.type === "PROPERTY_CHANGE" && change.properties.some(property => (property as NodeChangePropertyExtended) === "variant"))
}

export async function findMainComponent(layer: InstanceNode) {
  return await layer.getMainComponentAsync();
}

export function tryUpdateLayerName(layer: SceneNode, name?: string) {
  if (!!name && layer.name !== name) {
    layer.name = name;
  }
}

function pluginDataSetter(key: PluginDataKey, value: PluginData[PluginDataKey], layer: BaseNode) {
  layer.setPluginData(key, JSON.stringify(value))
}

export function setPluginData(layer: BaseNode, data: PluginData) {
  Object.entries(data).forEach(([key, value]) => { pluginDataSetter(key as PluginDataKey, value, layer); });
}

export function getPluginData<T extends PluginDataKey>(layer: BaseNode, key: T): PluginData[T] {
  const value = layer.getPluginData(key);
  if (value) {
    return JSON.parse(value);
  }
  return null;
}

export function removePluginData<T extends PluginDataKey>(layer: SceneNode, key: T) {
  layer.setPluginData(key, "");
}

export function equalComponentProperty(property1: ComponentProperties[keyof ComponentProperties], property2: ComponentProperties[keyof ComponentProperties]) {
  return (property1.type == "TEXT" && property2.type == "TEXT") || property1.value === property2.value;
}

export function equalComponentProperties(properties1: ComponentProperties, properties2: ComponentProperties) {
  if (properties1 == null && properties1 === properties2) {
    return true;
  }
  if (properties1 && properties2) {
    return Object.keys(properties1).every(key => equalComponentProperty(properties1[key], properties2[key]));
  }
  return false;
}

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

export function equalExposedComponentProperties(exposedInstances1: InstanceNode[], exposedInstances2: InstanceNode[]) {
  if ((exposedInstances1 == null && exposedInstances1 === exposedInstances2) || (exposedInstances1.length === 0 && exposedInstances1.length === exposedInstances2.length)) {
    return true;
  }
  if (exposedInstances1 && exposedInstances2) {
    return exposedInstances1.every((instance1, index) => equalExposedComponentProperty(instance1, exposedInstances2[index]));
  }
  return false;
}
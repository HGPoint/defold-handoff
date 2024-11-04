import { isVector4 } from "utilities/math";
import { isSpriteGameObjectType, isLabelGameObjectType } from "utilities/gameObject";
import { generateAtlasPath } from "utilities/path";
import { propertySerializer } from "utilities/dataSerializers";
import { indentLines, wrapLinesInQuotes, processDataLines } from "utilities/proto";

const DATA_PROPERTIES = [
  "size",
  "text",
  "color",
  "outline",
  "shadow",
  "text_leading",
  "text_tracking",
  "image",
  "default_animation",
  "size_mode",
  "slice9",
  "pivot",
  "blend_mode",
  "material",
];

const EXCLUDED_PROPERTY_KEYS = [
  "exclude",
  "skip",
  "path",
  "inferred",
  "implied_game_object",
  "exportable_layer",
  "exportable_layer_id",
  "exportable_layer_name",
  "figma_position",
  "figma_node_type",
  "components"
];

function isPropertyKeyType(property: keyof GameObjectData) {
  return property === "type";
}

function isPropertyType(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is GameObjectType {
  return property === "type" && (value === "TYPE_SPRITE" || value === "TYPE_LABEL" || value === "TYPE_EMPTY");
}

function isPropertyScale(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is Vector4 {
  return property === "scale" && isVector4(value);
}

function isPropertyPosition(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is Vector4 {
  return property === "position" && isVector4(value);
}

function isPropertyImage(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is string {
  return property === "image" && typeof value === "string";
}

function isPropertyMaterial(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is string {
  return property === "material" && typeof value === "string";
}

function isPropertyTextLeading(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is number {
  return property === "text_leading" && typeof value === "number";
}

function isPropertyTextTracking(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is number {
  return property === "text_tracking" && typeof value === "number";
}

function isPropertyChildren(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is string[] {
  return property === "children" && Array.isArray(value);
}

function isBaseProperty(key: keyof GameObjectData) {
  return EXCLUDED_PROPERTY_KEYS.includes(key) || DATA_PROPERTIES.includes(key);
}

function isComponentProperty(key: keyof GameObjectData) {
  return EXCLUDED_PROPERTY_KEYS.includes(key) || !DATA_PROPERTIES.includes(key);
}

function serializeSpriteTypeProperty(): string {
  return `type: "sprite"\n`;
}

function serializeLabelTypeProperty(): string {
  return `type: "label"\n`;
}

function serializeScale3Property(value: Vector4): string {
  return `scale3 {\n  x: ${value.x}\n  y: ${value.y}\n  z: ${value.z}\n}\n`;
}

function serializeScaleProperty(value: Vector4): string {
  return `scale {\n  x: ${value.x}\n  y: ${value.y}\n  z: ${value.z}\n}\n`;
}

function serializePositionProperty(value: Vector4): string {
  return `position {\n  x: ${value.x}\n  y: ${value.y}\n  z: ${value.z}\n}\n`;
}

function serializeImageProperty(value: string): string {
  const atlasPath = generateAtlasPath(value);
  return `textures {\n  sampler: "texture_sampler"\n  texture: "${atlasPath}"\n}\n`;
}

function serializeMaterialProperty(): string {
  return ""
}

function serializeTextLeadingProperty(value: number): string {
  return `leading: ${value}\n`;
}

function serializeTextTrackingProperty(value: number): string {
  return `tracking: ${value}\n`;
}

function serializeChildrenProperty(value: string[]): string {
  return value.map((child) => `children: "${child}"\n`).join("");
}

function basePropertiesFilter(baseProperties: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>, [key, value]: [keyof GameObjectData, GameObjectData[keyof GameObjectData]]) {
  if (isBaseProperty(key)) {
    return baseProperties;
  }
  baseProperties[key] = value;
  return baseProperties;
}

function dataPropertiesFilter(dataProperties: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>, [key, value]: [keyof GameObjectData, GameObjectData[keyof GameObjectData]]) {
  if (isComponentProperty(key)) {
    return dataProperties;
  }
  dataProperties[key] = value;
  return dataProperties;
}

function filterBaseProperties(gameObjectData: GameObjectData): Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>> {
  const gameObjectProperties = Object.entries(gameObjectData) as [keyof GameObjectData, GameObjectData[keyof GameObjectData]][];
  return gameObjectProperties.reduce(basePropertiesFilter, {});
}

function filterDataProperties(gameObjectData: GameObjectData): Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>> {
  const gameObjectProperties = Object.entries(gameObjectData) as [keyof GameObjectData, GameObjectData[keyof GameObjectData]][];
  return gameObjectProperties.reduce(dataPropertiesFilter, {});
}

function embeddedPropertiesFilter(embeddedProperties: { base: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>, data: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>> }[], embeddedComponent: GameObjectData) {
  const base = filterBaseProperties(embeddedComponent);
  const data = filterDataProperties(embeddedComponent);
  embeddedProperties.push({ base, data });
  return embeddedProperties;
}

function filterEmbeddedProperties(gameObjectData: GameObjectData) {
  if (gameObjectData.components) {
    return gameObjectData.components.reduce(embeddedPropertiesFilter, []);
  }
  return [];
}

function serializeBaseProperties(baseProperties: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>) {
  const basedPropertyEntries = Object.entries(baseProperties) as [keyof GameObjectData, GameObjectData[keyof GameObjectData]][];
  return basedPropertyEntries.reduce(gameObjectPropertySerializer, "");
}

function serializeComponentProperties(componentProperties: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>) {
  const componentPropertiesEntries = Object.entries(componentProperties) as [keyof GameObjectData, GameObjectData[keyof GameObjectData]][];
  return componentPropertiesEntries.reduce(gameComponentPropertySerializer, "");
}

function serializeEmbeddedProperties(embeddedProperties: { base: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>, data: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>> }[]) {
  if (embeddedProperties && embeddedProperties.length) {
    const serializedEmbeddedPropertySets = embeddedProperties.map((embeddedComponentProperties) => {
      const serializedBaseEmbeddedProperties = serializeComponentProperties(embeddedComponentProperties.base);
      let serializedDataEmbeddedProperties = serializeComponentProperties(embeddedComponentProperties.data);
      if (embeddedComponentProperties.base.type && isPropertyType("type", embeddedComponentProperties.base.type) && isLabelGameObjectType(embeddedComponentProperties.base.type)) {
        serializedDataEmbeddedProperties += `\nfont: "/builtins/fonts/default.font"\nmaterial: "/builtins/fonts/label-df.material"`;
      }
      const processedBaseEmbeddedProperties = processDataLines(serializedBaseEmbeddedProperties);
      const processedDataEmbeddedProperties = processDataLines(serializedDataEmbeddedProperties, 2);
      return embeddedComponentSerializer(processedBaseEmbeddedProperties, processedDataEmbeddedProperties);
    });
    return serializedEmbeddedPropertySets.join("\\n\n");
  }
  return "";
}

function gameObjectPropertySerializer(serializedProperties: string, [property, value]: [keyof GameObjectData, GameObjectData[keyof GameObjectData]]): string {
  if (isPropertyKeyType(property)) {
    return serializedProperties;
  }
  if (isPropertyScale(property, value)) {
    const serializedScale = serializeScale3Property(value);
    return `${serializedProperties}${serializedScale}`;
  }
  if (isPropertyPosition(property, value)) {
    const serializedPosition = serializePositionProperty(value);
    return `${serializedProperties}${serializedPosition}`;
  }
  if (isPropertyChildren(property, value)) {
    const serializedChildren = serializeChildrenProperty(value);
    return `${serializedProperties}${serializedChildren}`;
  }
  return propertySerializer(serializedProperties, [property, value]);
}

function gameComponentPropertySerializer(serializedProperties: string, [property, value]: [keyof GameObjectData, GameObjectData[keyof GameObjectData]]): string {
  if (isPropertyType(property, value)) {
    if (isSpriteGameObjectType(value)) {
      const serializedSpriteType = serializeSpriteTypeProperty();
      return `${serializedProperties}${serializedSpriteType}`;
    } else if (isLabelGameObjectType(value)) {
      const serializedLabelType = serializeLabelTypeProperty();
      return `${serializedProperties}${serializedLabelType}\n`;
    }
    return serializedProperties;
  }
  if (isPropertyScale(property, value)) {
    const serializedScale = serializeScaleProperty(value);
    return `${serializedProperties}${serializedScale}`;
  }
  if (isPropertyPosition(property, value)) {
    const serializedPosition = serializePositionProperty(value);
    return `${serializedProperties}${serializedPosition}`;
  }
  if (isPropertyImage(property, value)) {
    const serializedImage = serializeImageProperty(value);
    return `${serializedProperties}${serializedImage}`;
  }
  if (isPropertyMaterial(property, value)) {
    const serializedMaterial = serializeMaterialProperty();
    return `${serializedProperties}${serializedMaterial}`;
  }
  if (isPropertyTextLeading(property, value)) {
    const serializedMaterial = serializeTextLeadingProperty(value);
    return `${serializedProperties}${serializedMaterial}`;
  }
  if (isPropertyTextTracking(property, value)) {
    const serializedMaterial = serializeTextTrackingProperty(value);
    return `${serializedProperties}${serializedMaterial}`;
  }
  return propertySerializer(serializedProperties, [property, value]);
}

function embeddedComponentSerializer(serializedEmbeddedBaseProperties: string, serializedEmbeddedDataProperties: string): string {
  const serializedEmbeddedComponentProperties = `${serializedEmbeddedBaseProperties}\ndata: \\"\n${serializedEmbeddedDataProperties}\n\\"`;
  const serializedEmbeddedComponent = `embedded_components {\\n\n${indentLines(serializedEmbeddedComponentProperties)}\n}\\n`;
  return serializedEmbeddedComponent;
}

function processGameObject(serializedBaseProperties: string, serializedEmbeddedComponents: string): string {
  const serializedEmbeddedInstanceProperties = `${serializedBaseProperties}data:\n${wrapLinesInQuotes(serializedEmbeddedComponents)}`;
  const serializedEmbeddedInstance = `embedded_instances {\n${indentLines(serializedEmbeddedInstanceProperties)}\n}\n`;
  return serializedEmbeddedInstance;
}

function gameCollectionSerializer(serializedData: string, gameObjectData: GameObjectData): string {
  const baseProperties = filterBaseProperties(gameObjectData);
  const embeddedProperties = filterEmbeddedProperties(gameObjectData);
  const serializedBaseProperties = serializeBaseProperties(baseProperties);
  const serializedEmbeddedProperties = serializeEmbeddedProperties(embeddedProperties);
  const serializedGameObject = processGameObject(serializedBaseProperties, serializedEmbeddedProperties);
  return `${serializedData}${serializedGameObject}`;
}

/**
 * Serializes game object data.
 * @param gameCollectionData - Game object data to be serialized.
 * @returns Serialized game object data.
 */
export function serializeGameObjectData(gameCollectionData: GameCollectionData): SerializedGameCollectionData {
  const { name, filePath } = gameCollectionData;
  const collection = Object.entries(gameCollectionData.collection).reduce(propertySerializer, "");
  const gameObjects = gameCollectionData.nodes.reduce(gameCollectionSerializer, "");
  const data = `${collection}${gameObjects}`;
  return {
    name,
    data,
    filePath,
  };
}

/**
 * Serializes an array of game object data.
 * @param gameCollectionDataSet - Array of game object data to be serialized.
 * @returns Array of serialized game object data.
 */
export function serializeGameObjectDataSet(gameCollectionDataSet: GameCollectionData[]): SerializedGameCollectionData[] {
  return gameCollectionDataSet.map(serializeGameObjectData);
}

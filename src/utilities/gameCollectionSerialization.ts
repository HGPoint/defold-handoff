/**
 * Handles game-related data serialization.
 * @packageDocumentation
 */

import { propertySerializer } from "utilities/dataSerialization";
import { indentLines, processLines, wrapLinesInQuotes } from "utilities/defold";
import { isGameObjectLabelType, isGameObjectSpriteType } from "utilities/gameCollection";
import { isVector4, readableNumber } from "utilities/math";
import { generateAtlasPath } from "utilities/path";

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

/**
 * Serializes the game collection data.
 * @param gameCollectionData - The game collection data to be serialized.
 * @returns The serialized game collection data.
 */
export async function serializeGameCollectionData(gameCollectionData: GameCollectionData): Promise<SerializedGameCollectionData> {
  const { name, filePath } = gameCollectionData;
  const collection = Object.entries(gameCollectionData.collection).reduce(propertySerializer, "");
  const gameObjects = gameCollectionData.gameObjects.reduce(gameCollectionSerializer, "");
  const data = `${collection}${gameObjects}`;
  const serializedData = {
    name,
    data,
    filePath,
  };
  return Promise.resolve(serializedData);
}

/**
 * Reducer function that serializes game object data.
 * @param serializedData - The cumulative serialized game object data.
 * @param gameObjectData - The game object data to be serialized.
 * @returns The updated cumulative serialized game object data.
 */
function gameCollectionSerializer(serializedData: string, gameObjectData: GameObjectData): string {
  const baseProperties = filterBaseProperties(gameObjectData);
  const embeddedProperties = filterEmbeddedProperties(gameObjectData);
  const serializedBaseProperties = serializeBaseProperties(baseProperties);
  const serializedEmbeddedProperties = serializeEmbeddedProperties(embeddedProperties);
  const serializedGameObject = processGameObject(serializedBaseProperties, serializedEmbeddedProperties);
  return `${serializedData}${serializedGameObject}`;
}

/**
 * Processes serialized game object data.
 * @param serializedBaseProperties - The serialized base properties of the game object.
 * @param serializedEmbeddedComponents - The serialized embedded components of the game object.
 * @returns The processed serialized game object data.
 */
function processGameObject(serializedBaseProperties: string, serializedEmbeddedComponents: string): string {
  const serializedEmbeddedInstanceProperties = `${serializedBaseProperties}data:\n${wrapLinesInQuotes(serializedEmbeddedComponents)}`;
  const serializedEmbeddedInstance = `embedded_instances {\n${indentLines(serializedEmbeddedInstanceProperties)}\n}\n`;
  return serializedEmbeddedInstance;
}

/**
 * Filters base properties from game object data.
 * @param gameObjectData - The game object data to be filtered.
 * @returns The filtered base properties.
 */
function filterBaseProperties(gameObjectData: GameObjectData): Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>> {
  const gameObjectProperties = Object.entries(gameObjectData) as [keyof GameObjectData, GameObjectData[keyof GameObjectData]][];
  return gameObjectProperties.reduce(basePropertiesFilter, {});
}

/**
 * Reducer function that filters base properties from game object data.
 * @param baseProperties - The cumulative base properties.
 * @param property - The property to be filtered.
 * @returns The updated cumulative base properties.
 */
function basePropertiesFilter(baseProperties: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>, [key, value]: [keyof GameObjectData, GameObjectData[keyof GameObjectData]]) {
  if (isBaseProperty(key)) {
    return baseProperties;
  }
  baseProperties[key] = value;
  return baseProperties;
}

/**
 * Filters data properties from game object data.
 * @param gameObjectData - The game object data to be filtered.
 * @returns The filtered data properties.
 */
function filterDataProperties(gameObjectData: GameObjectData): Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>> {
  const gameObjectProperties = Object.entries(gameObjectData) as [keyof GameObjectData, GameObjectData[keyof GameObjectData]][];
  return gameObjectProperties.reduce(dataPropertiesFilter, {});
}

/**
 * Reducer function that filters data properties from game object data.
 * @param dataProperties - The cumulative data properties.
 * @param property - The property to be filtered.
 * @returns The updated cumulative data properties.
 */
function dataPropertiesFilter(dataProperties: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>, [key, value]: [keyof GameObjectData, GameObjectData[keyof GameObjectData]]) {
  if (isComponentProperty(key)) {
    return dataProperties;
  }
  dataProperties[key] = value;
  return dataProperties;
}

/**
 * Filters embedded properties from game object data.
 * @param gameObjectData - The game object data to be filtered.
 * @returns The filtered embedded properties.
 */
function filterEmbeddedProperties(gameObjectData: GameObjectData) {
  if (gameObjectData.components) {
    return gameObjectData.components.reduce(embeddedPropertiesFilter, []);
  }
  return [];
}

/**
 * Reducer function that filters embedded properties from game object data.
 * @param embeddedProperties - The cumulative embedded properties.
 * @param embeddedComponent - The embedded component to be filtered.
 * @returns The updated cumulative embedded properties.
 */
function embeddedPropertiesFilter(embeddedProperties: { base: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>, data: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>> }[], embeddedComponent: GameObjectData) {
  const base = filterBaseProperties(embeddedComponent);
  const data = filterDataProperties(embeddedComponent);
  embeddedProperties.push({ base, data });
  return embeddedProperties;
}

/**
 * Serializes game object base properties.
 * @param baseProperties - The game object base properties to be serialized.
 * @returns The serialized game object base properties.
 */
function serializeBaseProperties(baseProperties: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>) {
  const basedPropertyEntries = Object.entries(baseProperties) as [keyof GameObjectData, GameObjectData[keyof GameObjectData]][];
  return basedPropertyEntries.reduce(gameObjectPropertySerializer, "");
}

/**
 * Reducer function that serializes game object base properties.
 * @param serializedProperties - The cumulative serialized game object base properties.
 * @param property - The property to be serialized.
 * @param value - The value of the property to be serialized.
 * @returns The updated cumulative serialized game object base properties. 
 */
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

/**
 * Serializes game object component properties.
 * @param componentProperties - The game object component properties to be serialized.
 * @returns The serialized game object component properties.
 */
function serializeComponentProperties(componentProperties: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>) {
  const componentPropertiesEntries = Object.entries(componentProperties) as [keyof GameObjectData, GameObjectData[keyof GameObjectData]][];
  return componentPropertiesEntries.reduce(gameComponentPropertySerializer, "");
}

/**
 * Reducer function that serializes game object component properties.
 * @param serializedProperties - The cumulative serialized game object component properties.
 * @param property - The property to be serialized.
 * @param value - The value of the property to be serialized.
 * @returns The updated cumulative serialized game object component properties.
 */
function gameComponentPropertySerializer(serializedProperties: string, [property, value]: [keyof GameObjectData, GameObjectData[keyof GameObjectData]]): string {
  if (isPropertyType(property, value)) {
    if (isGameObjectSpriteType(value)) {
      const serializedSpriteType = serializeSpriteTypeProperty();
      return `${serializedProperties}${serializedSpriteType}`;
    } else if (isGameObjectLabelType(value)) {
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

/**
 * Serializes game object embedded properties.
 * @param embeddedProperties - The game object embedded properties to be serialized.
 * @returns The serialized game object embedded properties.
 */
function serializeEmbeddedProperties(embeddedProperties: { base: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>, data: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>> }[]) {
  if (embeddedProperties && embeddedProperties.length) {
    const serializedEmbeddedPropertySets = embeddedProperties.map((embeddedComponentProperties) => {
      const serializedBaseEmbeddedProperties = serializeComponentProperties(embeddedComponentProperties.base);
      let serializedDataEmbeddedProperties = serializeComponentProperties(embeddedComponentProperties.data);
      if (embeddedComponentProperties.base.type && isPropertyType("type", embeddedComponentProperties.base.type) && isGameObjectLabelType(embeddedComponentProperties.base.type)) {
        serializedDataEmbeddedProperties += `\nfont: "/builtins/fonts/default.font"\nmaterial: "/builtins/fonts/label-df.material"`;
      }
      const processedBaseEmbeddedProperties = processLines(serializedBaseEmbeddedProperties);
      const processedDataEmbeddedProperties = processLines(serializedDataEmbeddedProperties, 2);
      return embeddedComponentSerializer(processedBaseEmbeddedProperties, processedDataEmbeddedProperties);
    });
    return serializedEmbeddedPropertySets.join("\\n\n");
  }
  return "";
}

/**
 * Serializes game object embedded component properties.
 * @param serializedEmbeddedBaseProperties - The serialized game object embedded base properties.
 * @param serializedEmbeddedDataProperties - The serialized game object embedded data properties.
 * @returns The serialized game object embedded component properties.
 */
function embeddedComponentSerializer(serializedEmbeddedBaseProperties: string, serializedEmbeddedDataProperties: string): string {
  const serializedEmbeddedComponentProperties = `${serializedEmbeddedBaseProperties}\ndata: \\"\n${serializedEmbeddedDataProperties}\n\\"`;
  const serializedEmbeddedComponent = `embedded_components {\\n\n${indentLines(serializedEmbeddedComponentProperties)}\n}\\n`;
  return serializedEmbeddedComponent;
}

/**
 * Determines whether the property key is type.
 * @param property - The property key to be checked.
 * @returns True if the property key is type, false otherwise.
 */
function isPropertyKeyType(property: keyof GameObjectData) {
  return property === "type";
}

/**
 * Determines whether the property is type.
 * @param property - The property to be checked.
 * @param value - The value of the property to be checked.
 * @returns True if the property is type, false otherwise.
 */
function isPropertyType(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is GameObjectType {
  return property === "type" && (value === "TYPE_SPRITE" || value === "TYPE_LABEL" || value === "TYPE_EMPTY");
}

/**
 * Determines whether the property is scale.
 * @param property - The property to be checked.
 * @param value - The value of the property to be checked.
 * @returns True if the property is scale, false otherwise.
 */
function isPropertyScale(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is Vector4 {
  return property === "scale" && isVector4(value);
}

/**
 * Determines whether the property is position.
 * @param property - The property to be checked.
 * @param value - The value of the property to be checked.
 * @returns True if the property is position, false otherwise.
 */
function isPropertyPosition(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is Vector4 {
  return property === "position" && isVector4(value);
}

/**
 * Determines whether the property is image.
 * @param property - The property to be checked.
 * @param value - The value of the property to be checked.
 * @returns True if the property is image, false otherwise.
 */
function isPropertyImage(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is string {
  return property === "image" && typeof value === "string";
}

/**
 * Determines whether the property is material.
 * @param property - The property to be checked.
 * @param value - The value of the property to be checked.
 * @returns True if the property is material, false otherwise.
 */
function isPropertyMaterial(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is string {
  return property === "material" && typeof value === "string";
}

/**
 * Determines whether the property is text leading.
 * @param property - The property to be checked.
 * @param value - The value of the property to be checked.
 * @returns True if the property is text leading, false otherwise.
 */
function isPropertyTextLeading(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is number {
  return property === "text_leading" && typeof value === "number";
}

/**
 * Determines whether the property is text tracking.
 * @param property - The property to be checked.
 * @param value - The value of the property to be checked.
 * @returns True if the property is text tracking, false otherwise.
 */
function isPropertyTextTracking(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is number {
  return property === "text_tracking" && typeof value === "number";
}

/**
 * Determines whether the property is children.
 * @param property - The property to be checked.
 * @param value - The value of the property to be checked.
 * @returns True if the property is children, false otherwise.
 */
function isPropertyChildren(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is string[] {
  return property === "children" && Array.isArray(value);
}

/**
 * Determines whether the property is a base property.
 * @param property - The property to be checked.
 * @returns True if the property is a base property, false otherwise.
 */
function isBaseProperty(property: keyof GameObjectData) {
  return EXCLUDED_PROPERTY_KEYS.includes(property) || DATA_PROPERTIES.includes(property);
}

/**
 * Determines whether the property is a component property.
 * @param property - The property to be checked.
 * @returns True if the property is a component property, false otherwise.
 */
function isComponentProperty(property: keyof GameObjectData) {
  return EXCLUDED_PROPERTY_KEYS.includes(property) || !DATA_PROPERTIES.includes(property);
}

/**
 * Serializes the sprite type property.
 * @returns The serialized sprite type property.
 */
function serializeSpriteTypeProperty(): string {
  return `type: "sprite"\n`;
}

/**
 * Serializes the label type property.
 * @returns The serialized label type property.
 */
function serializeLabelTypeProperty(): string {
  return `type: "label"\n`;
}

/**
 * Serializes the scale3 property.
 * @param value - The value of the scale3 property.
 * @returns The serialized scale3 property.
 */
function serializeScale3Property(value: Vector4): string {
  return `scale3 {\n  x: ${readableNumber(value.x)}\n  y: ${readableNumber(value.y)}\n  z: ${readableNumber(value.z)}\n}\n`;
}

/**
 * Serializes the scale property.
 * @param value - The value of the scale property.
 * @returns The serialized scale property.
 */
function serializeScaleProperty(value: Vector4): string {
  return `scale {\n  x: ${readableNumber(value.x)}\n  y: ${readableNumber(value.y)}\n  z: ${readableNumber(value.z)}\n}\n`;
}

/**
 * Serializes the position property.
 * @param value - The value of the position property.
 * @returns The serialized position property.
 */
function serializePositionProperty(value: Vector4): string {
  return `position {\n  x: ${readableNumber(value.x)}\n  y: ${readableNumber(value.y)}\n  z: ${readableNumber(value.z)}\n}\n`;
}

/**
 * Serializes the image property.
 * @param value - The value of the image property.
 * @returns The serialized image property.
 */
function serializeImageProperty(value: string): string {
  const atlasPath = generateAtlasPath(value);
  return `textures {\n  sampler: "texture_sampler"\n  texture: "${atlasPath}"\n}\n`;
}

/**
 * Serializes the material property.
 * @returns The serialized material property, which is always an empty string.
 */
function serializeMaterialProperty(): string {
  return ""
}

/**
 * Serializes the text leading property.
 * @param value - The value of the text leading property.
 * @returns The serialized text leading property.
 */
function serializeTextLeadingProperty(value: number): string {
  return `leading: ${readableNumber(value)}\n`;
}

/**
 * Serializes the text tracking property.
 * @param value - The value of the text tracking property.
 * @returns The serialized text tracking property.
 */
function serializeTextTrackingProperty(value: number): string {
  return `tracking: ${readableNumber(value)}\n`;
}

/**
 * Serializes the children property.
 * @param value - The value of the children property.
 * @returns The serialized children property.
 */
function serializeChildrenProperty(value: string[]): string {
  return value.map((child) => `children: "${child}"\n`).join("");
}

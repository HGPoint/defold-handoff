/**
 * Handles game-related data serialization.
 * @packageDocumentation
 */

import config from "config/config.json"
import { PROJECT_CONFIG } from "handoff/project";
import { propertySerializer, serializeVector4Property } from "utilities/dataSerialization";
import { indentLines, processLines, wrapLinesInQuotes } from "utilities/defold";
import { isGameObjectLabelType, isGameObjectSpriteType } from "utilities/gameCollection";
import { areVectorsEqual, copyVector, isVector4, readableNumber, vector4 } from "utilities/math";
import { generateAtlasPath } from "utilities/path";

const GAME_OBJECT_PROPERTY_ORDER: (keyof GameObjectData)[] = [
  "id",
  "children",
  "position",
  "rotation",
  "scale",
];

const GAME_COMPONENT_PROPERTY_ORDER: (keyof GameObjectData)[] = [
  "id",
  "type",
  "position",
  "rotation",
  "scale",
];

const GAME_COMPONENT_DATA_PROPERTY_ORDER: (keyof GameObjectData)[] = [
  "default_animation",
  "material",
  "blend_mode",
  "slice9",
  "size",
  "size_mode",
  "textures",
  "color",
  "outline",
  "shadow",
  "leading",
  "tracking",
  "pivot",
  "line_break",
  "text",
];

const DATA_PROPERTIES = [
  "size",
  "text",
  "color",
  "outline",
  "shadow",
  "leading",
  "tracking",
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
  const serializedEmbeddedInstanceProperties = `${serializedBaseProperties}data: ${wrapLinesInQuotes(serializedEmbeddedComponents)}`;
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
  const completeKeys = Object.keys(baseProperties) as (keyof GameObjectData)[];
  completeKeys.sort(orderGameObjectProperties);
  return completeKeys.reduce((serializedProperties: string, key: keyof GameObjectData) => {
    const value = baseProperties[key];
    const property = [key, value] as [keyof GameObjectData, GameObjectData[keyof GameObjectData]];
    if (shouldOmitGameObjectProperty(property)) {
      return serializedProperties;
    } else if (isPropertyChildren(key, value)) {
      const serializedChildren = serializeChildrenProperty(value);
      return `${serializedProperties}${serializedChildren}`;
    } else if (isPropertyScale(key, value)) {
      const serializedScale = serializeScale3Property(value);
      return `${serializedProperties}${serializedScale}`;
    } else if (isPropertyPosition(key, value)) {
      const serializedPosition = serializePositionProperty(value);
      return `${serializedProperties}${serializedPosition}`;
    }
    return propertySerializer<GameObjectData>(serializedProperties, property);
  }, "");
}

function shouldOmitGameObjectProperty(property: [keyof GameObjectData, GameObjectData[keyof GameObjectData]]) {
  const [ key ] = property; 
  if (isPropertyKeyType(key)) {
    return true;
  }
  if (PROJECT_CONFIG.omitDefaultValues) {
    return isGameObjectPropertyDefaultValue(property);
  }
  return false;
}

function isGameObjectPropertyDefaultValue(property: [keyof GameObjectData, GameObjectData[keyof GameObjectData]]) {
  const [ key, value ] = property;
  if (isPropertyScale(key, value)) {
    return value.x === 1 && value.y === 1 && value.z === 1;
  }
  if (isPropertyPosition(key, value)) {
    return value.x === 0 && value.y === 0 && value.z === 0;
  }
  if (isPropertyRotation(key, value)) {
    return areVectorsEqual(value, { x: 0, y: 0, z: 0, w: 0 });
  }
}

/**
 * Serializes game object component properties.
 * @param componentProperties - The game object component properties to be serialized.
 * @returns The serialized game object component properties.
 */
function serializeComponentProperties(componentProperties: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>, sorter: (key1: keyof GameObjectData, key2: keyof GameObjectData) => number) {
  const completeKeys = Object.keys(componentProperties) as (keyof GameObjectData)[];
  completeKeys.sort(sorter);
  return completeKeys.reduce((serializedProperties: string, key: keyof GameObjectData) => {
    const value = componentProperties[key];
    const property = [key, value] as [keyof GameObjectData, GameObjectData[keyof GameObjectData]];
    if (isPropertyType(key, value)) {
      if (isGameObjectSpriteType(value)) {
        const serializedSpriteType = serializeSpriteTypeProperty();
        return `${serializedProperties}${serializedSpriteType}`;
      } else if (isGameObjectLabelType(value)) {
        const serializedLabelType = serializeLabelTypeProperty();
        return `${serializedProperties}${serializedLabelType}\n`;
      }
      return serializedProperties;
    } else {
      if (shouldOmitComponentProperty(property)) {
        return serializedProperties;
      } else if (isPropertyScale(key, value)) {
        const serializedScale = serializeScaleProperty(value);
        return `${serializedProperties}${serializedScale}`;
      } else if (isPropertyPosition(key, value)) {
        const serializedPosition = serializePositionProperty(value);
        return `${serializedProperties}${serializedPosition}`;
      } else if (isPropertyImage(key, value)) {
        const serializedImage = serializeImageProperty(value);
        return `${serializedProperties}${serializedImage}`;
      } else if (isPropertyMaterial(key, value)) {
        const serializedMaterial = serializeMaterialProperty();
        return `${serializedProperties}${serializedMaterial}`;
      } else if (isPropertyTextLeading(key, value)) {
        const serializedMaterial = serializeTextLeadingProperty(value);
        return `${serializedProperties}${serializedMaterial}`;
      } else if (isPropertyTextTracking(key, value)) {
        const serializedMaterial = serializeTextTrackingProperty(value);
        return `${serializedProperties}${serializedMaterial}`;
      } else if (isPropertyColor(key, value)) {
        const serializedColor = serializeColorProperty(value);
        return `${serializedProperties}${serializedColor}`;
      } else if (isPropertyOutline(key, value)) {
        const serializedColor = serializeOutlineProperty(value);
        return `${serializedProperties}${serializedColor}`;
      } else if (isPropertyShadow(key, value)) {
        const serializedColor = serializeShadowProperty(value);
        return `${serializedProperties}${serializedColor}`;
      }
      return propertySerializer<GameObjectData>(serializedProperties, [key, value]);
    }
  }, "");
}

function shouldOmitComponentProperty(property: [keyof GameObjectData, GameObjectData[keyof GameObjectData]]) {
  if (PROJECT_CONFIG.omitDefaultValues) {
    return isComponentPropertyDefaultValue(property);
  }
  return false;
}

function isComponentPropertyDefaultValue(property: [keyof GameObjectData, GameObjectData[keyof GameObjectData]]) {
  const [ key, value ] = property;
  if (isPropertyScale(key, value)) {
    return value.x === 1 && value.y === 1 && value.z === 1;
  }
  if (isPropertyPosition(key, value)) {
    return value.x === 0 && value.y === 0 && value.z === 0;
  }
  if (isPropertyRotation(key, value)) {
    return areVectorsEqual(value, { x: 0, y: 0, z: 0, w: 0 });
  }
  if (isPropertySize(key, value)) {
    return value.x === 0 && value.y === 0;
  }
  if (isPropertySizeMode(key, value)) {
    return value === config.gameObjectDefaultValues.size_mode;
  }
  if (isPropertySlice9(key, value)) {
    return areVectorsEqual(value, { x: 0, y: 0, z: 0, w: 0 });
  }
  if (isPropertyImage(key, value)) {
    return value === "";
  }
  if (isPropertyBlendMode(key, value)) {
    return value === config.gameObjectDefaultValues.blend_mode;
  }
  if (isPropertyTextLeading(key, value)) {
    return value === 1;
  }
  if (isPropertyTextTracking(key, value)) {
    return value === 0;
  }
  if (isPropertyPivot(key, value)) {
    return value === config.gameObjectDefaultValues.pivot;
  }
}

/**
 * Serializes game object embedded properties.
 * @param embeddedProperties - The game object embedded properties to be serialized.
 * @returns The serialized game object embedded properties.
 */
function serializeEmbeddedProperties(embeddedProperties: { base: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>>, data: Partial<Record<keyof GameObjectData, GameObjectData[keyof GameObjectData]>> }[]) {
  if (embeddedProperties && embeddedProperties.length) {
    const serializedEmbeddedPropertySets = embeddedProperties.map((embeddedComponentProperties) => {
      const serializedBaseEmbeddedProperties = serializeComponentProperties(embeddedComponentProperties.base, orderComponentProperties);
      let serializedDataEmbeddedProperties = serializeComponentProperties(embeddedComponentProperties.data, orderComponentDataProperties);
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

function isPropertyRotation(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is Vector4 {
  return property === "rotation" && isVector4(value);
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
  return property === "leading" && typeof value === "number";
}

/**
 * Determines whether the property is text tracking.
 * @param property - The property to be checked.
 * @param value - The value of the property to be checked.
 * @returns True if the property is text tracking, false otherwise.
 */
function isPropertyTextTracking(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is number {
  return property === "tracking" && typeof value === "number";
}

function isPropertySize(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is Vector4 {
  return property === "size" && isVector4(value);
}

function isPropertySizeMode(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is SizeMode {
  return property === "size_mode" && (value === "SIZE_MODE_AUTO" || value === "SIZE_MODE_MANUAL");
}

function isPropertySlice9(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is Vector4 {
  return property === "slice9" && isVector4(value);
}

function isPropertyBlendMode(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is BlendingMode {
  return property === "blend_mode" && (value === "BLEND_MODE_ALPHA" || value === "BLEND_MODE_ADD" || value === "BLEND_MODE_MULTIPLY" || value === "BLEND_MODE_SCREEN" || value === "BLEND_MODE_DISABLED");
}

function isPropertyPivot(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is Pivot {
  return property === "pivot" && (value === "PIVOT_CENTER" || value === "PIVOT_N" || value === "PIVOT_NE" || value === "PIVOT_E" || value === "PIVOT_SE" || value === "PIVOT_S" || value === "PIVOT_SW" || value === "PIVOT_W" || value === "PIVOT_NW");
}

function isPropertyColor(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is Vector4 {
  return property === "color" && isVector4(value);
}

function isPropertyOutline(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is Vector4 {
  return property === "outline" && isVector4(value);
}

function isPropertyShadow(property: keyof GameObjectData, value: GameObjectData[keyof GameObjectData]): value is Vector4 {
  return property === "shadow" && isVector4(value);
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
function serializeScale3Property(scale3: Vector4): string {
  const serializableScale3 = copyVector(scale3);
  serializableScale3.w = 0;
  const serializedScale3 = serializeVector4Property<GameObjectData>("scale3", serializableScale3, vector4(1, 1, 1, 0));
  if (serializedScale3) {
    return `${serializedScale3}\n`;
  }
  return "";
}

/**
 * Serializes the scale property.
 * @param value - The value of the scale property.
 * @returns The serialized scale property.
 */
function serializeScaleProperty(scale: Vector4): string {
  const serializableScale = copyVector(scale);
  serializableScale.w = 0;
  const serializedScale = serializeVector4Property<GameObjectData>("scale", serializableScale, vector4(1, 1, 1, 0));
  if (serializedScale) {
    return `${serializedScale}\n`;
  }
  return "";
}

/**
 * Serializes the position property.
 * @param value - The value of the position property.
 * @returns The serialized position property.
 */
function serializePositionProperty(position: Vector4): string {
  const serializablePosition = copyVector(position);
  serializablePosition.w = 0;
  const serializedPosition = serializeVector4Property<GameObjectData>("position", serializablePosition, vector4(0));
  if (serializedPosition) {
    return `${serializedPosition}\n`;
  }
  return "";
}

function serializeColorProperty(color: Vector4): string {
  const serializedColor = serializeVector4Property<GameObjectData>("color", color, vector4(1));
  if (serializedColor) {
    return `${serializedColor}\n`;
  }
  return "";
}

function serializeOutlineProperty(outline: Vector4): string {
  const serializedOutline = serializeVector4Property<GameObjectData>("outline", outline, vector4(0, 0, 0, 1));
  if (serializedOutline) {
    return `${serializedOutline}\n`;
  }
  return "";
}

function serializeShadowProperty(shadow: Vector4): string {
  const serializedShadow = serializeVector4Property<GameObjectData>("shadow", shadow, vector4(0, 0, 0, 1));
  if (serializedShadow) {
    return `${serializedShadow}\n`;
  }
  return "";
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
 * @param children - The value of the children property.
 * @returns The serialized children property.
 */
function serializeChildrenProperty(children: string[]): string {
  return children.map((child) => `children: "${child}"\n`).join("");
}

function orderGameObjectProperties(key1: keyof GameObjectData, key2: keyof GameObjectData) {
  return orderProperties(key1, key2, GAME_OBJECT_PROPERTY_ORDER);
}

function orderComponentProperties(key1: keyof GameObjectData, key2: keyof GameObjectData) {
  return orderProperties(key1, key2, GAME_COMPONENT_PROPERTY_ORDER);
}

function orderComponentDataProperties(key1: keyof GameObjectData, key2: keyof GameObjectData) {
  return orderProperties(key1, key2, GAME_COMPONENT_DATA_PROPERTY_ORDER);
}

function orderProperties(key1: keyof GameObjectData, key2: keyof GameObjectData, order: (keyof GameObjectData)[]) {
  const index1 = order.indexOf(key1);
  const index2 = order.indexOf(key2);
  if (index1 === -1 && index2 === -1) {
    return 0;
  }
  if (index1 === -1) {
    return 1;
  }
  if (index2 == -1) {
    return -1;
  }
  return index1 - index2;
} 
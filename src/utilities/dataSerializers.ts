import config from "config/config.json";

function hasValue<T>(value: T[keyof T]) {
  return value !== null && value !== undefined;
}

function isSimpleProperty<T>(value: T[keyof T]): value is T[keyof T] & (number | boolean) {
  return typeof value === "number" || typeof value === "boolean";
}

function isStringProperty<T>(value: T[keyof T]): value is T[keyof T] & string {
  return typeof value === "string";
}

function isQuotedProperty<T>(key: (keyof T)) {
  return typeof key === "string" && !config.constKeys.includes(key);
}

function isVector4Property<T>(value: T[keyof T]): value is T[keyof T] & Vector4 {
  return !!value && typeof value == "object" &&  "x" in value && "y" in value && "z" in value && "w" in value;
}

function serializeSimpleProperty<T>(property: keyof T, value: number | boolean | string): string {
  return `${property.toString()}: ${value}`;
}

function serializeQuotedProperty<T>(property: keyof T, value: string): string {
  return `${property.toString()}: "${value}"`;
}

function serializeVector4Property<T>(property: keyof T, value: Vector4): string {
  return `${property.toString()} {\nx: ${value.x}\ny: ${value.y}\nz: ${value.z}\nw: ${value.w}\n}`;
}

export function serializeProperty<T>(property: keyof T, value: T[keyof T]): string {
  if (isSimpleProperty(value)) {
    return serializeSimpleProperty(property, value);
  } else if (isStringProperty(value)) {
    if (isQuotedProperty(property)) {
      return serializeQuotedProperty(property, value);
    }
    return serializeSimpleProperty(property, value);
  }
  else if (isVector4Property(value)) {
    return serializeVector4Property(property, value);
  }
  return "";
}

export function propertySerializer<T>(serializedProperties: string, [property, value]: [keyof T, T[keyof T]]): string {
  if (hasValue(value)) {
    const serializedProperty = serializeProperty(property, value);
    return `${serializedProperties}${serializedProperty}\n`;
  }
  return serializedProperties;
}

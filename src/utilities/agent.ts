/**
 * Handles serialization of plugin messages relayed to the agent.
 * @packageDocumentation
 */

import { archiveBundle } from "utilities/archive";

export const AGENT_SERVER_URL = "ws://localhost:3055";

const ARCHIVED_ACTIONS: PluginMessageAction[] = ["guiExported", "gameCollectionsExported", "atlasesExported", "bundleExported"];

/**
 * Encodes bytes to a base64 string.
 * @param bytes - The bytes to encode.
 * @returns The base64 string.
 */
function encodeBase64(bytes: Uint8Array): string {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

/**
 * Encodes a blob to a base64 string.
 * @param blob - The blob to encode.
 * @returns The base64 string.
 */
async function encodeBlob(blob: Blob): Promise<string> {
  const buffer = await blob.arrayBuffer();
  return encodeBase64(new Uint8Array(buffer));
}

/**
 * Replacer function that serializes binary values to base64 strings.
 * @param _key - The key of the value.
 * @param value - The value to serialize.
 * @returns The serialized value.
 */
function serializeValue(_key: string, value: unknown): unknown {
  if (value instanceof Uint8Array) {
    return encodeBase64(value);
  }
  return value;
}

/**
 * Resolves the data of a plugin message, archiving exported bundles the same way they are downloaded.
 * @param message - The plugin message.
 * @returns The resolved message data.
 */
async function resolveMessageData({ type, data }: PluginMessage): Promise<PluginMessagePayload | { archive: string } | undefined> {
  if (ARCHIVED_ACTIONS.includes(type) && data?.bundle && data.project) {
    const blob = await archiveBundle(data.bundle, data.project);
    const archive = await encodeBlob(blob);
    return { archive };
  }
  return data;
}

/**
 * Serializes a plugin message to be sent to the agent.
 * @param message - The plugin message to serialize.
 * @returns The serialized message.
 */
export async function serializeAgentMessage(message: PluginMessage): Promise<string> {
  const data = await resolveMessageData(message);
  return JSON.stringify({ ...message, data }, serializeValue);
}

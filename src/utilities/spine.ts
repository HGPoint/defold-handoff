import { serializeSpineData } from "utilities/spineSerialization";

export const SPINE_SERIALIZATION_PIPELINE: TransformPipeline<SpineData, SerializedSpineData> = {
  transform: serializeSpineData,
};

export function resolveSpineFilePath() {
  return "";
}

export function resolveSpineSkeletonData(guiData: GUIData) {
  const name = guiData.name;
  const spine = "4.2";
  return { name, spine };
}


export function generateSpineBoneData(nodes: GUINodeData[]) {
  const bones = nodes.map(convertSpineBoneData);
  return bones;
}

function convertSpineBoneData(node: GUINodeData) {
  const name = node.id;
  const { parent } = node;
  const { x, y } = node.position;
  const rotation = node.rotation.z;
  const data: SpineBoneData = { name, x, y, rotation };
  if (parent) {
    data.parent = parent;
  }
  return data;
}

export function generateSpineSkinData(nodes: GUINodeData[]) {
  const attachments = nodes.reduce(reduceSpineAttachmentData, {});
  const skins = [{ name: "default", attachments }];
  return skins;
}

function reduceSpineAttachmentData(attachments: Record<string, Record<string, SpineAttachmentData>>, node: GUINodeData) {
  if (node.texture) {
    const name = node.id;
    const { texture, size: { x: width, y: height } } = node;
    const path = resolveSpinePathFromTexture(texture);
    const attachment = {
      path,
      width,
      height
    };
    attachments[name] = { [path]: attachment };
  }
  return attachments;
}

export function generateSpineSlotData(nodes: GUINodeData[]) {
  const slots = nodes.reduce(reduceSpineSlotData, []);
  return slots;
}

function reduceSpineSlotData(slots: SpineSlotData[], node: GUINodeData) {
  if (node.texture) {
    const { id: name, texture } = node;
    const attachment = resolveSpinePathFromTexture(texture);
    const data = {
      name,
      bone: name,
      attachment
    };
    slots.push(data);
  }
  return slots;
}

function resolveSpinePathFromTexture(texture: string) {
  return texture.split("/").pop() || texture;
}
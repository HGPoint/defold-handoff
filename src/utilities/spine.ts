import { isZeroVector } from "utilities/math";
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

export function generateSpineSkinData(nodes: GUINodeData[], bones: SpineBoneData[]) {
  const attachments = nodes.reduce((cumulativeAttachements, node) => reduceSpineAttachmentData(cumulativeAttachements, node, bones), {});
  const skins = [{ name: "default", attachments }];
  return skins;
}

function reduceSpineAttachmentData(attachments: Record<string, Record<string, SpineAttachmentData>>, node: GUINodeData, bones: SpineBoneData[]) {
  if (shouldGenerateAttachment(node)) {
    const { id: name } = node;
    if (shouldGenerateImageAttachment(node)) {
      attachments[name] = generateImageAttachment(node);
    } else {
      attachments[name] = generateMeshAttachment(node, bones);
    }
  }
  return attachments;
}

function shouldGenerateAttachment(node: GUINodeData): node is GUINodeData & { texture: string } {
  return !!node.texture;
}

function shouldGenerateImageAttachment(node: GUINodeData) {
  return !node.slice9 || isZeroVector(node.slice9);
}

function generateImageAttachment(node: GUINodeData & { texture: string }) {
  const { texture, size: { x: width, y: height } } = node;
  const path = resolveSpinePathFromTexture(texture);
  const attachment = {
    path,
    width,
    height
  };
  return { [path]: attachment };
}

function generateMeshAttachment(node: GUINodeData & { texture: string }, bones: SpineBoneData[]) {
  const { texture } = node;
  const path = resolveSpinePathFromTexture(texture);
  const type: SpineAttachmentType = "mesh";
  const vertices = resolveSpineMeshVertices(node, bones);
  const uvs = resolveSpineMeshUVs();
  const triangles = resolveSpineMeshTriangles(node);
  const hull = resolveSpineMeshHull(node);
  const attachment = {
    path,
    type,
    vertices,
    uvs,
    triangles,
    hull
  };
  return { [path]: attachment };
}

function resolveSpineMeshVertices(node: GUINodeData, bones: SpineBoneData[]) {
  const { size: { x: width, y: height }, slice9 } = node;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const boneIndex = bones.findIndex(bone => bone.name === node.id);
  const baseVertices = [
    [1, boneIndex, -halfWidth, -halfHeight, 1 ],
    [1, boneIndex, halfWidth, -halfHeight, 1 ],
    [1, boneIndex, halfWidth, halfHeight, 1 ],
    [1, boneIndex, -halfWidth, halfHeight,  ],
  ]
  const vertices = []
  for (let index = 0; index < 4; index += 1) {
    if (index == 0) {
      vertices.push(baseVertices[index])
      if (slice9.x > 0) {
        const vertex = [1, boneIndex, -halfWidth + slice9.x, -halfHeight, 1];
        vertices.push(vertex)
      }
      if (slice9.z > 0) {
        const vertex = [1, boneIndex, halfWidth - slice9.z, -halfHeight, 1];
        vertices.push(vertex)
      }
    }
    if (index == 1) {
      vertices.push(baseVertices[index])
      if (slice9.y > 0) {
        const vertex = [1, boneIndex, halfWidth, halfHeight + slice9.y, 1];
        vertices.push(vertex)
      }
      if (slice9.w > 0) {
        const vertex = [1, boneIndex, halfWidth, halfHeight - slice9.w, 1];
        vertices.push(vertex)
      }
    }
    if (index == 2) {
      vertices.push(baseVertices[index])
      if (slice9.x > 0) {
        const vertex = [1, boneIndex, halfWidth - slice9.x, halfHeight, 1];
        vertices.push(vertex)
      }
      if (slice9.z > 0) {
        const vertex = [1, boneIndex, -halfWidth + slice9.z, halfHeight, 1];
        vertices.push(vertex)
      }
    }
    if (index == 3) {
      vertices.push(baseVertices[index])
      if (slice9.y > 0) {
        const vertex = [1, boneIndex, -halfWidth, halfHeight - slice9.y, 1];
        vertices.push(vertex)
      }
      if (slice9.w > 0) {
        const vertex = [1, boneIndex, -halfWidth, -halfHeight + slice9.w, 1];
        vertices.push(vertex)
      }
    }
  }
  return vertices.flat();
}

function resolveSpineMeshUVs() {
  return [1, 1, 0, 1, 0, 0, 1, 0]
}

function resolveSpineMeshTriangles(node) {
  const { slice9 } = node;
  const polygons = countSlice9Rectangles(slice9);
}

function countSlice9Rectangles(slice9: Vector4): number {
  const { x: left, y: top, z: right, w: bottom } = slice9;
  const columns = 1 + (left > 0 ? 1 : 0) + (right > 0 ? 1 : 0);
  const rows = 1 + (top > 0 ? 1 : 0) + (bottom > 0 ? 1 : 0);
  return columns * rows;
}

function resolveSpineMeshHull(node: GUINodeData) {
  const { slice9 } = node;
  const additionalVertices = Object.values(slice9).reduce((cumulative, value) => cumulative + (value > 0 ? 2 : 0), 0);
  return 4 + additionalVertices
}
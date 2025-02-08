import { isFigmaText } from "utilities/figma";
import { isZeroVector, vector4 } from "utilities/math";
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
  const { x, y } = convertSpineBonePosition(node);
  const rotation = node.rotation.z;
  const { x: scaleX, y: scaleY } = convertSpineBoneScale(node);
  const data: SpineBoneData = {
    name,
    x,
    y,
    rotation,
    scaleX,
    scaleY,
  };
  if (parent) {
    data.parent = parent;
  }
  return data;
}

function convertSpineBonePosition(node: GUINodeData) {
  const { position, size, exportable_layer: layer, texture_size: textureSize } = node;
  const { x, y } = position;
  if (textureSize && !isZeroVector(textureSize) && isFigmaText(layer)) {
    const shiftedPosition = calculateSpineTextBonePosition(layer, position, size, textureSize);
    return shiftedPosition;
  }
  return vector4(x, y, 0, 0);
}

function calculateSpineTextBonePosition(layer: TextNode, position: Vector4, size: Vector4, textureSize: Vector4) {
  const { x: width, y: height } = size;
  const { x: textureWidth, y: textureHeight } = textureSize;
  const { textAlignHorizontal, textAlignVertical } = layer; 
  let shiftX = 0;
  let shiftY = 0;
  if (textAlignVertical === "TOP") {
    shiftY += (height - textureHeight) / -2; 
  } else if (textAlignVertical === "BOTTOM") {
    shiftY += (height - textureHeight) / 2;
  }
  if (textAlignHorizontal === "RIGHT") {
    shiftX += (width - textureWidth) / 2;
  } else if (textAlignHorizontal === "LEFT") {
    shiftX += (width - textureWidth) / -2;
  }
  const x = position.x + shiftX;
  const y = position.y + shiftY;
  return vector4(x, y, 0, 0);
}

function convertSpineBoneScale(node: GUINodeData) {
  const { size, texture_size: textureSize, exportable_layer: layer, slice9 } = node;
  if (textureSize && !isZeroVector(textureSize)) {
    if (isFigmaText(layer)) {
      return vector4(1);
    } else if (!slice9 || isZeroVector(slice9)) {
      const { x: width, y: height } = size;
      const { x: textureWidth, y: textureHeight } = textureSize;
      const x = width / textureWidth;
      const y = height/ textureHeight;
      return vector4(x, y, 0, 0);
    }
  }
  return vector4(1);
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

export function generateSpineSkinData(nodes: GUINodeData[]) {
  const attachments = nodes.reduce(reduceSpineAttachmentData, {});
  const skins = [{ name: "default", attachments }];
  return skins;
}

function reduceSpineAttachmentData(attachments: Record<string, Record<string, SpineAttachmentData>>, node: GUINodeData) {
  if (shouldGenerateAttachment(node)) {
    const { id: name } = node;
    if (shouldGenerateImageAttachment(node)) {
      attachments[name] = generateImageAttachment(node);
    } else {
      attachments[name] = generateMeshAttachment(node);
    }
  }
  return attachments;
}

function shouldGenerateAttachment(node: GUINodeData): node is GUINodeData & { texture: string, texture_size: Vector4 } {
  return !!node.texture;
}

function shouldGenerateImageAttachment(node: GUINodeData) {
  return !node.slice9 || isZeroVector(node.slice9);
}

function generateImageAttachment(node: GUINodeData & { texture: string, texture_size: Vector4 }) {
  const { texture, texture_size: { x: width, y: height } } = node;
  const path = resolveSpinePathFromTexture(texture);
  const attachment = {
    path,
    width,
    height
  };
  return { [path]: attachment };
}

function generateMeshAttachment(node: GUINodeData & { texture: string, texture_size: Vector4 }) {
  const { texture, texture_size: { x: width, y: height } } = node;
  const path = resolveSpinePathFromTexture(texture);
  const type: SpineAttachmentType = "mesh";
  const { vertices, uvs, triangles, edges } = calculateSpineMeshProperties(node);
  const hull = calculateSpineMeshHull(node);
  const attachment: SpineAttachmentData = {
    path,
    type,
    vertices,
    uvs,
    triangles,
    hull,
    edges,
    width,
    height
  };
  return { [path]: attachment };
}

function calculateSpineMeshProperties(node: GUINodeData & { texture_size: Vector4 }) {
  const { size: { x: width, y: height }, texture_size: { x: textureWidth, y: textureHeight }, slice9 } = node;
  const halfWidth = width / 2;
  const halfHeight = height / 2;
  const baseVertices = [
    [-halfWidth, -halfHeight],
    [halfWidth, -halfHeight],
    [halfWidth, halfHeight],
    [-halfWidth, halfHeight],
  ]
  const baseUVs = [
    [0, 1],
    [1, 1],
    [1, 0],
    [0, 0],
  ]
  const vertices = []
  const uvs = []
  for (let index = 0; index < 4; index += 1) {
    vertices.push(baseVertices[index])
    uvs.push(baseUVs[index])
    if (index == 0) {
      if (slice9.x > 0) {
        const vertex = [-halfWidth + slice9.x, -halfHeight];
        vertices.push(vertex)
        const uv = [slice9.x / textureWidth, 1];
        uvs.push(uv)
      }
      if (slice9.z > 0) {
        const vertex = [halfWidth - slice9.z, -halfHeight];
        vertices.push(vertex)
        const uv = [(textureWidth - slice9.z) / textureWidth, 1];
        uvs.push(uv)
      }
    }
    if (index == 1) {
      if (slice9.y > 0) {
        const vertex = [halfWidth, -halfHeight + slice9.y];
        vertices.push(vertex)
        const uv = [1, (textureHeight - slice9.y) / textureHeight];
        uvs.push(uv)
      }
      if (slice9.w > 0) {
        const vertex = [halfWidth, halfHeight - slice9.w];
        vertices.push(vertex)
        const uv = [1, slice9.w / textureHeight];
        uvs.push(uv)
      }
    }
    if (index == 2) {
      if (slice9.z > 0) {
        const vertex = [halfWidth - slice9.z, halfHeight];
        vertices.push(vertex)
        const uv = [(textureWidth - slice9.z) / textureWidth, 0];
        uvs.push(uv)
      }
      if (slice9.x > 0) {
        const vertex = [-halfWidth + slice9.x, halfHeight];
        vertices.push(vertex)
        const uv = [slice9.x / textureWidth, 0];
        uvs.push(uv)
      }
    }
    if (index == 3) {
      if (slice9.w > 0) {
        const vertex = [-halfWidth, halfHeight - slice9.w];
        vertices.push(vertex)
        const uv = [0, slice9.w / textureHeight];
        uvs.push(uv)
      }
      if (slice9.y > 0) {
        const vertex = [-halfWidth, -halfHeight + slice9.y];
        vertices.push(vertex)
        const uv = [0, (textureHeight - slice9.y) / textureHeight];
        uvs.push(uv)
      }
    }
  }
  if (slice9.x > 0) {
    if (slice9.y > 0) {
      const vertex = [-halfWidth + slice9.x, -halfHeight + slice9.y];
      vertices.push(vertex);
      const uv = [slice9.x / textureWidth, (textureHeight - slice9.y) / textureHeight];
      uvs.push(uv)
    }
    if (slice9.w > 0) {
      const vertex = [-halfWidth + slice9.x, halfHeight - slice9.w];
      vertices.push(vertex);
      const uv = [slice9.x / textureWidth, slice9.w / textureHeight];
      uvs.push(uv)
    }
  }
  if (slice9.z > 0) {
    if (slice9.y > 0) {
      const vertex = [halfWidth - slice9.z, -halfHeight + slice9.y];
      vertices.push(vertex);
      const uv = [(textureWidth - slice9.z) / textureWidth, (textureHeight - slice9.y) / textureHeight];
      uvs.push(uv)
    }
    if (slice9.w > 0) {
      const vertex = [halfWidth - slice9.z, halfHeight - slice9.w];
      vertices.push(vertex);
      const uv = [(textureWidth - slice9.z) / textureWidth, slice9.w / textureHeight];
      uvs.push(uv)
    }
  }
  const polygons = findPolygons(width, height, slice9);
  const trianglePoints = generateTrianglePoints(polygons);
  const triangles = convertTrianglePointsToIndices(trianglePoints, vertices);
  const edgePoints = generateEdgePoints(polygons);
  const edges = convertEdgePointsToIndices(edgePoints, vertices);
  return {
    vertices: vertices.flat(),
    uvs: uvs.flat(),
    triangles: triangles.flat(),
    edges: edges.flat()
  }
}

function findPolygons(width: number, height: number, slice9: Vector4) {
  const x1 = -width / 2;
  const y1 = -height / 2;
  const x2 = width / 2;
  const y2 = height / 2;
  const left = x1 + slice9.x;
  const top = y1 + slice9.y;
  const right = x2 - slice9.z;
  const bottom = y2 - slice9.w;
  const slices = [
    [x1, y1, left, top],
    [left, y1, right, top], 
    [right, y1, x2, top], 
    [x1, top, left, bottom], 
    [left, top, right, bottom],
    [right, top, x2, bottom], 
    [x1, bottom, left, y2], 
    [left, bottom, right, y2], 
    [right, bottom, x2, y2], 
  ];
  return slices.reduce((cumulative, slice) => {
    if (slice[0] === slice[2] || slice[1] === slice[3]) {
      return cumulative;
    }
    return [...cumulative, slice];
  }, [] as number[][])
}

function generateTrianglePoints(polygons: number[][]) {
  const triangles = polygons.reduce<number[][]>((cumulative, polygon) => {
    const point1 = [polygon[0], polygon[1]];
    const point2 = [polygon[2], polygon[1]];
    const point3 = [polygon[2], polygon[3]];
    const point4 = [polygon[0], polygon[3]];
    const triangle1 = [...point1, ...point2, ...point3];
    const triangle2 = [...point3, ...point4, ...point1];
    return [...cumulative, triangle1, triangle2];
  }, [])
  return triangles;
}

function convertTrianglePointsToIndices(trianglePoints: number[][], vertices: number[][]) {
  return trianglePoints.map((triangle) => {
    const triangleIndices = [];
    for (let index = 0; index < triangle.length; index += 2) {
      const vertex = triangle.slice(index, index + 2);
      const vertexIndex = vertices.findIndex((vertexData) => vertexData[0] === vertex[0] && vertexData[1] === vertex[1]);
      triangleIndices.push(vertexIndex);
    }
    return triangleIndices;
  });
}

function generateEdgePoints(polygons: number[][]) {
  const edgePoints = polygons.reduce<number[][]>((cumulative, polygon) => {
    const polygonEdge1 = [polygon[0], polygon[1], polygon[2], polygon[1]];
    const polygonEdge2 = [polygon[2], polygon[1], polygon[2], polygon[3]];
    const polygonEdge3 = [polygon[2], polygon[3], polygon[0], polygon[3]];
    const polygonEdge4 = [polygon[0], polygon[3], polygon[0], polygon[1]];
    if (cumulative.every(edge => edge[0] !== polygonEdge1[0] || edge[1] !== polygonEdge1[1] || edge[2] !== polygonEdge1[2] || edge[3] !== polygonEdge1[3])) {
      cumulative.push(polygonEdge1);
    }
    if (cumulative.every(edge => edge[0] !== polygonEdge2[0] || edge[1] !== polygonEdge2[1] || edge[2] !== polygonEdge2[2] || edge[3] !== polygonEdge2[3])) {
      cumulative.push(polygonEdge2);
    }
    if (cumulative.every(edge => edge[0] !== polygonEdge3[0] || edge[1] !== polygonEdge3[1] || edge[2] !== polygonEdge3[2] || edge[3] !== polygonEdge3[3])) {
      cumulative.push(polygonEdge3);
    }
    if (cumulative.every(edge => edge[0] !== polygonEdge4[0] || edge[1] !== polygonEdge4[1] || edge[2] !== polygonEdge4[2] || edge[3] !== polygonEdge4[3])) {
      cumulative.push(polygonEdge4);
    }
    return cumulative;
  }, [])
  return edgePoints;
}

function convertEdgePointsToIndices(edgePoints: number[][], vertices: number[][]) {
  return edgePoints.map((edge) => {
    const edgeIndices = [];
    for (let index = 0; index < edge.length; index += 2) {
      const vertex = edge.slice(index, index + 2);
      const vertexIndex = vertices.findIndex((vertexData) => vertexData[0] === vertex[0] && vertexData[1] === vertex[1]);
      edgeIndices.push(vertexIndex * 2);
    }
    return edgeIndices;
  });
}

function calculateSpineMeshHull(node: GUINodeData) {
  const { slice9 } = node;
  const additionalVertices = Object.values(slice9).reduce((cumulative, value) => cumulative + (value > 0 ? 2 : 0), 0);
  return 4 + additionalVertices
}
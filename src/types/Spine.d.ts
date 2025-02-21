type SpineData = {
  name: string,
  skeleton: SpineSkeletonData,
  bones: SpineBoneData[],
  slots: SpineSlotData[],
  skins: SpineSkinData[],
  filePath: string,
}

type SpineSkeletonData = {
  name: string,
  spine: string,
  x?: number,
  y?:  number,
  width?: number,
  height?: number,
}

type SpineBoneData = {
  name: string,
  parent?: string,
  x?: number,
  y?: number,
  rotation?: number,
  scaleX?: number,
  scaleY?: number,
}

type SpineSlotData = {
  name: string,
  bone: string,
  attachment: string,
  x?: number,
  y?: number,
}

type SpineSkinData = {
  name: string,
  attachments: Record<string, Record<string, SpineAttachmentData>>
}

type SpineAttachmentData = {
  path?: string,
  type?: SpineAttachmentType,
  x?: number,
  y?: number,
  rotation?: number,
  scaleX?: number,
  scaleY?: number,
  width?: number,
  height?: number,
  uvs?: number[],
  triangles?: number[],
  vertices?: number[],
  edges?: number[],
  hull?: number,
}

type SpineAttachmentType = 'region' | 'boundingbox' | 'mesh' | 'linkedmesh' | 'path' | 'point' | 'clipping'

type SerializedSpineData = {
  name: string,
  data: string,
  filePath: string,
}
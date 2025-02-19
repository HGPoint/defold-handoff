/**
 * 
 * @packageDocumentation
 */

export async function serializeSpineData(spineData: SpineData): Promise<SerializedSpineData> {
  const { name, bones, slots, skins, filePath } = spineData;
  const serializedSkeleton = serializeSpineSkeletonData(spineData);
  const serializedBones = serializeSpineBoneData(bones);
  const serializedSlots = serializeSpineSlotData(slots);
  const serializedSkins = serializeSpineSkinData(skins);
  const data = `{\n${serializedSkeleton},\n${serializedBones},\n${serializedSlots},\n${serializedSkins}\n}`.trim();
  return {
    name,
    data,
    filePath
  };
}

function serializeSpineSkeletonData(spineData: SpineData): string {
  const { skeleton } = spineData;
  
  return `"${skeleton.name}": { "spine": "${skeleton.spine}" }`;
}

function serializeSpineBoneData(bones: SpineBoneData[]): string {
  return `"bones": ${JSON.stringify(bones)}`;
}

function serializeSpineSlotData(slots: SpineSlotData[]): string {
  return `"slots": ${JSON.stringify(slots)}`;
}

function serializeSpineSkinData(skins: SpineSkinData[]): string {
  return `"skins": ${JSON.stringify(skins)}`;
}

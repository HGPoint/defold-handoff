/**
 * 
 * @packageDocumentation
 */

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

export function resolveDefaultRootSpineBone() {
  return {
    name: "root",
    x: 0,
    y: 0,
    rotation: 0
  }
}

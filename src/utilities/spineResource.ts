/**
 * 
 * @packageDocumentation
 */

import { getPluginData, hasChildren, isFigmaBox, isFigmaComponentInstance } from "utilities/figma";
import { generateSpineScenePath } from "utilities/path";
import { runVariantPipeline } from "utilities/variantPipeline";

const SPINE_VARIANT_PIPELINE: VariantPipeline<SpineVariantPipelineData, SpineResourceData> = {
  process: extractSpineData,
}

export async function extractSpineData(data: SpineVariantPipelineData, spineData: SpineResourceData = {}): Promise<SpineResourceData> {
  const { layer, skipVariants } = data;
  if (isFigmaBox(layer)) {
    const spineResourceData = processSpineResourceData(layer);
    if (spineResourceData) {
      spineData = { ...spineData, ...spineResourceData };
    }
    if (hasChildren(layer)) {
      const childrenData = await processChildrenSpineData(layer, skipVariants);
      spineData = { ...spineData, ...childrenData };
    }
    if (!skipVariants && isFigmaComponentInstance(layer)) {
      const variantData = await runVariantPipeline(SPINE_VARIANT_PIPELINE, { layer, skipVariants: true }, spineData);
      spineData = { ...spineData, ...variantData };
    }
  }
  return spineData;
}

function processSpineResourceData(layer: BoxLayer) {
  const data = getPluginData(layer, "defoldGUINode");
  if (canProcessSpineResourceData(data)) {
    const { replace_spine_name: name, replace_spine_path: path } = data;
    const spinePath = generateSpineScenePath(path, name)
    return { [name]: spinePath }
  }
  return null;
}

function canProcessSpineResourceData(data: WithNull<PluginGUINodeData>): data is PluginGUINodeData & { replace_spine: boolean, replace_spine_name: string } {
  return !!data && data.replace_spine && !!data.replace_spine_name;
}

async function processChildrenSpineData(layer: BoxLayer, skipVariants: boolean) {
  let spineData: SpineResourceData = {};
  for (const child of layer.children) {
    const data = { layer: child, skipVariants };
    const childData = await extractSpineData(data);
    spineData = { ...spineData, ...childData };
  }
  return spineData;
}

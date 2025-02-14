import { exportGUIAtlases } from "handoff/atlas";
import { GUI_EXPORT_PIPELINE, GUI_SPINES_EXPORT_PIPELINE, GUI_SPINE_ATTACHMENTS_EXPORT_PIPELINE } from "utilities/gui";
import { packGUI } from "utilities/guiExport";
import { SPINE_SERIALIZATION_PIPELINE } from "utilities/spine";
import { runTransformPipelines } from "utilities/transformPipeline";

export async function exportGUISpines(layers: Exclude<ExportableLayer, SliceLayer>[]): Promise<BundleData> {
  const data = packGUI(layers, true, true, true);
  const exportGUIData = await runTransformPipelines(GUI_EXPORT_PIPELINE, data);
  const exportSpineData = await runTransformPipelines(GUI_SPINES_EXPORT_PIPELINE, exportGUIData);
  const serializedGUIAtlasData = await exportGUIAtlases(layers, true, true, true);
  const serializedSpineData = await runTransformPipelines(SPINE_SERIALIZATION_PIPELINE, exportSpineData);
  const bundle: BundleData = {
    spines: serializedSpineData,
    atlases: serializedGUIAtlasData,
  };
  return bundle;
}

export async function exportGUISpineAttachments(layers: Exclude<ExportableLayer, SliceLayer>[]): Promise<BundleData> {
  const data = packGUI(layers, true, true, true);
  const exportGUIData = await runTransformPipelines(GUI_EXPORT_PIPELINE, data);
  const exportSpineData = await runTransformPipelines(GUI_SPINE_ATTACHMENTS_EXPORT_PIPELINE, exportGUIData);
  const serializedGUIAtlasData = await exportGUIAtlases(layers, true, true, true);
  const serializedSpineData = await runTransformPipelines(SPINE_SERIALIZATION_PIPELINE, exportSpineData);
  const bundle: BundleData = {
    spines: serializedSpineData,
    atlases: serializedGUIAtlasData,
  };
  return bundle;
}

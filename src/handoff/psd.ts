import { GUI_EXPORT_PIPELINE, GUI_PSD_EXPORT_PIPELINE } from "utilities/gui";
import { packGUI } from "utilities/guiExport";
import { runTransformPipelines } from "utilities/transformPipeline";
import { PSD_SERIALIZATION_PIPELINE } from "utilities/psd"

export async function exportGUIPSD(layers: Exclude<ExportableLayer, SliceLayer>[]): Promise<BundleData> {
  const data = packGUI(layers, true, true, true);
  const exportGUIData = await runTransformPipelines(GUI_EXPORT_PIPELINE, data);
  const exportPSDData = await runTransformPipelines(GUI_PSD_EXPORT_PIPELINE, exportGUIData);
  const serializedGUIPSDData = await runTransformPipelines(PSD_SERIALIZATION_PIPELINE, exportPSDData);
  const bundle: BundleData = {
    psd: serializedGUIPSDData,
  };
  return bundle;
}

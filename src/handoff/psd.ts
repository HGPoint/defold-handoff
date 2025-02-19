import { GUI_EXPORT_PIPELINE, GUI_PSD_EXPORT_PIPELINE } from "utilities/gui";
import { packGUI } from "utilities/guiExport";
import { PSD_SERIALIZATION_PIPELINE } from "utilities/psd";
import { runTransformPipelines } from "utilities/transformPipeline";

export async function exportGUIPSD(layers: Exclude<ExportableLayer, SliceLayer>[]): Promise<SerializedPSDData[]> {
  const options: GUIPackOptions = {
    textAsSprites: true,
    collapseEmpty: true,
    collapseTemplates: true,
  }
  const data = packGUI(layers, options);
  const exportGUIData = await runTransformPipelines(GUI_EXPORT_PIPELINE, data);
  const exportPSDData = await runTransformPipelines(GUI_PSD_EXPORT_PIPELINE, exportGUIData);
  const serializedGUIPSDData = await runTransformPipelines(PSD_SERIALIZATION_PIPELINE, exportPSDData);
  return serializedGUIPSDData;
}

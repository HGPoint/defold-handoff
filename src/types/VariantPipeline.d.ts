type VariantPipeline<TData extends { layer: SceneNode }, TProcessedData> = {
  process: VariantPipelineProcess<TData, TProcessedData>,
}

type VariantPipelineProcess<TData, TProcessedData> = (data: TData) => Promise<TProcessedData>;

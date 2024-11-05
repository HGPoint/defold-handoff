type UpdatePipeline<TData> = {
  ensureLayer: UpdatePipelineEnsureLayer,
  extractOriginalData: UpdatePipelineExtractOriginalData<TData>,
  beforeUpdate?: UpdatePipelineBeforeUpdate<TData>,
  update: UpdatePipelineUpdate<TData>,
  updateValidator?: UpdateValidator<TData>
  afterUpdate?: UpdatePipelineAfterUpdate<TData>
}

type UpdatePipelineEnsureLayer = (layer: ExportableLayer) => WithNull<DataLayer>;

type UpdatePipelineExtractOriginalData<TData> = (layer: DataLayer) => Promise<WithNull<TData>>;

type UpdatePipelineBeforeUpdate<TData> = (layer: DataLayer, update: TData, originalData: WithNull<TData>) => Promise<TData>;

type UpdatePipelineUpdate<TData> = (layer: DataLayer, update: TData, originalData: WithNull<TData>) => Promise<boolean>;

type UpdateValidator<TData> = (layer: DataLayer, update: TData, originalData: WithNull<TData>) => Promise<boolean>;

type UpdatePipelineAfterUpdate<TData> = (layer: DataLayer, update: TData, originalData: WithNull<TData>) => Promise<void>;
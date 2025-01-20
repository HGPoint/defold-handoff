type TransformPipeline<TData, TTransformedData> = {
  extractResources?: TransformPipelineExtractResources<TData>,
  beforeTransform?: TransformPipelineBeforeTransform<TData>,
  transform: TransformPipelineTransform<TData, TTransformedData>,
  afterTransform?: TransformPipelineAfterTransform<TTransformedData>,
  transformValidator?: TransformValidator<TTransformedData>
}

type TransformPipelineExtractResources<TData> = (input: TData) => Promise<PipelineResources>;

type TransformPipelineBeforeTransform<TData> = (input: TData) => Promise<TData>;

type TransformPipelineTransform<TData, TTransformedData> = (input: TData, resources?: PipelineResources) => Promise<TTransformedData>;

type TransformPipelineAfterTransform<TTransformedData> = (input: TTransformedData) => Promise<TTransformedData>;

type TransformValidator<TTransformedData> = (data: TTransformedData) => Promise<boolean>;

type SerializedDataBase = {
  name: string,
  data: string,
  filePath?: string,
};

type SerializedData<TSerializedData> = SerializedDataBase | TSerializedData

type PipelineResources = {
  textures?: TextureResourceData,
  fonts?: FontData,
  layers?: LayerData,
}

type VariantExtractor<TData> = (layer: ExportableLayer, skipVariants?: boolean) => Promise<TData>;

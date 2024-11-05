/**
 * Provides pipeline for data transformation.
 * @packageDocumentation
 */

/**
 * Runs pipelines for transforming data.
 * @param pipeline - The transform pipeline to execute.
 * @param inputs - The data to transform.
 * @returns The results of the transform pipelines.
 */
export async function runTransformPipelines<TData, TTransformedData>(pipeline: TransformPipeline<TData, TTransformedData>, inputs: TData[]) {
  const results: TTransformedData[] = [];
  for (const data of inputs) {
    const result = await runTransformPipeline(pipeline, data);
    results.push(result);
  }
  return results;
}

/**
 * Runs a pipeline for transforming data.
 * @param pipeline - The transform pipeline to execute.
 * @param data - The data to transform.
 * @returns The result of the transform pipeline.
 */
export async function runTransformPipeline<TData, TTransformedData>(pipeline: TransformPipeline<TData, TTransformedData>, data: TData) {
  const [ pipelineLayer, resources ] = await runPreparationPipelineSteps(pipeline, data);
  const transformedData = await runTransformPipelineSteps(pipeline, pipelineLayer, resources);
  const postProcessedData = await runPostProcessingPipelineSteps(pipeline, transformedData); 
  return postProcessedData;
}

/**
 * Runs the preparation steps of the transform pipeline.
 * @param pipeline - The transform pipeline to execute.
 * @param data - The data to transform.
 * @returns The preprocessed data and resources.
 */
async function runPreparationPipelineSteps<TData, TTransformedData>(pipeline: TransformPipeline<TData, TTransformedData>, data: TData) {
  return Promise.all([
    runPreprocessingPipelineStep(pipeline, data),
    runResourcesPipelineStep(pipeline, data),
  ]);
}

/**
 * Runs the preprocessing step of the transform pipeline.
 * @param pipeline - The transform pipeline to execute.
 * @param data - The data to transform.
 * @returns The preprocessed data.
 */
async function runPreprocessingPipelineStep<TData, TTransformedData>(pipeline: TransformPipeline<TData, TTransformedData>, data: TData) {
  if (pipeline.beforeTransform) {
    const preprocessedData = await pipeline.beforeTransform(data);
    return preprocessedData; 
  }
  return data;
}

/**
 * Runs the resources extraction step of the transform pipeline.
 * @param pipeline - The transform pipeline to execute.
 * @param data - The data to transform.
 * @returns The resources extracted from the data.
 */
async function runResourcesPipelineStep<TData, TTransformedData>(pipeline: TransformPipeline<TData, TTransformedData>, data: TData) {
  if (pipeline.extractResources) {
    const resources = await pipeline.extractResources(data);
    return resources;
  }
}

/**
 * Runs the transformation steps of the transform pipeline.
 * @param pipeline - The transform pipeline to execute.
 * @param data - The data to transform.
 * @param resources - The resources to use during transformation.
 * @returns The transformed data.
 */
async function runTransformPipelineSteps<TData, TTransformedData>(pipeline: TransformPipeline<TData, TTransformedData>, data: TData, resources?: PipelineResources) {
  const transformedData = await pipeline.transform(data, resources);
  return transformedData;
}

/**
 * Runs the post-processing steps of the transform pipeline.
 * @param pipeline - The transform pipeline to execute.
 * @param data - The data to transform.
 * @returns The post-processed data.
 */
async function runPostProcessingPipelineSteps<TData, TTransformedData>(pipeline: TransformPipeline<TData, TTransformedData>, data: TTransformedData) {
  if (pipeline.afterTransform) {
    const postProcessedData = await pipeline.afterTransform(data);
    if (pipeline.transformValidator) {
      if (!await pipeline.transformValidator(postProcessedData)) {
        throw new Error("Data is invalid.");
      }
    }
    return postProcessedData;
  }
  return data;
}

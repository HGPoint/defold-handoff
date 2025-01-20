/**
 * Provides pipeline for data editing.
 * @packageDocumentation
 */

/**
 * Runs pipelines for updating layer data.
 * @param pipeline - The update pipeline to execute.
 * @param layers - The layers to update.
 * @param updates - The updates to apply to each layer.
 * @returns The results of the update pipelines.
 */
export async function runUpdatePipelines<TData>(pipeline: UpdatePipeline<TData>, layers: DataLayer[], updates: TData[]) {
  const pipelinePromises = updates.map((update, index) => runUpdatePipeline(pipeline, layers[index], update));
  return Promise.all(pipelinePromises);
}

/**
 * Runs a pipeline for updating layer data.
 * @param pipeline - The update pipeline to execute.
 * @param originalLayer - The layer to update.
 * @param update - The update to apply.
 * @returns The result of the update pipeline.
 */
export async function runUpdatePipeline<TData>(pipeline: UpdatePipeline<TData>, originalLayer: DataLayer, update: TData) {
  const layer = pipeline.ensureLayer(originalLayer);
  if (layer) {
    const originalData = await pipeline.extractOriginalData(layer);
    const preprocessedUpdate = await runPreprocessingPipelineStep(pipeline, layer, update, originalData);
    const result = await runUpdatePipelineSteps(pipeline, layer, preprocessedUpdate, originalData);
    await runAfterUpdatePipelineStep(pipeline, layer, preprocessedUpdate, originalData);
    return result;
  }
}

/**
 * Runs the preprocessing step of the update pipeline.
 * @param pipeline - The update pipeline to execute.
 * @param layer - The layer to update.
 * @param update - The update data to preprocess.
 * @param originalData - The original data of the layer.
 * @returns The preprocessed data.
 */
async function runPreprocessingPipelineStep<TData>(pipeline: UpdatePipeline<TData>, layer: DataLayer, update: TData, originalData: WithNull<TData>) {
  if (pipeline.beforeUpdate) {
    const preprocessedData = await pipeline.beforeUpdate(layer, update, originalData);
    return preprocessedData;
  }
  return update;
}

/**
 * Runs the update step of the update pipeline.
 * @param pipeline - The update pipeline to execute.
 * @param layer - The layer to update.
 * @param update - The update to apply.
 * @param originalData - The original data of the layer.
 * @returns The result of the update step.
 * @throws Will throw an error if the update fails or the data is invalid.
 */
async function runUpdatePipelineSteps<TData>(pipeline: UpdatePipeline<TData>, layer: DataLayer, update: TData, originalData: WithNull<TData>) {
  const result = await pipeline.update(layer, update, originalData);
  if (result) {
    if (pipeline.updateValidator) {
      if (!await pipeline.updateValidator(layer, update, originalData)) {
        throw new Error("Data is invalid.");
      }
    }
  }
  return result;
}

/**
 * Runs the after update step of the update pipeline.
 * @param pipeline - The update pipeline to execute.
 * @param layer - The layer to update.
 * @param update - The update data.
 * @param originalData - The original data of the layer.
 */
async function runAfterUpdatePipelineStep<TData>(pipeline: UpdatePipeline<TData>, layer: DataLayer, update: TData, originalData: WithNull<TData>) {
  if (pipeline.afterUpdate) {
    await pipeline.afterUpdate(layer, update, originalData);
  }
}

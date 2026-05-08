"use client";

import { type ModelId, isModelId } from "./modelConfig";

const TRAINED_MODELS_STORAGE_KEY = "modelling:trained-models:v3";

export function readTrainedModels() {
  if (typeof window === "undefined") {
    return new Set<ModelId>();
  }

  try {
    const storedModels = JSON.parse(window.localStorage.getItem(TRAINED_MODELS_STORAGE_KEY) ?? "[]");

    if (!Array.isArray(storedModels)) {
      return new Set<ModelId>();
    }

    const validModels = storedModels.filter((model): model is ModelId => isModelId(model));
    return new Set<ModelId>(validModels);
  } catch {
    return new Set<ModelId>();
  }
}

export function writeTrainedModels(models: Set<ModelId>) {
  window.localStorage.setItem(TRAINED_MODELS_STORAGE_KEY, JSON.stringify([...models]));
}

export function markModelAsTrained(modelId: ModelId) {
  const trainedModels = readTrainedModels();
  trainedModels.add(modelId);
  writeTrainedModels(trainedModels);
}

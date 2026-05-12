"use client";

import { type ModelId, isModelId } from "./modelConfig";

export type ModelTrainingResult = {
  pred_carnivores: number;
  pred_herbivores: number;
};

const TRAINED_MODELS_STORAGE_KEY = "modelling:trained-models:v4";
const LEGACY_TRAINED_MODELS_STORAGE_KEY = "modelling:trained-models:v3";

function readStoredTrainingResults() {
  if (typeof window === "undefined") {
    return {};
  }

  window.localStorage.removeItem(LEGACY_TRAINED_MODELS_STORAGE_KEY);

  try {
    const storedResults = JSON.parse(window.sessionStorage.getItem(TRAINED_MODELS_STORAGE_KEY) ?? "{}");

    if (!storedResults || typeof storedResults !== "object" || Array.isArray(storedResults)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(storedResults).filter(([modelId, result]) => {
        if (!isModelId(modelId) || !result || typeof result !== "object" || Array.isArray(result)) {
          return false;
        }

        const candidate = result as Record<string, unknown>;
        return typeof candidate.pred_carnivores === "number" && typeof candidate.pred_herbivores === "number";
      }),
    ) as Partial<Record<ModelId, ModelTrainingResult>>;
  } catch {
    return {};
  }
}

export function readTrainedModels() {
  if (typeof window === "undefined") {
    return new Set<ModelId>();
  }

  return new Set<ModelId>(Object.keys(readStoredTrainingResults()).filter(isModelId));
}

export function readModelTrainingResults() {
  return readStoredTrainingResults();
}

export function markModelAsTrained(modelId: ModelId, result: ModelTrainingResult) {
  window.sessionStorage.setItem(
    TRAINED_MODELS_STORAGE_KEY,
    JSON.stringify({
      ...readStoredTrainingResults(),
      [modelId]: result,
    }),
  );
}

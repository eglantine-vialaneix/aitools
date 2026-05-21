"use client";

import { useEffect, useState } from "react";
import { type ModelId, type ModellingCondition, isCondition, isModelId } from "./modelConfig";
import { type PredictionTableRow } from "./tableRows";

export type ModelTrainingResult = {
  pred_carnivores: number;
  pred_herbivores: number;
  predictionRows?: PredictionTableRow[];
};

const TRAINED_MODELS_STORAGE_KEY = "modelling:trained-models:v6";
const LEGACY_TRAINED_MODELS_WITHOUT_PREDICTIONS_STORAGE_KEY = "modelling:trained-models:v5";
const LEGACY_SESSION_TRAINED_MODELS_STORAGE_KEY = "modelling:trained-models:v4";
const LEGACY_TRAINED_MODELS_STORAGE_KEY = "modelling:trained-models:v3";

const TRAINED_MODELS_CHANGE_EVENT = "modelling:trained-models-change";

type StoredTrainingResults = Partial<Record<ModellingCondition, Partial<Record<ModelId, ModelTrainingResult>>>>;

function isModelTrainingResult(value: unknown): value is ModelTrainingResult {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;
  const hasValidCounts = typeof candidate.pred_carnivores === "number" && typeof candidate.pred_herbivores === "number";
  const hasValidPredictionRows =
    candidate.predictionRows === undefined ||
    (Array.isArray(candidate.predictionRows) &&
      candidate.predictionRows.every(
        (row) => row && typeof row === "object" && !Array.isArray(row),
      ));

  return hasValidCounts && hasValidPredictionRows;
}

function readStoredTrainingResults(): StoredTrainingResults {
  if (typeof window === "undefined") {
    return {};
  }

  window.sessionStorage.removeItem(LEGACY_TRAINED_MODELS_WITHOUT_PREDICTIONS_STORAGE_KEY);
  window.localStorage.removeItem(LEGACY_TRAINED_MODELS_STORAGE_KEY);
  window.sessionStorage.removeItem(LEGACY_SESSION_TRAINED_MODELS_STORAGE_KEY);

  try {
    const storedResults = JSON.parse(window.sessionStorage.getItem(TRAINED_MODELS_STORAGE_KEY) ?? "{}");

    if (!storedResults || typeof storedResults !== "object" || Array.isArray(storedResults)) {
      return {};
    }

    return Object.fromEntries(
      Object.entries(storedResults).filter(([condition, modelResults]) => {
        if (!isCondition(condition) || !modelResults || typeof modelResults !== "object" || Array.isArray(modelResults)) {
          return false;
        }
        return Object.entries(modelResults).some(([modelId, result]) => isModelId(modelId) && isModelTrainingResult(result));
      }).map(([condition, modelResults]) => [
        condition,
        Object.fromEntries(
          Object.entries(modelResults as Record<string, unknown>).filter(([modelId, result]) => isModelId(modelId) && isModelTrainingResult(result)),
        ),
      ]),
    ) as StoredTrainingResults;
  } catch {
    return {};
  }
}

export function readTrainedModels(condition: ModellingCondition) {
  if (typeof window === "undefined") {
    return new Set<ModelId>();
  }

  return new Set<ModelId>(Object.keys(readStoredTrainingResults()[condition] ?? {}).filter(isModelId));
}

export function readModelTrainingResults(condition: ModellingCondition) {
  return readStoredTrainingResults()[condition] ?? {};
}

export function markModelAsTrained(modelId: ModelId, result: ModelTrainingResult, condition: ModellingCondition) {
  const storedResults = readStoredTrainingResults();

  window.sessionStorage.setItem(
    TRAINED_MODELS_STORAGE_KEY,
    JSON.stringify({
      ...storedResults,
      [condition]: {
        ...(storedResults[condition] ?? {}),
        [modelId]: result,
      },
    }),
  );
  window.dispatchEvent(new Event(TRAINED_MODELS_CHANGE_EVENT));
}


//// Instead of reading sessionStorage directly during render (which causes a server/client mismatch),
// these hooks start empty (matching the server) and load the real data after the page mounts in the browser.
// They also listen for TRAINED_MODELS_CHANGE_EVENT so the UI updates instantly when a model is trained.
export function useTrainedModels(condition: ModellingCondition) {
  const [trainedModels, setTrainedModels] = useState<Set<ModelId>>(new Set());
  useEffect(() => {
    const update = () => setTrainedModels(readTrainedModels(condition));
    update();
    window.addEventListener(TRAINED_MODELS_CHANGE_EVENT, update);
    return () => window.removeEventListener(TRAINED_MODELS_CHANGE_EVENT, update);
  }, [condition]);
  return trainedModels;
}

export function useModelTrainingResults(condition: ModellingCondition) {
  const [results, setResults] = useState<Partial<Record<ModelId, ModelTrainingResult>>>({});
  useEffect(() => {
    const update = () => setResults(readModelTrainingResults(condition));
    update();
    window.addEventListener(TRAINED_MODELS_CHANGE_EVENT, update);
    return () => window.removeEventListener(TRAINED_MODELS_CHANGE_EVENT, update);
  }, [condition]);
  return results;
}
"use client";

import { useSyncExternalStore } from "react";
import { type ModellingCondition } from "@/app/modelling/modelConfig";

export type ExperimentCondition = "C1" | "C2" | "C3";
export type ExperimentStep = "data_labelling" | "feature_selection" | "modelling" | "evaluation";

const EXPERIMENT_CONDITION_STORAGE_KEY = "mobots:experiment-condition";
const EXPERIMENT_CONDITION_CHANGE_EVENT = "mobots:experiment-condition-change";

export const EXPERIMENT_CONDITIONS: {
  id: ExperimentCondition;
  label: string;
}[] = [
  { id: "C1", label: "C1 (Glass-Box)" },
  { id: "C2", label: "C2 (Grey-Box)" },
  { id: "C3", label: "C3 (Black-Box)" },
];

export function isExperimentCondition(value: string | null): value is ExperimentCondition {
  return value === "C1" || value === "C2" || value === "C3";
}

export function saveExperimentCondition(condition: ExperimentCondition) {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.setItem(EXPERIMENT_CONDITION_STORAGE_KEY, condition);
  window.dispatchEvent(new Event(EXPERIMENT_CONDITION_CHANGE_EVENT));
}

export function readExperimentCondition() {
  if (typeof window === "undefined") {
    return null;
  }

  const storedCondition = window.sessionStorage.getItem(EXPERIMENT_CONDITION_STORAGE_KEY);

  return isExperimentCondition(storedCondition) ? storedCondition : null;
}

export function clearExperimentCondition() {
  if (typeof window === "undefined") {
    return;
  }

  window.sessionStorage.removeItem(EXPERIMENT_CONDITION_STORAGE_KEY);
  window.dispatchEvent(new Event(EXPERIMENT_CONDITION_CHANGE_EVENT));
}

function subscribeToExperimentCondition(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(EXPERIMENT_CONDITION_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(EXPERIMENT_CONDITION_CHANGE_EVENT, onStoreChange);
  };
}

export function useExperimentCondition() {
  return useSyncExternalStore(subscribeToExperimentCondition, readExperimentCondition, () => null);
}

export function conditionForStep(
  experimentCondition: ExperimentCondition | null,
  step: ExperimentStep,
): ModellingCondition | null {
  if (!experimentCondition) {
    return null;
  }

  if (experimentCondition === "C1") {
    return "WB";
  }

  if (experimentCondition === "C2") {
    return step === "modelling" || step === "evaluation" ? "BB" : "WB";
  }

  return "BB";
}

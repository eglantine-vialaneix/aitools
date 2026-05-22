"use client";

export type SavedEvaluationResponses = {
  savedAt: string;
  condition: string;
  selectedFeatures: string[];
  accuracyInputs: Record<string, string>;
  matrixInputs: Record<string, string>;
  reflectionAnswers: string[];
};

const EVALUATION_RESPONSES_STORAGE_KEY = "mobots:evaluation-responses";

export function saveEvaluationResponses(responses: SavedEvaluationResponses) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(EVALUATION_RESPONSES_STORAGE_KEY, JSON.stringify(responses));
}

export function readEvaluationResponses(): SavedEvaluationResponses | null {
  if (typeof window === "undefined") {
    return null;
  }

  const rawResponses = window.localStorage.getItem(EVALUATION_RESPONSES_STORAGE_KEY);

  if (!rawResponses) {
    return null;
  }

  try {
    return JSON.parse(rawResponses) as SavedEvaluationResponses;
  } catch {
    return null;
  }
}

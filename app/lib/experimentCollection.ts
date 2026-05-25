"use client";

import { readDinoLabels, type DinoLabelMap } from "@/app/lib/dinoLabels";
import { readExperimentCondition, type ExperimentCondition } from "@/app/lib/experimentCondition";
import { readSelectedFeatures } from "@/app/lib/featureSelectionState";
import { type IdentificationGroup, type IdentificationKey } from "@/app/components/key";

export type FeatureTypeAttempts = Record<number, Record<string, string>>;
export type TrainedTreeNode = string | Record<string, { yes: TrainedTreeNode; no: TrainedTreeNode }>;

export type ExperimentCollection = {
  StartTime: string | null;
  UserIDs: string[];
  GroupNb: number | null;
  Condition: ExperimentCondition | null;
  DLStartTime: string | null;
  DataLabels: DinoLabelMap | null;
  DataLabellingNotes: string;
  DLEndTime: string | null;
  FSStartTime: string | null;
  SelectedFeatures: string[] | null;
  FeatureTypes: FeatureTypeAttempts | null;
  FeatureSelectionReason: string;
  FeatureImportanceOrder: string;
  FSEndTime: string | null;
  ModelStartTime: string | null;
  TrainedTree: TrainedTreeNode | null;
  BBModellingAnswers: string | null;
  ModelEndTime: string | null;
  EvalStartTime: string | null;
  AccuracyAttempts: number;
  EvalAnswers: string;
  EvalEndTime: string | null;
};

const EXPERIMENT_COLLECTION_STORAGE_KEY = "mobots:experiment-collection";
const EXPERIMENT_COLLECTION_CHANGE_EVENT = "mobots:experiment-collection-change";

function now() {
  return new Date().toISOString();
}

function emptyCollection(): ExperimentCollection {
  return {
    StartTime: null,
    UserIDs: [],
    GroupNb: null,
    Condition: null,
    DLStartTime: null,
    DataLabels: null,
    DataLabellingNotes: "",
    DLEndTime: null,
    FSStartTime: null,
    SelectedFeatures: null,
    FeatureTypes: null,
    FeatureSelectionReason: "",
    FeatureImportanceOrder: "",
    FSEndTime: null,
    ModelStartTime: null,
    TrainedTree: null,
    BBModellingAnswers: null,
    ModelEndTime: null,
    EvalStartTime: null,
    AccuracyAttempts: 0,
    EvalAnswers: "",
    EvalEndTime: null,
  };
}

function groupToNumber(group: IdentificationGroup) {
  return typeof group === "number" ? group : 0;
}

function normalizeCollection(value: unknown): ExperimentCollection {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return emptyCollection();
  }

  return {
    ...emptyCollection(),
    ...(value as Partial<ExperimentCollection>),
  };
}

export function readExperimentCollection(): ExperimentCollection {
  if (typeof window === "undefined") {
    return emptyCollection();
  }

  try {
    return normalizeCollection(
      JSON.parse(window.localStorage.getItem(EXPERIMENT_COLLECTION_STORAGE_KEY) ?? "null"),
    );
  } catch {
    return emptyCollection();
  }
}

export function updateExperimentCollection(
  updater: (currentCollection: ExperimentCollection) => ExperimentCollection,
) {
  if (typeof window === "undefined") {
    return;
  }

  const nextCollection = updater(readExperimentCollection());
  window.localStorage.setItem(EXPERIMENT_COLLECTION_STORAGE_KEY, JSON.stringify(nextCollection));
  window.dispatchEvent(new Event(EXPERIMENT_COLLECTION_CHANGE_EVENT));
}

export function startExperiment({
  condition,
  group,
  keys,
}: {
  condition: ExperimentCondition;
  group: IdentificationGroup;
  keys: IdentificationKey[];
}) {
  updateExperimentCollection(() => ({
    ...emptyCollection(),
    StartTime: now(),
    UserIDs: keys.map(String),
    GroupNb: groupToNumber(group),
    Condition: condition,
  }));
}

export function markCollectionStepStart(step: "DL" | "FS" | "Model" | "Eval") {
  const key = `${step}StartTime` as keyof ExperimentCollection;

  updateExperimentCollection((currentCollection) => ({
    ...currentCollection,
    [key]: currentCollection[key] ?? now(),
  }));
}

export function saveDataLabellingEnd(notes: string, labels: DinoLabelMap = readDinoLabels()) {
  const condition = readExperimentCondition();

  updateExperimentCollection((currentCollection) => ({
    ...currentCollection,
    Condition: currentCollection.Condition ?? condition,
    DataLabels: condition === "C3" ? null : labels,
    DataLabellingNotes: notes,
    DLEndTime: now(),
  }));
}

export function saveFeatureSelectionEnd({
  selectedFeatures,
  featureTypes,
  featureSelectionReason,
  featureImportanceOrder,
}: {
  selectedFeatures?: string[];
  featureTypes?: FeatureTypeAttempts;
  featureSelectionReason?: string;
  featureImportanceOrder?: string;
}) {
  const condition = readExperimentCondition();

  updateExperimentCollection((currentCollection) => ({
    ...currentCollection,
    Condition: currentCollection.Condition ?? condition,
    SelectedFeatures: condition === "C3" ? null : selectedFeatures ?? readSelectedFeatures(),
    FeatureTypes: condition === "C3" ? featureTypes ?? currentCollection.FeatureTypes : null,
    FeatureSelectionReason: featureSelectionReason ?? currentCollection.FeatureSelectionReason,
    FeatureImportanceOrder: featureImportanceOrder ?? currentCollection.FeatureImportanceOrder,
    FSEndTime: now(),
  }));
}

export function saveFeatureTypeAttempt(attemptNumber: number, selectedTypes: Record<string, string | undefined>) {
  updateExperimentCollection((currentCollection) => ({
    ...currentCollection,
    FeatureTypes: {
      ...(currentCollection.FeatureTypes ?? {}),
      [attemptNumber]: Object.fromEntries(
        Object.entries(selectedTypes).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
      ),
    },
  }));
}

export function saveTrainedTree(trainedTree: TrainedTreeNode | null) {
  updateExperimentCollection((currentCollection) => ({
    ...currentCollection,
    TrainedTree: currentCollection.Condition === "C1" ? trainedTree : null,
  }));
}

export function saveModelEnd(blackBoxAnswers: string | null) {
  const condition = readExperimentCondition();

  updateExperimentCollection((currentCollection) => ({
    ...currentCollection,
    TrainedTree: condition === "C1" ? currentCollection.TrainedTree : null,
    BBModellingAnswers: condition === "C1" ? null : blackBoxAnswers,
    ModelEndTime: now(),
  }));
}

export function saveEvaluationEnd({
  accuracyAttempts,
  evalAnswers,
}: {
  accuracyAttempts: number;
  evalAnswers: string;
}) {
  updateExperimentCollection((currentCollection) => ({
    ...currentCollection,
    AccuracyAttempts: accuracyAttempts,
    EvalAnswers: evalAnswers,
    EvalEndTime: now(),
  }));
}

export async function submitExperimentCollection() {
  const collection = readExperimentCollection();
  const response = await fetch("/api/experiment/collection", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(collection),
  });

  if (!response.ok) {
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    throw new Error(payload?.error ?? "Impossible de sauvegarder les données de l'expérience.");
  }

  return response.json();
}

"use client";

import {
  MODEL_CONFIGS,
  type ModelDataFile,
  type ModelId,
  type ModellingCondition,
} from "./modelConfig";

export type ModelInput = {
  features: string[];
  data: ModelDataFile;
  init_carnivores: number;
  init_herbivores: number;
};

export type GiniFeatureScore = {
  feature: string;
  gini: number;
};

const BLACK_BOX_FEATURES: Record<ModelId, string[]> = {
  A: ["longueur (m)", "poids (kg)", "espèce", "sous-ordre_taxonomique"],
  B: ["sous-ordre_taxonomique", "espèce"],
  C: ["longueur (m)", "poids (kg)", "espèce", "sous-ordre_taxonomique"],
};

function fallbackFeatures(modelId: ModelId) {
  return MODEL_CONFIGS[modelId].features;
}

export function bestAndWorstGiniFeatures(results: GiniFeatureScore[]) {
  const sortedResults = [...results].sort((first, second) => first.gini - second.gini);
  const bestFeature = sortedResults[0]?.feature;
  const worstFeature = sortedResults.at(-1)?.feature;

  return [...new Set([bestFeature, worstFeature].filter((feature): feature is string => Boolean(feature)))];
}

export function resolveModelInput({
  modelId,
  condition,
  selectedFeatures,
  modelBFeatures,
}: {
  modelId: ModelId;
  condition: ModellingCondition;
  selectedFeatures: string[];
  modelBFeatures: string[] | null;
}): ModelInput {
  if (condition === "BB") {
    const config = MODEL_CONFIGS[modelId];

    return {
      features: BLACK_BOX_FEATURES[modelId],
      data: config.data,
      init_carnivores: config.init_carnivores,
      init_herbivores: config.init_herbivores,
    };
  }

  const fullFeatureSet = selectedFeatures.length === 4 ? selectedFeatures : fallbackFeatures(modelId);

  if (modelId === "A") {
    return {
      features: fullFeatureSet,
      data: "df_train.csv",
      init_carnivores: 15,
      init_herbivores: 15,
    };
  }

  if (modelId === "B") {
    return {
      features: modelBFeatures?.length ? modelBFeatures : fullFeatureSet.slice(0, 2),
      data: "df_train.csv",
      init_carnivores: 15,
      init_herbivores: 15,
    };
  }

  return {
    features: fullFeatureSet,
    data: "df_train_partial.csv",
    init_carnivores: 5,
    init_herbivores: 5,
  };
}

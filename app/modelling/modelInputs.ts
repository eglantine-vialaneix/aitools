"use client";

import {
  MODEL_CONFIG,
  type ModelDataFile,
  type ModellingCondition,
} from "./modelConfig";

export type ModelInput = {
  features: string[];
  data: ModelDataFile;
  init_carnivores: number;
  init_herbivores: number;
};

const BLACK_BOX_FEATURES = [
  "longueur (m)",
  "poids (kg)",
  "espèce",
  "sous-ordre_taxonomique",
];

function fallbackFeatures() {
  return MODEL_CONFIG.features;
}

export function resolveModelInput({
  condition,
  selectedFeatures,
}: {
  condition: ModellingCondition;
  selectedFeatures: string[];
}): ModelInput {
  if (condition === "BB") {
    return {
      features: BLACK_BOX_FEATURES,
      data: MODEL_CONFIG.data,
      init_carnivores: MODEL_CONFIG.init_carnivores,
      init_herbivores: MODEL_CONFIG.init_herbivores,
    };
  }

  const fullFeatureSet = selectedFeatures.length === 4 ? selectedFeatures : fallbackFeatures();

  return {
    features: fullFeatureSet,
    data: MODEL_CONFIG.data,
    init_carnivores: MODEL_CONFIG.init_carnivores,
    init_herbivores: MODEL_CONFIG.init_herbivores,
  };
}

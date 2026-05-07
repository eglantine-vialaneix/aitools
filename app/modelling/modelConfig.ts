export type ModellingCondition = "BB" | "WB";
export type ModelId = "A" | "B" | "C";

export type ModelConfig = {
  id: ModelId;
  title: string;
  features: string[];
  data: string;
  pred_carnivores: number;
  pred_herbivores: number;
};

export const MODEL_IDS: ModelId[] = ["A", "B", "C"];

export const MODEL_CONFIGS: Record<ModelId, ModelConfig> = {
  A: {
    id: "A",
    title: "Modèle A",
    features: ["type", "longueur (m)", "poids (kg)", "bipède"],
    data: "full",
    pred_carnivores: 19,
    pred_herbivores: 11,
  },
  B: {
    id: "B",
    title: "Modèle B",
    features: ["habitat", "période", "famille_taxonomique", "longueur (m)"],
    data: "full",
    pred_carnivores: 16,
    pred_herbivores: 14,
  },
  C: {
    id: "C",
    title: "Modèle C",
    features: ["sous-ordre_taxonomique", "bipède", "poids (kg)", "nommé_par"],
    data: "partial",
    pred_carnivores: 21,
    pred_herbivores: 9,
  },
};

export function isCondition(value: string | null): value is ModellingCondition {
  return value === "BB" || value === "WB";
}

export function isModelId(value: string | null): value is ModelId {
  return value === "A" || value === "B" || value === "C";
}

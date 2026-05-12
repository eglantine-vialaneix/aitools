export type ModellingCondition = "BB" | "WB";
export type ModelId = "A" | "B" | "C";
export type ModelDataFile = "df_train.csv" | "df_train_partial.csv";

export type ModelConfig = {
  id: ModelId;
  title: string;
  dev_descr: string;
  features: string[];
  data: ModelDataFile;
  init_carnivores: number;
  init_herbivores: number;
  pred_carnivores: number;
  pred_herbivores: number;
};

export const MODEL_IDS: ModelId[] = ["A", "B", "C"];

export const MODEL_CONFIGS: Record<ModelId, ModelConfig> = {
  A: {
    id: "A",
    title: "Modèle A",
    dev_descr: "Full features, full data",
    features: [],
    data: "df_train.csv",
    init_carnivores: 15,
    init_herbivores: 15,
    pred_carnivores: -1,
    pred_herbivores: -1,
  },
  B: {
    id: "B",
    title: "Modèle B",
    dev_descr: "Partial features, full data",
    features: [],
    data: "df_train.csv",
    init_carnivores: 15,
    init_herbivores: 15,
    pred_carnivores: -1,
    pred_herbivores: -1,
  },
  C: {
    id: "C",
    title: "Modèle C",
    dev_descr: "Full features, partial data",
    features: [],
    data: "df_train_partial.csv",
    init_carnivores: 5,
    init_herbivores: 5,
    pred_carnivores: -1,
    pred_herbivores: -1,
  },
};

export function isCondition(value: string | null): value is ModellingCondition {
  return value === "BB" || value === "WB";
}

export function isModelId(value: string | null): value is ModelId {
  return value === "A" || value === "B" || value === "C";
}

export type ModellingCondition = "BB" | "WB";
export type ModelDataFile = "df_train.csv";

export type ModelConfig = {
  title: string;
  dev_descr: string;
  features: string[];
  data: ModelDataFile;
  init_carnivores: number;
  init_herbivores: number;
  pred_carnivores: number;
  pred_herbivores: number;
};

export const MODEL_CONFIG: ModelConfig = {
  title: "Modèle",
  dev_descr: "Selected features, full data",
  features: [],
  data: "df_train.csv",
  init_carnivores: 5,
  init_herbivores: 5,
  pred_carnivores: -1,
  pred_herbivores: -1,
};

export function isCondition(value: string | null): value is ModellingCondition {
  return value === "BB" || value === "WB";
}

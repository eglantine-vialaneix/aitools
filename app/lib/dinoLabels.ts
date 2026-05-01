"use client";

export type DinoDiet = "herbivore" | "carnivore";

export type DinoLabelMap = Record<string, DinoDiet>;

const DINO_LABELS_STORAGE_KEY = "mobots:dino-labels";

export function saveDinoLabels(labels: DinoLabelMap) {
  window.localStorage.setItem(DINO_LABELS_STORAGE_KEY, JSON.stringify(labels));
}

export function readDinoLabels(): DinoLabelMap {
  const rawLabels = window.localStorage.getItem(DINO_LABELS_STORAGE_KEY);

  if (!rawLabels) {
    return {};
  }

  try {
    const parsedLabels = JSON.parse(rawLabels) as Record<string, unknown>;

    return Object.fromEntries(
      Object.entries(parsedLabels).filter(
        (entry): entry is [string, DinoDiet] =>
          entry[1] === "herbivore" || entry[1] === "carnivore",
      ),
    );
  } catch {
    return {};
  }
}

export function clearDinoLabels() {
  window.localStorage.removeItem(DINO_LABELS_STORAGE_KEY);
}

"use client";

const SELECTED_FEATURES_STORAGE_KEY = "feature-selection:selected-features:v1";

export function readSelectedFeatures() {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const storedFeatures = JSON.parse(window.localStorage.getItem(SELECTED_FEATURES_STORAGE_KEY) ?? "[]");

    return Array.isArray(storedFeatures)
      ? storedFeatures.filter((feature): feature is string => typeof feature === "string")
      : [];
  } catch {
    return [];
  }
}

export function writeSelectedFeatures(features: string[]) {
  window.localStorage.setItem(SELECTED_FEATURES_STORAGE_KEY, JSON.stringify(features));
}

"use client";

import { useEffect, useState } from "react";

const SELECTED_FEATURES_STORAGE_KEY = "feature-selection:selected-features:v1";
const SELECTED_FEATURES_CHANGE_EVENT = "feature-selection:selected-features-change";

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
  window.dispatchEvent(new Event(SELECTED_FEATURES_CHANGE_EVENT));
}

export function useSelectedFeatures() {
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  useEffect(() => {
    const updateSelectedFeatures = () => {
      setSelectedFeatures(readSelectedFeatures());
    };

    updateSelectedFeatures();
    window.addEventListener("storage", updateSelectedFeatures);
    window.addEventListener(SELECTED_FEATURES_CHANGE_EVENT, updateSelectedFeatures);

    return () => {
      window.removeEventListener("storage", updateSelectedFeatures);
      window.removeEventListener(SELECTED_FEATURES_CHANGE_EVENT, updateSelectedFeatures);
    };
  }, []);

  return selectedFeatures;
}

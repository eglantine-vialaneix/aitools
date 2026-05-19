"use client";

export type IdentificationKeys = [string, string, string];

const IDENTIFICATION_KEYS_STORAGE_KEY = "mobots:identification-keys";
const EMPTY_IDENTIFICATION_KEYS: IdentificationKeys = ["", "", ""];

export function saveIdentificationKeys(keys: IdentificationKeys) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(IDENTIFICATION_KEYS_STORAGE_KEY, JSON.stringify(keys));
}

export function readIdentificationKeys(): IdentificationKeys {
  if (typeof window === "undefined") {
    return EMPTY_IDENTIFICATION_KEYS;
  }

  const rawKeys = window.localStorage.getItem(IDENTIFICATION_KEYS_STORAGE_KEY);

  if (!rawKeys) {
    return EMPTY_IDENTIFICATION_KEYS;
  }

  try {
    const parsedKeys = JSON.parse(rawKeys);

    if (!Array.isArray(parsedKeys)) {
      return EMPTY_IDENTIFICATION_KEYS;
    }

    return EMPTY_IDENTIFICATION_KEYS.map((_, index) =>
      typeof parsedKeys[index] === "string" ? parsedKeys[index] : "",
    ) as IdentificationKeys;
  } catch {
    return EMPTY_IDENTIFICATION_KEYS;
  }
}

export function clearIdentificationKeys() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(IDENTIFICATION_KEYS_STORAGE_KEY);
}

"use client";

import { useSyncExternalStore } from "react";

export type IdentificationKeys = [string, string, string];

const IDENTIFICATION_KEYS_STORAGE_KEY = "mobots:identification-keys";
const IDENTIFICATION_KEYS_CHANGE_EVENT = "mobots:identification-keys-change";
const EMPTY_IDENTIFICATION_KEYS: IdentificationKeys = ["", "", ""];
let cachedRawIdentificationKeys: string | null = null;
let cachedIdentificationKeys: IdentificationKeys = EMPTY_IDENTIFICATION_KEYS;

export function saveIdentificationKeys(keys: IdentificationKeys) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(IDENTIFICATION_KEYS_STORAGE_KEY, JSON.stringify(keys));
  window.dispatchEvent(new Event(IDENTIFICATION_KEYS_CHANGE_EVENT));
}

export function readIdentificationKeys(): IdentificationKeys {
  if (typeof window === "undefined") {
    return EMPTY_IDENTIFICATION_KEYS;
  }

  const rawKeys = window.localStorage.getItem(IDENTIFICATION_KEYS_STORAGE_KEY);

  if (rawKeys === cachedRawIdentificationKeys) {
    return cachedIdentificationKeys;
  }

  cachedRawIdentificationKeys = rawKeys;

  if (!rawKeys) {
    cachedIdentificationKeys = EMPTY_IDENTIFICATION_KEYS;

    return cachedIdentificationKeys;
  }

  try {
    const parsedKeys = JSON.parse(rawKeys);

    if (!Array.isArray(parsedKeys)) {
      cachedIdentificationKeys = EMPTY_IDENTIFICATION_KEYS;

      return cachedIdentificationKeys;
    }

    cachedIdentificationKeys = EMPTY_IDENTIFICATION_KEYS.map((_, index) =>
      typeof parsedKeys[index] === "string" ? parsedKeys[index] : "",
    ) as IdentificationKeys;

    return cachedIdentificationKeys;
  } catch {
    cachedIdentificationKeys = EMPTY_IDENTIFICATION_KEYS;

    return cachedIdentificationKeys;
  }
}

export function clearIdentificationKeys() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(IDENTIFICATION_KEYS_STORAGE_KEY);
  window.dispatchEvent(new Event(IDENTIFICATION_KEYS_CHANGE_EVENT));
}

function subscribeToIdentificationKeys(onStoreChange: () => void) {
  window.addEventListener("storage", onStoreChange);
  window.addEventListener(IDENTIFICATION_KEYS_CHANGE_EVENT, onStoreChange);

  return () => {
    window.removeEventListener("storage", onStoreChange);
    window.removeEventListener(IDENTIFICATION_KEYS_CHANGE_EVENT, onStoreChange);
  };
}

export function useIdentificationKeys() {
  return useSyncExternalStore(subscribeToIdentificationKeys, readIdentificationKeys, () =>
    EMPTY_IDENTIFICATION_KEYS,
  );
}

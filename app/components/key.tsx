import { type ExperimentCondition } from "@/app/lib/experimentCondition";

export type IdentificationGroup = 1 | 2 | "dev";

type IdentificationKeyMetadata = readonly [
  condition: ExperimentCondition,
  group: IdentificationGroup,
];

export type ValidIdentificationKeys = {
  condition: ExperimentCondition;
  group: IdentificationGroup;
  keys: IdentificationKey[];
};

export type IdentificationKeyValidation =
  | ({ isValid: true } & ValidIdentificationKeys)
  | {
      isValid: false;
      error: string;
    };

export const ALL_KEYS = [
  784, 212, 128,
  689, 316, 577,
  150, 585, 444,
  695, 476, 333,
  182, 378, 850,
  859, 204, 763,
] as const;

export const DEVELOPER_KEYS = [
  "C3devX", "C3devY",
  "C2devX", "C2devY",
  "C1devX", "C1devY",
] as const;

export type ParticipantIdentificationKey = (typeof ALL_KEYS)[number];
export type DeveloperIdentificationKey = (typeof DEVELOPER_KEYS)[number];
export type IdentificationKey = ParticipantIdentificationKey | DeveloperIdentificationKey;

export const KEYS_TO_GROUP: Record<IdentificationKey, IdentificationGroup> = {
  784: 1,
  212: 1,
  128: 1,
  689: 2,
  316: 2,
  577: 2,
  150: 1,
  585: 1,
  444: 1,
  695: 2,
  476: 2,
  333: 2,
  182: 1,
  378: 1,
  850: 1,
  859: 2,
  204: 2,
  763: 2,
  C3devX: "dev",
  C3devY: "dev",
  C2devX: "dev",
  C2devY: "dev",
  C1devX: "dev",
  C1devY: "dev",
};

export const KEYS_TO_COND: Record<IdentificationKey, ExperimentCondition> = {
  784: "C3",
  212: "C3",
  128: "C3",
  689: "C3",
  316: "C3",
  577: "C3",
  150: "C2",
  585: "C2",
  444: "C2",
  695: "C2",
  476: "C2",
  333: "C2",
  182: "C1",
  378: "C1",
  850: "C1",
  859: "C1",
  204: "C1",
  763: "C1",
  C3devX: "C3",
  C3devY: "C3",
  C2devX: "C2",
  C2devY: "C2",
  C1devX: "C1",
  C1devY: "C1",
};

export const KEYS_TO_COND_AND_GROUP: Record<IdentificationKey, IdentificationKeyMetadata> = {
  784: ["C3", 1],
  212: ["C3", 1],
  128: ["C3", 1],
  689: ["C3", 2],
  316: ["C3", 2],
  577: ["C3", 2],
  150: ["C2", 1],
  585: ["C2", 1],
  444: ["C2", 1],
  695: ["C2", 2],
  476: ["C2", 2],
  333: ["C2", 2],
  182: ["C1", 1],
  378: ["C1", 1],
  850: ["C1", 1],
  859: ["C1", 2],
  204: ["C1", 2],
  763: ["C1", 2],
  C3devX: ["C3", "dev"],
  C3devY: ["C3", "dev"],
  C2devX: ["C2", "dev"],
  C2devY: ["C2", "dev"],
  C1devX: ["C1", "dev"],
  C1devY: ["C1", "dev"],
};

const VALID_KEY_SET = new Set<number>(ALL_KEYS);
const VALID_DEVELOPER_KEY_SET = new Set<string>(DEVELOPER_KEYS);

function isParticipantIdentificationKey(key: number): key is ParticipantIdentificationKey {
  return VALID_KEY_SET.has(key);
}

function isDeveloperIdentificationKey(key: string): key is DeveloperIdentificationKey {
  return VALID_DEVELOPER_KEY_SET.has(key);
}

function parseIdentificationKey(key: string): IdentificationKey | null {
  if (isDeveloperIdentificationKey(key)) {
    return key;
  }

  if (!/^\d+$/.test(key)) {
    return null;
  }

  const numericKey = Number(key);

  if (String(numericKey) !== key || !isParticipantIdentificationKey(numericKey)) {
    return null;
  }

  return numericKey;
}

export function validateIdentificationKeys(
  rawKeys: readonly string[],
): IdentificationKeyValidation {
  const requiredKeys = rawKeys.slice(0, 2).map((key) => key.trim());
  const enteredKeys = rawKeys.map((key) => key.trim()).filter(Boolean);

  if (requiredKeys.some((key) => key.length === 0)) {
    return {
      isValid: false,
      error: "Entre au moins deux clés d'identification.",
    };
  }

  const parsedKeys = enteredKeys.map(parseIdentificationKey);
  const invalidKeys = parsedKeys.filter((key) => key === null);

  if (invalidKeys.length > 0) {
    return {
      isValid: false,
      error: "Une ou plusieurs clés ne sont pas valides.",
    };
  }

  const validKeys = parsedKeys as IdentificationKey[];

  if (new Set(validKeys).size !== validKeys.length) {
    return {
      isValid: false,
      error: "Chaque personne doit utiliser une clé différente.",
    };
  }

  const [firstCondition, firstGroup] = KEYS_TO_COND_AND_GROUP[validKeys[0]];
  const allKeysAreInSameConditionAndGroup = validKeys.every((key) => {
    const [condition, group] = KEYS_TO_COND_AND_GROUP[key];

    return condition === firstCondition && group === firstGroup;
  });

  if (!allKeysAreInSameConditionAndGroup) {
    return {
      isValid: false,
      error: "Les clés doivent appartenir à la même condition et au même groupe.",
    };
  }

  return {
    isValid: true,
    condition: firstCondition,
    group: firstGroup,
    keys: validKeys,
  };
}

"use client";

import { Button, Input, Label, TextField } from "@heroui/react";
import { useState } from "react";
import {
  readIdentificationKeys,
  saveIdentificationKeys,
  type IdentificationKeys,
} from "@/app/lib/identificationKeys";

const PERSON_LABELS = ["PERSONNE 1", "PERSONNE 2", "PERSONNE 3"] as const;

type HomeIdentificationFieldProps = {
  onValidated?: () => void;
};

export function HomeIdentificationField({ onValidated }: HomeIdentificationFieldProps) {
  const [identificationKeys, setIdentificationKeys] = useState<IdentificationKeys>(() =>
    readIdentificationKeys(),
  );
  const canValidate = identificationKeys[0].trim().length > 0 && identificationKeys[1].trim().length > 0;

  const updateIdentificationKey = (index: number, value: string) => {
    const nextKeys = identificationKeys.map((key, keyIndex) =>
      keyIndex === index ? value : key,
    ) as IdentificationKeys;

    setIdentificationKeys(nextKeys);
    saveIdentificationKeys(nextKeys);
  };

  return (
    <div className="flex w-full max-w-3xl flex-col gap-4">
      <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2">
        {PERSON_LABELS.map((personLabel, index) => (
          <TextField key={personLabel} className="min-w-0" isRequired={index < 2}>
            <Label>Clé d&apos;identification</Label>
            <Input
              placeholder={`(${personLabel}) Entre ton numéro ici.`}
              value={identificationKeys[index]}
              onChange={(event) => updateIdentificationKey(index, event.target.value)}
            />
          </TextField>
        ))}
      </div>
      {onValidated && (
        <Button
          className="self-center rounded-full bg-sky-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 disabled:cursor-not-allowed disabled:opacity-45 dark:bg-sky-500 dark:hover:bg-sky-400"
          isDisabled={!canValidate}
          onPress={onValidated}
        >
          Valider
        </Button>
      )}
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { HomeIdentificationField } from "./components/HomeIdentificationField";
import { type ValidIdentificationKeys } from "./components/key";
import { startExperiment } from "./lib/experimentCollection";
import { saveExperimentCondition } from "./lib/experimentCondition";

const PRESENTATION_TEXT = (
  <>
    <strong>Ta Mission :</strong> Tu es archéologue.
    Des centaines de fossiles de dinosaures ont été découverts, mais personne ne sait encore si chacun est{" "}
    <strong>Carnivore ou Herbivore</strong>. <br />
    <strong>Ton rôle : </strong>
    Apprendre à un algorithme à les classer automatiquement.
  </>
);

export default function Home() {
  const [isIdentificationValidated, setIsIdentificationValidated] = useState(false);

  const validateIdentification = (validatedKeys: ValidIdentificationKeys) => {
    saveExperimentCondition(validatedKeys.condition);
    startExperiment({
      condition: validatedKeys.condition,
      group: validatedKeys.group,
      keys: validatedKeys.keys,
    });
    setIsIdentificationValidated(true);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-zinc-50 bg-cover bg-center bg-no-repeat text-zinc-900"
      style={{ backgroundImage: "url('/home_background.png')" }}
    >
      <main className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-8 rounded-3xl border border-zinc-200 bg-white p-10 shadow-lg ">
        <h1 className="text-4xl font-bold">Bienvenue dans AI Tools !</h1>
        {!isIdentificationValidated ? (
          <HomeIdentificationField onValidated={validateIdentification} />
        ) : (
          <>
            <p className="max-w-4xl text-left text-lg text-zinc-600 ">
              {PRESENTATION_TEXT}
            </p>
            <Link
              href="/data_labelling"
              className="rounded-full bg-sky-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 "
            >
              C&apos;est parti !
            </Link>
          </>
        )}
      </main>
    </div>
  );
}

"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@heroui/react";
import { HomeIdentificationField } from "./components/HomeIdentificationField";
import {
  EXPERIMENT_CONDITIONS,
  saveExperimentCondition,
  useExperimentCondition,
  type ExperimentCondition,
} from "./lib/experimentCondition";

const PRESENTATION_TEXT = (
  <>
    Aujourd&apos;hui, tu vas incarner le rôle d&apos;un(e) <strong>archéologue moderne</strong>.<br />
    Pour tes recherches, tu as besoin de classifier tous les dinosaures déjà découverts entre{" "}
    <strong>Carnivores et Herbivores</strong>. <br />
    Sachant que leur nombre grandit chaque année, tu décides de recourir au{" "}
    <strong>Machine Learning </strong>
    (ou <strong>Apprentissage Automatique</strong>) pour t&apos;aider à automatiser cette longue tâche. <br />
    Ensemble, nous allons donc <strong>entraîner un ordinateur</strong> à reconnaître si un dinosaure est
    herbivore ou carnivore compte tenu de ce que nous savons déjà sur le spécimen.
  </>
);

export default function Home() {
  const selectedCondition = useExperimentCondition();
  const [isIdentificationValidated, setIsIdentificationValidated] = useState(false);

  const selectCondition = (condition: ExperimentCondition) => {
    saveExperimentCondition(condition);
    setIsIdentificationValidated(false);
  };

  return (
    <div
      className="flex min-h-screen items-center justify-center bg-zinc-50 bg-cover bg-center bg-no-repeat text-zinc-900 dark:text-zinc-100"
      style={{ backgroundImage: "url('/home_background.png')" }}
    >
      <main className="mx-auto flex w-full max-w-4xl flex-col items-center justify-center gap-8 rounded-3xl border border-zinc-200 bg-white p-10 shadow-lg dark:border-zinc-800 dark:bg-zinc-900">
        {!selectedCondition ? (
          <div className="grid w-full max-w-3xl grid-cols-1 gap-4 sm:grid-cols-3">
            {EXPERIMENT_CONDITIONS.map((condition) => (
              <Button
                key={condition.id}
                className="min-h-[48px] rounded-full bg-sky-600 px-6 text-sm font-semibold text-white transition hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
                onPress={() => selectCondition(condition.id)}
              >
                {condition.label}
              </Button>
            ))}
          </div>
        ) : (
          <>
            <h1 className="text-4xl font-bold">Bienvenue dans AI Tools !</h1>
            <HomeIdentificationField onValidated={() => setIsIdentificationValidated(true)} />
            {isIdentificationValidated && (
              <>
                <p className="max-w-4xl text-center text-lg text-zinc-600 dark:text-zinc-300">
                  {PRESENTATION_TEXT}
                </p>
                <Link
                  href="/data_labelling"
                  className="rounded-full bg-sky-600 px-8 py-3 text-sm font-semibold text-white transition hover:bg-sky-500 dark:bg-sky-500 dark:hover:bg-sky-400"
                >
                  C&apos;est parti !
                </Link>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}

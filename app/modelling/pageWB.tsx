"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { readDinoLabels } from "@/app/lib/dinoLabels";
import { MODEL_CONFIGS, type ModelId, type ModellingCondition } from "./modelConfig";

type ModellingWhiteBoxProps = {
  model?: ModelId;
  condition?: ModellingCondition;
  showIntro?: boolean;
};

type GiniResult = {
  feature: string;
  gini: number;
  criterion: string;
};

function formatGini(value: number | undefined) {
  if (value === undefined) {
    return "…";
  }

  return value.toFixed(2);
}

function TrainingDataCard({ features, carnivores, herbivores }: {
  features: string[];
  carnivores: number;
  herbivores: number;
}) {
  return (
    <section className="relative z-10 flex w-full max-w-[545px] flex-col gap-[10px] rounded-[24px] bg-white px-[24px] py-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)] backdrop-blur-[20px]">
      <div className="flex items-center justify-between gap-[18px]">
        <p className="text-[16px] font-semibold leading-[1.5] text-black">
          Données d’entraînement:
        </p>
        <Button className="min-h-[32px] rounded-full border border-[#dedee0] bg-white px-[10px] text-[14px] font-medium text-[#18181b]">
          Inspecter le tableau
        </Button>
      </div>

      <div className="flex items-center gap-[10px]">
        <p className="text-[16px] leading-[1.5] text-black">Caractéristiques:</p>
        <div className="flex flex-wrap items-center gap-[10px]">
          {features.map((feature) => (
            <span
              key={feature}
              className="inline-flex min-h-[32px] items-center justify-center rounded-full bg-[#ebebec] px-[10px] text-[14px] font-medium leading-[1.43] text-[#18181b]"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-[68px]">
        <p className="text-[16px] leading-[1.5] text-black">Données:</p>
        <div className="flex flex-1 items-center justify-center gap-[8px]">
          <span className="flex min-h-[32px] flex-1 items-center justify-center rounded-full bg-[#ff383c] px-[10px] text-[14px] font-medium text-white">
            Carnivores: {carnivores}
          </span>
          <span className="flex min-h-[32px] flex-1 items-center justify-center rounded-full bg-[#17c964] px-[10px] text-[14px] font-medium text-white">
            Herbivores: {herbivores}
          </span>
        </div>
      </div>
    </section>
  );
}

function NodeModel({
  isOpen,
  isComputing,
  errorMessage,
  features,
  giniResults,
  selectedFeature,
  bestFeature,
  onOpen,
  onSelectFeature,
  onConfirm,
}: {
  isOpen: boolean;
  isComputing: boolean;
  errorMessage: string | null;
  features: string[];
  giniResults: GiniResult[];
  selectedFeature: string | null;
  bestFeature: string;
  onOpen: () => void;
  onSelectFeature: (feature: string) => void;
  onConfirm: () => void;
}) {
  const giniByFeature = useMemo(
    () => new Map(giniResults.map((result) => [result.feature, result])),
    [giniResults],
  );

  return (
    <section className="relative z-10 w-full max-w-[360px] rounded-[24px] bg-white p-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)] backdrop-blur-[20px]">
      <button
        type="button"
        className="flex w-full flex-col items-start gap-[12px] rounded-[18px] p-[8px] text-left transition hover:bg-[#f5f5f5]"
        onClick={onOpen}
      >
        <p className="text-[16px] font-medium leading-[1.5] text-[#18181b]">Feature 1:</p>
        <p className="text-[14px] leading-[1.43] text-[#71717a]">
          Choosing the best feature to split the data…
        </p>
        {!isOpen && (
          <span className="flex min-h-[36px] w-full items-center justify-center rounded-full bg-[#0485f7] px-[14px] text-[14px] font-medium text-white">
            {isComputing ? "Computing Gini Impurity…" : "Compute Gini Impurity"}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="mt-[8px] flex flex-col gap-[14px]">
          <div className="relative flex w-full flex-col gap-[2px] rounded-[24px] bg-white p-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.06),0_-6px_6px_rgba(0,0,0,0.03),0_14px_14px_rgba(0,0,0,0.08)]">
            {features.map((feature) => {
              const giniResult = giniByFeature.get(feature);
              const isSelected = selectedFeature === feature;
              const isBestFeature = feature === bestFeature;

              return (
                <button
                  key={feature}
                  type="button"
                  className={`flex min-h-[36px] w-full items-center gap-[12px] rounded-[20px] px-[12px] py-[6px] text-left transition ${
                    isSelected ? "bg-[#ebebec]" : "hover:bg-[#f5f5f5]"
                  }`}
                  onClick={() => onSelectFeature(feature)}
                >
                  <span className="size-[16px] shrink-0 rounded-[4px] border border-[#71717a]" />
                  <span className="min-w-0 flex-1 text-[14px] font-medium leading-[1.43] text-[#18181b]">
                    {feature}: Gini Impurity {formatGini(giniResult?.gini)}
                  </span>
                  <span
                    aria-label={isBestFeature ? "Meilleure caractéristique" : "Caractéristique"}
                    className={`size-[14px] shrink-0 rounded-full border ${
                      isBestFeature ? "border-[#17c964] bg-[#17c964]" : "border-[#71717a]"
                    }`}
                  />
                </button>
              );
            })}
          </div>

          {errorMessage && (
            <p className="px-[4px] text-[13px] leading-[1.35] text-[#b42318]">{errorMessage}</p>
          )}

          {selectedFeature && (
            <p className={`px-[4px] text-[13px] leading-[1.35] ${selectedFeature === bestFeature ? "text-[#0b7f3a]" : "text-[#b42318]"}`}>
              {selectedFeature === bestFeature
                ? "Oui, cette caractéristique a la plus faible impureté de Gini."
                : "Essaie une autre caractéristique: l’impureté de Gini est plus basse ailleurs."}
            </p>
          )}

          <Button
            className="min-h-[36px] rounded-full bg-[#ebebec] px-[14px] text-[14px] font-medium text-[#18181b] disabled:cursor-not-allowed disabled:opacity-50"
            isDisabled={!selectedFeature}
            onPress={onConfirm}
          >
            Confirm choice
          </Button>
        </div>
      )}
    </section>
  );
}

export default function ModellingWhiteBox({
  model = "A",
  condition = "WB",
  showIntro = false,
}: ModellingWhiteBoxProps) {
  const modelConfig = MODEL_CONFIGS[model];
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isIntroOpen, setIsIntroOpen] = useState(showIntro);
  const [isFeaturePickerOpen, setIsFeaturePickerOpen] = useState(false);
  const [giniResults, setGiniResults] = useState<GiniResult[]>([]);
  const [isComputingGini, setIsComputingGini] = useState(false);
  const [giniErrorMessage, setGiniErrorMessage] = useState<string | null>(null);
  const bestFeature = giniResults[0]?.feature ?? modelConfig.features[0];

  useEffect(() => {
    let isActive = true;

    async function loadGiniImpurity() {
      setIsComputingGini(true);
      setGiniErrorMessage(null);

      try {
        const response = await fetch("/api/modelling/gini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            features: modelConfig.features,
            labels: readDinoLabels(),
          }),
        });

        if (!response.ok) {
          throw new Error("Impossible de calculer l’impureté de Gini.");
        }

        const payload = (await response.json()) as { results?: GiniResult[] };
        const sortedResults = [...(payload.results ?? [])].sort((first, second) => first.gini - second.gini);

        if (isActive) {
          setGiniResults(sortedResults);
        }
      } catch (error) {
        if (isActive) {
          setGiniErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
        }
      } finally {
        if (isActive) {
          setIsComputingGini(false);
        }
      }
    }

    loadGiniImpurity();

    return () => {
      isActive = false;
    };
  }, [modelConfig.features]);

  return (
    <div
      className="relative flex min-h-dvh w-full justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-[24px] py-[50px] text-[#18181b]"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
      <main className="relative flex min-h-[calc(100dvh-100px)] w-full max-w-[900px] flex-col items-center">
        <TrainingDataCard
          features={modelConfig.features}
          carnivores={modelConfig.pred_carnivores}
          herbivores={modelConfig.pred_herbivores}
        />

        <div aria-hidden="true" className="h-[42px] w-[5px] bg-[#dedee0]" />

        <NodeModel
          isOpen={isFeaturePickerOpen}
          isComputing={isComputingGini}
          errorMessage={giniErrorMessage}
          features={modelConfig.features}
          giniResults={giniResults}
          selectedFeature={selectedFeature}
          bestFeature={bestFeature}
          onOpen={() => setIsFeaturePickerOpen(true)}
          onSelectFeature={setSelectedFeature}
          onConfirm={() => setIsFeaturePickerOpen(false)}
        />

        <Link
          href={`/modelling?condition=${condition}`}
          className="absolute bottom-[20px] right-[20px] inline-flex min-h-[40px] items-center justify-center rounded-full border border-white/50 bg-white/85 px-[16px] text-[14px] font-medium text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-[20px] transition hover:bg-white"
        >
          Retour aux modèles
        </Link>
      </main>

      {isIntroOpen && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/45 px-[24px] backdrop-blur-[2px]">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="gini-intro-title"
            className="flex w-full max-w-[560px] flex-col gap-[18px] rounded-[24px] bg-white p-[28px] text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)]"
          >
            <div>
              <p className="text-[14px] font-medium text-[#52525b]">Avant de commencer</p>
              <h2 id="gini-intro-title" className="mt-[6px] text-[28px] font-extrabold leading-[1.12]">
                Impureté de Gini
              </h2>
            </div>
            <div className="flex flex-col gap-[12px] text-[16px] leading-[1.5] text-[#3f3f46]">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec tempor
                neque vitae mi luctus, sed dignissim dui faucibus.
              </p>
              <p>
                Integer at sapien non lectus volutpat gravida. Fusce euismod, erat
                vel commodo luctus, montre ici un exemple jouet pour comparer deux séparations.
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                className="min-h-[40px] rounded-full bg-[#0485f7] px-[18px] text-[15px] font-medium text-white"
                onPress={() => setIsIntroOpen(false)}
              >
                C&apos;est parti !
              </Button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

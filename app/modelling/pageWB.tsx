"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@heroui/react";
import { MODEL_CONFIGS, type ModelId, type ModellingCondition } from "./modelConfig";

type ModellingWhiteBoxProps = {
  model?: ModelId;
  condition?: ModellingCondition;
  showIntro?: boolean;
};

export default function ModellingWhiteBox({
  model = "A",
  condition = "WB",
  showIntro = false,
}: ModellingWhiteBoxProps) {
  const modelConfig = MODEL_CONFIGS[model];
  const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
  const [isIntroOpen, setIsIntroOpen] = useState(showIntro);
  const [isFeaturePickerOpen, setIsFeaturePickerOpen] = useState(false);
  const bestFeature = modelConfig.features[0];

  return (
    <div
      className="relative flex min-h-dvh w-full justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-[24px] py-[50px] text-[#18181b]"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
      <main className="relative flex min-h-[calc(100dvh-100px)] w-full max-w-[900px] flex-col items-center">
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
              {modelConfig.features.map((feature) => (
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
                Carnivores: {modelConfig.pred_carnivores}
              </span>
              <span className="flex min-h-[32px] flex-1 items-center justify-center rounded-full bg-[#17c964] px-[10px] text-[14px] font-medium text-white">
                Herbivores: {modelConfig.pred_herbivores}
              </span>
            </div>
          </div>
        </section>

        <div aria-hidden="true" className="h-[42px] w-[5px] bg-[#dedee0]" />

        <section className="relative z-10 w-full max-w-[360px] rounded-[24px] bg-white p-[16px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)] backdrop-blur-[20px]">
          <button
            type="button"
            className="flex w-full flex-col items-start gap-[12px] rounded-[18px] p-[8px] text-left transition hover:bg-[#f5f5f5]"
            onClick={() => setIsFeaturePickerOpen(true)}
          >
            <p className="text-[16px] font-medium leading-[1.5] text-[#18181b]">Feature 1:</p>
            <p className="text-[14px] leading-[1.43] text-[#71717a]">
              Choisis la caractéristique avec la meilleure impureté de Gini.
            </p>
            <span className="flex min-h-[36px] w-full items-center justify-center rounded-full bg-[#0485f7] px-[14px] text-[14px] font-medium text-white">
              Compute Gini Impurity
            </span>
          </button>

          {isFeaturePickerOpen && (
            <div className="mt-[14px] flex flex-col gap-[8px] border-t border-[#dedee0] pt-[14px]">
              {modelConfig.features.map((feature) => {
                const isSelected = selectedFeature === feature;
                const isCorrect = isSelected && feature === bestFeature;

                return (
                  <Button
                    key={feature}
                    className={`min-h-[34px] justify-start rounded-full border px-[12px] text-[14px] font-medium ${
                      isSelected
                        ? isCorrect
                          ? "border-[#17c964] bg-[#17c964] text-white"
                          : "border-[#ff383c] bg-[#ff383c] text-white"
                        : "border-[#dedee0] bg-white text-[#18181b]"
                    }`}
                    onPress={() => setSelectedFeature(feature)}
                  >
                    {feature}
                  </Button>
                );
              })}
              {selectedFeature && (
                <p className={`text-[13px] leading-[1.35] ${selectedFeature === bestFeature ? "text-[#0b7f3a]" : "text-[#b42318]"}`}>
                  {selectedFeature === bestFeature
                    ? "Oui, cette caractéristique sépare le mieux les données."
                    : "Essaie une autre caractéristique: l’impureté de Gini est plus basse ailleurs."}
                </p>
              )}
            </div>
          )}
        </section>

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

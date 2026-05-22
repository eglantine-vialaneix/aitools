"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { GoGear } from "react-icons/go";
import { ActivityInstructionsButton, Separator } from "@/app/components";
import { MODEL_CONFIG, type ModellingCondition } from "./modelConfig";
import { useResolvedModelInput } from "./modelInputs";
import { fitBlackBoxModel, PredictionTrainingTableOverlay } from "./PredictionTrainingTableOverlay";
import { markModelAsTrained, type ModelTrainingResult } from "./trainingState";

type ModellingBlackBoxProps = {
  condition?: ModellingCondition;
  onShowInstructions?: () => void;
};

const SURFACE_SHADOW =
  "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)]";

function TrainingDataCard({
  carnivores,
  herbivores,
  onInspectTable,
}: {
  carnivores: number;
  herbivores: number;
  onInspectTable: () => void;
}) {
  return (
    <section className={`relative z-10 flex w-full max-w-[545px] flex-col gap-[10px] rounded-[24px] bg-white px-[24px] py-[20px] ${SURFACE_SHADOW} backdrop-blur-[20px]`}>
      <div className="flex items-center justify-between gap-[18px]">
        <p className="text-[16px] font-semibold leading-[1.5] text-black">
          Données d’entraînement:
        </p>
        <Button
          className="min-h-[32px] rounded-full border border-[#dedee0] bg-white px-[10px] text-[14px] font-medium text-[#18181b]"
          onPress={onInspectTable}
        >
          Inspecter le tableau
        </Button>
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

function BlackBoxModelCard({ isLoading }: { isLoading: boolean }) {
  return (
    <article className={`relative flex h-[200px] w-[275px] flex-col items-center justify-center overflow-hidden rounded-[20px] bg-white ${SURFACE_SHADOW} backdrop-blur-[20px]`}>
      <GoGear aria-hidden="true" className={`absolute left-[10px] top-[10px] size-[20px] text-[#18181b] ${isLoading ? "animate-spin" : ""}`} />
      <GoGear aria-hidden="true" className={`absolute right-[10px] top-[10px] size-[20px] text-[#18181b] ${isLoading ? "animate-spin" : ""}`} />
      <GoGear aria-hidden="true" className={`absolute bottom-[10px] left-[10px] size-[20px] text-[#18181b] ${isLoading ? "animate-spin" : ""}`} />
      <GoGear aria-hidden="true" className={`absolute bottom-[10px] right-[10px] size-[20px] text-[#18181b] ${isLoading ? "animate-spin" : ""}`} />
      <h1 className="text-center text-[24px] font-bold leading-[1.34] text-black">
        {MODEL_CONFIG.title}
      </h1>
      <p className="mt-[10px] text-center text-[14px] font-medium leading-[1.43] text-[#71717a]">
        {isLoading ? "Entraînement en cours..." : "Modèle entraîné"}
      </p>
    </article>
  );
}

function ModelSummary({
  result,
  onInspectTable,
}: {
  result: ModelTrainingResult;
  onInspectTable: () => void;
}) {
  return (
    <section className="flex w-[275px] flex-col items-center">
      <Separator orientation="vertical" className="h-[42px] w-[5px]" />
      <div className="flex w-full flex-col gap-[12px] rounded-[24px] bg-[#eaeaea] px-[22px] py-[18px] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]">
        <div className="flex flex-col gap-[8px]">
          <span className="flex h-[36px] min-h-[36px] w-full items-center justify-center rounded-[24px] bg-[#ff383c] px-[14px] py-[8px] text-[14px] font-medium leading-[20px] text-white">
            Carnivores: {result.pred_carnivores}
          </span>
          <span className="flex h-[36px] min-h-[36px] w-full items-center justify-center rounded-[24px] bg-[#17c964] px-[14px] py-[8px] text-[14px] font-medium leading-[20px] text-white">
            Herbivores: {result.pred_herbivores}
          </span>
        </div>
        <Button
          className="min-h-[32px] rounded-full border border-[#dedee0] bg-white px-[10px] text-[14px] font-medium text-[#18181b]"
          onPress={onInspectTable}
        >
          Inspecter le tableau
        </Button>
      </div>
    </section>
  );
}

export default function ModellingBlackBox({
  condition = "BB",
  onShowInstructions,
}: ModellingBlackBoxProps) {
  const router = useRouter();
  const modelInput = useResolvedModelInput({
    condition,
    selectedFeatures: [],
  });
  const [trainingResult, setTrainingResult] = useState<ModelTrainingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const isLoading = !trainingResult && !errorMessage;

  useEffect(() => {
    let isActive = true;

    async function trainModel() {
      try {
        const result = await fitBlackBoxModel(modelInput);

        if (isActive) {
          setTrainingResult(result);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
        }
      }
    }

    trainModel();

    return () => {
      isActive = false;
    };
  }, [modelInput]);

  const finishTraining = () => {
    if (!trainingResult) {
      return;
    }

    markModelAsTrained(trainingResult, condition);
    router.push("/modelling");
  };

  return (
    <div
      className="relative flex min-h-dvh w-full justify-center overflow-auto bg-cover bg-center bg-no-repeat px-[24px] py-[50px] text-[#18181b]"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {onShowInstructions && <ActivityInstructionsButton onPress={onShowInstructions} />}
      <div aria-hidden="true" className="fixed inset-0 bg-black/35" />
      <main className="relative flex min-h-[calc(100dvh-100px)] w-full min-w-[980px] flex-col items-center">
        <TrainingDataCard
          carnivores={modelInput.init_carnivores}
          herbivores={modelInput.init_herbivores}
          onInspectTable={() => setIsTableOpen(true)}
        />
        <Separator orientation="vertical" className="h-[42px] w-[5px]" />
        <BlackBoxModelCard isLoading={isLoading} />

        {errorMessage && (
          <p className="mt-[18px] rounded-[12px] bg-white px-[18px] py-[12px] text-[14px] font-medium text-[#b42318]">
            {errorMessage}
          </p>
        )}

        {trainingResult && (
          <ModelSummary
            result={trainingResult}
            onInspectTable={() => setIsTableOpen(true)}
          />
        )}

        <div className="fixed bottom-[20px] right-[20px] flex items-center gap-[10px]">
          <Button
            className="min-h-[40px] rounded-full border border-white/50 bg-white/85 px-[16px] text-[14px] font-medium text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-[20px] transition hover:bg-white"
            onPress={() => router.push("/modelling")}
          >
            Retour
          </Button>
          {trainingResult && (
            <Button
              className="min-h-[40px] rounded-full bg-[#0485f7] px-[16px] text-[14px] font-medium text-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              onPress={finishTraining}
            >
              Terminer l&apos;entraînement
            </Button>
          )}
        </div>
      </main>

      {isTableOpen && (
        <PredictionTrainingTableOverlay
          modelInput={modelInput}
          rows={trainingResult?.predictionRows}
          onClose={() => setIsTableOpen(false)}
        />
      )}
    </div>
  );
}

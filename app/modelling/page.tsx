"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@heroui/react";
import { Separator } from "@/app/components/Separator";
import BlackBox from "./pageBB";
import WhiteBox from "./pageWB";
import {
  MODEL_CONFIGS,
  MODEL_IDS,
  type ModelId,
  type ModellingCondition,
  isCondition,
  isModelId,
} from "./modelConfig";

const DEFAULT_CONDITION: ModellingCondition = "WB";
const TRAINED_MODELS_STORAGE_KEY = "modelling:trained-models:v2";

function readTrainedModels() {
  if (typeof window === "undefined") {
    return new Set<ModelId>();
  }

  try {
    const storedModels = JSON.parse(window.localStorage.getItem(TRAINED_MODELS_STORAGE_KEY) ?? "[]");

    if (!Array.isArray(storedModels)) {
      return new Set<ModelId>();
    }

    const validModels = storedModels.filter((model): model is ModelId => isModelId(model));
    return new Set<ModelId>(validModels);
  } catch {
    return new Set<ModelId>();
  }
}

function writeTrainedModels(models: Set<ModelId>) {
  window.localStorage.setItem(TRAINED_MODELS_STORAGE_KEY, JSON.stringify([...models]));
}

function GearIcon() {
  return (
    <span aria-hidden="true" className="relative block size-[20px]">
      <span className="absolute left-1/2 top-1/2 size-[13px] -translate-x-1/2 -translate-y-1/2 rounded-full border-[2px] border-[#18181b]" />
      <span className="absolute left-1/2 top-0 h-full w-[2px] -translate-x-1/2 rounded-full bg-[#18181b]" />
      <span className="absolute left-0 top-1/2 h-[2px] w-full -translate-y-1/2 rounded-full bg-[#18181b]" />
      <span className="absolute left-1/2 top-1/2 h-[2px] w-full -translate-x-1/2 -translate-y-1/2 rotate-45 rounded-full bg-[#18181b]" />
      <span className="absolute left-1/2 top-1/2 h-[2px] w-full -translate-x-1/2 -translate-y-1/2 -rotate-45 rounded-full bg-[#18181b]" />
      <span className="absolute left-1/2 top-1/2 size-[5px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-white" />
    </span>
  );
}

type ModelCardProps = {
  modelId: ModelId;
  isTrained: boolean;
  onTrain: (modelId: ModelId) => void;
};

function TrainingDataCard({ modelId }: { modelId: ModelId }) {
  const model = MODEL_CONFIGS[modelId];

  return (
    <section className="relative flex w-full flex-col gap-[10px] rounded-[24px] bg-white px-[24px] py-[20px] shadow-[0_2px_4px_rgba(0,0,0,0.06),0_-6px_6px_rgba(0,0,0,0.03),0_14px_14px_rgba(0,0,0,0.08)] backdrop-blur-[20px]">
      <p className="text-[16px] font-semibold leading-[1.5] text-black">
        Données d’entraînement:
      </p>

      <div className="flex flex-col gap-[10px]">
        <p className="text-[16px] leading-[1.5] text-black">Caractéristiques:</p>
        <div className="flex flex-wrap gap-[10px]">
          {model.features.map((feature) => (
            <span
              key={feature}
              className="inline-flex min-h-[32px] items-center justify-center rounded-full bg-[#ebebec] px-[8px] text-[13px] font-medium leading-[1.43] text-[#18181b]"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-start justify-between gap-[18px]">
        <div className="flex flex-col gap-[11px]">
          <p className="text-[16px] leading-[1.5] text-black">Données:</p>
          <Button className="min-h-[32px] rounded-full border border-[#dedee0] bg-white px-[10px] text-[14px] font-medium leading-[20px] text-[#18181b]">
            Inspecter le tableau
          </Button>
        </div>

        <div className="flex w-[150px] flex-col gap-[8px]">
          <span className="flex min-h-[32px] items-center justify-center rounded-full bg-[#ff383c] px-[10px] text-[14px] font-medium leading-[20px] text-white">
            Carnivores: {model.pred_carnivores}
          </span>
          <span className="flex min-h-[32px] items-center justify-center rounded-full bg-[#17c964] px-[10px] text-[14px] font-medium leading-[20px] text-white">
            Herbivores: {model.pred_herbivores}
          </span>
        </div>
      </div>
    </section>
  );
}

function BlackBoxedModel({ modelId, isTrained, onTrain }: ModelCardProps) {
  const model = MODEL_CONFIGS[modelId];

  return (
    <article className="relative flex h-[200px] w-[275px] flex-col items-center justify-center overflow-hidden rounded-[20px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)] backdrop-blur-[20px]">
      <div className="absolute left-[10px] top-[10px]"><GearIcon /></div>
      <div className="absolute right-[10px] top-[10px]"><GearIcon /></div>
      <div className="absolute bottom-[10px] left-[10px]"><GearIcon /></div>
      <div className="absolute bottom-[10px] right-[10px]"><GearIcon /></div>
      <h2 className="mb-[14px] text-center text-[24px] font-bold leading-[1.34] text-black">
        {model.title}
      </h2>
      <Button
        className={`min-h-[40px] rounded-full px-[16px] text-[14px] font-medium ${
          isTrained
            ? "border border-[#dedee0] bg-white text-[#18181b]"
            : "bg-[#0485f7] text-white hover:bg-[#006fee]"
        }`}
        onPress={() => onTrain(modelId)}
      >
        {isTrained ? "Entraîné" : "Entraîner"}
      </Button>
    </article>
  );
}

function ModelSummary({ modelId }: { modelId: ModelId }) {
  const model = MODEL_CONFIGS[modelId];

  return (
    <div className="flex w-[220px] flex-col items-center">
      <Separator label="" className="h-[52px] max-h-none w-[3px] flex-col gap-0 [&_div]:hidden [&_hr]:w-px [&_hr]:border-l [&_hr]:border-t-0" />
      <div className="flex w-full flex-col gap-[8px] rounded-[16px] bg-[#eaeaea] px-[16px] py-[12px] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)]">
        <span className="flex min-h-[28px] items-center justify-center rounded-full bg-[#ff383c] px-[14px] text-[12px] font-medium text-white">
          Carnivores: {model.pred_carnivores}
        </span>
        <span className="flex min-h-[28px] items-center justify-center rounded-full bg-[#17c964] px-[14px] text-[12px] font-medium text-white">
          Herbivores: {model.pred_herbivores}
        </span>
      </div>
    </div>
  );
}

function VerticalSeparator({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-[75px] w-[5px] bg-[#dedee0] ${className}`}
    />
  );
}

export default function ModellingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const conditionParam = searchParams.get("condition");
  const modelParam = searchParams.get("model");
  const condition: ModellingCondition = isCondition(conditionParam) ? conditionParam : DEFAULT_CONDITION;
  const selectedModel: ModelId | null = isModelId(modelParam) ? modelParam : null;
  const [trainedModels, setTrainedModels] = useState<Set<ModelId>>(() => readTrainedModels());

  const trainedSummaryModel = useMemo(
    () => MODEL_IDS.find((modelId) => trainedModels.has(modelId)) ?? null,
    [trainedModels],
  );

  if (selectedModel) {
    const showIntro = condition === "WB" && searchParams.get("intro") === "1";

    return condition === "BB" ? (
      <BlackBox model={selectedModel} condition={condition} />
    ) : (
      <WhiteBox model={selectedModel} condition={condition} showIntro={showIntro} />
    );
  }

  const trainModel = (modelId: ModelId) => {
    const isFirstTraining = trainedModels.size === 0;
    const nextTrainedModels = new Set(trainedModels);
    nextTrainedModels.add(modelId);
    setTrainedModels(nextTrainedModels);
    writeTrainedModels(nextTrainedModels);
    router.push(`/modelling?condition=${condition}&model=${modelId}${condition === "WB" && isFirstTraining ? "&intro=1" : ""}`);
  };

  return (
    <div
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-[50px] py-[60px] text-[#18181b]"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
      <main className="relative flex min-h-[calc(100dvh-76px)] w-full max-w-[1351px] flex-col justify-center gap-[21px] rounded-[24px] border border-white/40 bg-[#efefef]/80 px-[40px] py-[40px] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06)] backdrop-blur-[2px]">
        <div className="w-full text-black">
          <h1 className="text-[24px] font-bold leading-[1.34]">
            Entraîne ces trois modèles:
          </h1>
          <p className="mt-[9px] w-full text-[16px] leading-[1.5]">
            Pour entraîner un modèle, tu dois lui présenter les données que tu viens de préparer
            pour qu’il puisse découvrir quels caractéristiques déterminent si un dinosaure est
            carnivore ou herbivore. Pour cela, clique sur “Entraîner” et observe comment chaque
            modèle classifie les données d’entraînement.
          </p>
        </div>

        <section className="grid w-full grid-cols-3 items-start gap-[22px]" aria-label="Modèles à entraîner">
          {MODEL_IDS.map((modelId) => (
            <div key={modelId} className="flex min-w-0 flex-col items-center">
              <TrainingDataCard modelId={modelId} />
              <VerticalSeparator />
              <BlackBoxedModel
                modelId={modelId}
                isTrained={trainedModels.has(modelId)}
                onTrain={trainModel}
              />
              {trainedSummaryModel === modelId && (
                <ModelSummary modelId={modelId} />
              )}
            </div>
          ))}
        </section>
      </main>
    </div>
  );
}

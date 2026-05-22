"use client";

import { Suspense, type ReactNode, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Surface as HeroSurface, TextArea } from "@heroui/react";
import { GoGear } from "react-icons/go";
import {
  ActivityInstructionsButton,
  ActivityInstructionsOverlay,
  ModellingInstructionsContent,
} from "@/app/components";
import {
  conditionForStep,
  useExperimentCondition,
} from "@/app/lib/experimentCondition";
import { useSelectedFeatures } from "@/app/lib/featureSelectionState";
import BlackBox from "./pageBB";
import WhiteBox from "./pageWB";
import {
  MODEL_CONFIG,
  type ModellingCondition,
} from "./modelConfig";
import {
  useResolvedModelInput,
  type ModelInput,
} from "./modelInputs";
import { PredictionTrainingTableOverlay } from "./PredictionTrainingTableOverlay";
import { TrainingTableOverlay } from "./TrainingTableOverlay";
import { useModelTrainingResult, type ModelTrainingResult } from "./trainingState";
import { type PredictionTableRow } from "./tableRows";

type ModelCardProps = {
  isTrained: boolean;
  onTrain: () => void;
};

type TableOverlayState = {
  kind: "training";
  dataFile: ModelInput["data"];
} | {
  kind: "predictions";
  modelInput?: ModelInput;
  rows?: PredictionTableRow[];
} | null;

type SurfaceProps = {
  children: ReactNode;
  className?: string;
  variant?: "secondary" | "tertiary";
};

function Surface({ children, className = "", variant = "secondary" }: SurfaceProps) {
  const surfaceColor = variant === "tertiary" ? "bg-[#eaeaea]" : "bg-[#efefef]/80";

  return (
    <HeroSurface
      variant={variant}
      className={`relative rounded-[24px] ${surfaceColor} shadow-[0_2px_4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.06)] backdrop-blur-0 ${className}`}
    >
      {children}
    </HeroSurface>
  );
}

function TrainingDataCard({
  condition,
  modelInput,
  onInspectTable,
}: {
  condition: ModellingCondition;
  modelInput: ModelInput;
  onInspectTable: () => void;
}) {
  return (
    <section className="relative flex w-full flex-col gap-[10px] rounded-[24px] bg-white px-[24px] py-[20px] shadow-[0_2px_4px_rgba(0,0,0,0.06),0_-6px_6px_rgba(0,0,0,0.03),0_14px_14px_rgba(0,0,0,0.08)] backdrop-blur-[20px]">
      <p className="text-[16px] font-semibold leading-[1.5] text-black">
        Données d’entraînement:
      </p>

      {condition === "WB" && (
        <div className="flex flex-col gap-[10px]">
          <p className="text-[16px] leading-[1.5] text-black">Caractéristiques:</p>
          <div className="flex flex-wrap gap-[10px]">
            {modelInput.features.map((feature) => (
              <span
                key={feature}
                className="inline-flex min-h-[32px] items-center justify-center rounded-full bg-[#ebebec] px-[8px] text-[13px] font-medium leading-[1.43] text-[#18181b]"
              >
                {feature}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-start justify-between gap-[18px]">
        <div className="flex flex-col gap-[11px]">
          <p className="text-[16px] leading-[1.5] text-black">Données:</p>
          <Button
            className="min-h-[32px] rounded-full border border-[#dedee0] bg-white px-[10px] text-[14px] font-medium leading-[20px] text-[#18181b]"
            onPress={onInspectTable}
          >
            Inspecter le tableau
          </Button>
        </div>

        <div className="flex w-[150px] flex-col gap-[8px]">
          <span className="flex min-h-[32px] items-center justify-center rounded-full bg-[#ff383c] px-[10px] text-[14px] font-medium leading-[20px] text-white">
            Carnivores: {modelInput.init_carnivores}
          </span>
          <span className="flex min-h-[32px] items-center justify-center rounded-full bg-[#17c964] px-[10px] text-[14px] font-medium leading-[20px] text-white">
            Herbivores: {modelInput.init_herbivores}
          </span>
        </div>
      </div>
    </section>
  );
}

function BlackBoxedModel({ isTrained, onTrain }: ModelCardProps) {
  return (
    <article className="relative flex h-[200px] w-[275px] flex-col items-center justify-center overflow-hidden rounded-[20px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)] backdrop-blur-[20px]">
      <GoGear aria-hidden="true" className="absolute left-[10px] top-[10px] size-[20px] text-[#18181b]" />
      <GoGear aria-hidden="true" className="absolute right-[10px] top-[10px] size-[20px] text-[#18181b]" />
      <GoGear aria-hidden="true" className="absolute bottom-[10px] left-[10px] size-[20px] text-[#18181b]" />
      <GoGear aria-hidden="true" className="absolute bottom-[10px] right-[10px] size-[20px] text-[#18181b]" />
      <h2 className="mb-[14px] text-center text-[24px] font-bold leading-[1.34] text-black">
        {MODEL_CONFIG.title}
      </h2>
      <Button
        className={`min-h-[40px] rounded-full px-[16px] text-[14px] font-medium ${
          isTrained
            ? "border border-[#dedee0] bg-white text-[#18181b]"
            : "bg-[#0485f7] text-white hover:bg-[#006fee]"
        }`}
        onPress={onTrain}
      >
        {isTrained ? "Entraîné" : "Entraîner"}
      </Button>
    </article>
  );
}

function ModelSummary({
  result,
  onInspectTable,
}: {
  result: ModelTrainingResult;
  onInspectTable?: () => void;
}) {
  return (
    <div className="flex w-[220px] items-center">
      <Surface variant="tertiary" className="flex min-h-[111px] w-[220px] items-center justify-center px-[22px] py-[16px]">
        <div className="flex w-[177px] flex-col items-center justify-center gap-[8px]">
          <span className="flex h-[36px] min-h-[36px] w-full items-center justify-center rounded-[24px] bg-[#ff383c] px-[14px] py-[8px] text-[14px] font-medium leading-[20px] text-white">
            Carnivores: {result.pred_carnivores}
          </span>
          <span className="flex h-[36px] min-h-[36px] w-full items-center justify-center rounded-[24px] bg-[#17c964] px-[14px] py-[8px] text-[14px] font-medium leading-[20px] text-white">
            Herbivores: {result.pred_herbivores}
          </span>
          {onInspectTable && (
            <Button
              className="min-h-[32px] rounded-full border border-[#dedee0] bg-white px-[10px] text-[14px] font-medium leading-[20px] text-[#18181b]"
              onPress={onInspectTable}
            >
              Inspecter le tableau
            </Button>
          )}
        </div>
      </Surface>
    </div>
  );
}

function HorizontalSeparator({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`h-[5px] w-[72px] bg-[#dedee0] ${className}`}
    />
  );
}

function ModellingPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const experimentCondition = useExperimentCondition();
  const resolvedCondition = conditionForStep(experimentCondition, "modelling");
  const condition: ModellingCondition = resolvedCondition ?? "WB";
  const isTraining = searchParams.get("training") === "1";

  const trainingResult = useModelTrainingResult(condition);
  const isTrained = Boolean(trainingResult);
  const selectedFeatures = useSelectedFeatures();
  const [tableOverlay, setTableOverlay] = useState<TableOverlayState>(null);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const [blackBoxReflection, setBlackBoxReflection] = useState("");
  const [blackBoxTechnique, setBlackBoxTechnique] = useState("");

  const modelInput = useResolvedModelInput({
    condition,
    selectedFeatures,
  });

  if (isTraining) {
    const isViewingTrainedTree = condition === "WB" && Boolean(trainingResult?.whiteBoxTree?.length);
    const showIntro = condition === "WB" && !isViewingTrainedTree && searchParams.get("intro") === "1";
    const openInstructions = () => setIsInstructionsOpen(true);
    const closeInstructions = () => setIsInstructionsOpen(false);

    return condition === "BB" ? (
      <>
        <BlackBox condition={condition} onShowInstructions={openInstructions} />
        {isInstructionsOpen && (
          <ActivityInstructionsOverlay title="Consignes d'entraînement" onClose={closeInstructions}>
            <ModellingInstructionsContent condition="BB" />
          </ActivityInstructionsOverlay>
        )}
      </>
    ) : (
      <>
        <WhiteBox
          condition={condition}
          initialNodes={trainingResult?.whiteBoxTree}
          isReadOnly={Boolean(trainingResult?.whiteBoxTree?.length)}
          showIntro={showIntro}
          onShowInstructions={openInstructions}
        />
        {!isViewingTrainedTree && isInstructionsOpen && (
          <ActivityInstructionsOverlay title="Consignes d'entraînement" onClose={closeInstructions}>
            <ModellingInstructionsContent condition="WB" />
          </ActivityInstructionsOverlay>
        )}
      </>
    );
  }

  const openInstructions = () => setIsInstructionsOpen(true);
  const closeInstructions = () => setIsInstructionsOpen(false);
  const trainModel = () => {
    router.push(`/modelling?training=1${condition === "WB" && !isTrained ? "&intro=1" : ""}`);
  };
  const isBlackBoxReflectionComplete =
    blackBoxReflection.trim().length > 0 &&
    blackBoxTechnique.trim().length > 0;
  const canGoToEvaluation = isTrained && (condition !== "BB" || isBlackBoxReflectionComplete);

  if (!resolvedCondition) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50 text-zinc-900">
        <p className="rounded-3xl bg-white p-8 text-lg shadow-lg">
          CONDITION ERROR: Retourner à la page d&apos;accueil pour définir la condition.
        </p>
      </div>
    );
  }

  return (
    <div
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat p-[40px] text-[#18181b]"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <ActivityInstructionsButton onPress={openInstructions} />
      <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
      <Surface
        className="relative flex min-h-[calc(100dvh-80px)] w-full max-w-[1351px] flex-col justify-center gap-[21px] p-[40px]"
      >
        <main className="relative flex w-full flex-col justify-center gap-[21px]">
          <div className="w-full text-black">
            <h1 className="text-[24px] font-bold leading-[1.34]">
              Entraîne ce modèle:
            </h1>
            <p className="mt-[9px] w-full text-[16px] leading-[1.5]">
              Pour entraîner un modèle, tu dois lui présenter les données que tu viens de préparer
              pour qu’il puisse découvrir quels caractéristiques déterminent si un dinosaure est
              carnivore ou herbivore. Pour cela, clique sur “Entraîner” et observe comment il
              classifie les données d’entraînement.
            </p>
          </div>

          <section className="flex w-full items-center justify-center overflow-x-auto py-[18px]" aria-label="Modèle à entraîner">
            <div className="flex min-w-max items-center justify-center">
              <div className="w-[545px] shrink-0">
                <TrainingDataCard
                  condition={condition}
                  modelInput={modelInput}
                  onInspectTable={() => setTableOverlay({ kind: "training", dataFile: modelInput.data })}
                />
              </div>
              <HorizontalSeparator />
              <div className="shrink-0">
                <BlackBoxedModel
                  isTrained={isTrained}
                  onTrain={trainModel}
                />
              </div>
              {isTrained && trainingResult && (
                <>
                  <HorizontalSeparator />
                  <div className="shrink-0">
                    <ModelSummary
                      result={trainingResult}
                      onInspectTable={
                        trainingResult.predictionRows?.length
                          ? () => setTableOverlay({ kind: "predictions", rows: trainingResult.predictionRows })
                          : condition === "BB"
                          ? () => setTableOverlay({ kind: "predictions", modelInput })
                          : undefined
                      }
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {condition === "BB" && isTrained && (
            <section className="flex w-full flex-col gap-[12px]">
              <h2 className="text-[16px] font-medium leading-[1.43] text-[#18181b]">
                Comment penses-tu que le modèle fait la distinction entre carnivore et herbivore ?
              </h2>
              <label className="flex min-h-[128px] min-w-0 flex-col gap-[6px]">
                <TextArea
                  className="h-full w-full flex-1 [&>div]:h-full [&>div]:w-full [&_textarea]:min-h-[96px] [&_textarea]:resize-none [&_textarea]:text-[14px]"
                  onChange={(event) => setBlackBoxReflection(event.target.value)}
                  placeholder="Ta réponse ici..."
                  value={blackBoxReflection}
                />
              </label>
              <label className="flex min-h-[116px] w-full flex-col gap-[6px]">
                <span className="text-[16px] font-medium leading-[1.43] text-[#18181b]">
                  Explique le raisonnement que tu as suivi pour déterminer cela:
                </span>
                <TextArea
                  className="h-full w-full flex-1 [&>div]:h-full [&>div]:w-full [&_textarea]:min-h-[84px] [&_textarea]:resize-none [&_textarea]:text-[14px]"
                  onChange={(event) => setBlackBoxTechnique(event.target.value)}
                  placeholder="Ta réponse ici..."
                  value={blackBoxTechnique}
                />
              </label>
            </section>
          )}

          <div className="flex justify-end">
            <Button
              className="min-h-[40px] rounded-[22px] bg-[#006fee] px-[18px] text-[15px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
              isDisabled={!canGoToEvaluation}
              onPress={() => router.push("/evaluation")}
            >
              Suite
            </Button>
          </div>
        </main>
      </Surface>
      {tableOverlay && (
        tableOverlay.kind === "training" ? (
          <TrainingTableOverlay
            dataFile={tableOverlay.dataFile}
            onClose={() => setTableOverlay(null)}
          />
        ) : (
          <PredictionTrainingTableOverlay
            modelInput={tableOverlay.modelInput}
            rows={tableOverlay.rows}
            onClose={() => setTableOverlay(null)}
          />
        )
      )}
      {isInstructionsOpen && (
        <ActivityInstructionsOverlay title="Consignes d'entraînement" onClose={closeInstructions}>
          <ModellingInstructionsContent condition={condition} />
        </ActivityInstructionsOverlay>
      )}
    </div>
  );
}

export default function ModellingPage() {
  return (
    <Suspense fallback={null}>
      <ModellingPageContent />
    </Suspense>
  );
}

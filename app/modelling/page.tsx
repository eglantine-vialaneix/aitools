"use client";

import { Suspense, type ReactNode, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button, Surface as HeroSurface, TextArea, Tooltip } from "@heroui/react";
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
import { markCollectionStepStart, saveModelEnd } from "@/app/lib/experimentCollection";
import { useSelectedFeatures } from "@/app/lib/featureSelectionState";
import WhiteBox from "./pageWB";
import {
  MODEL_CONFIG,
  type ModellingCondition,
} from "./modelConfig";
import {
  useResolvedModelInput,
  type ModelInput,
} from "./modelInputs";
import { fitBlackBoxModel, PredictionTrainingTableOverlay } from "./PredictionTrainingTableOverlay";
import { TrainingTableOverlay } from "./TrainingTableOverlay";
import { markModelAsTrained, useModelTrainingResult, type ModelTrainingResult } from "./trainingState";
import { computeTrainingAccuracy, type PredictionTableRow } from "./tableRows";

type ModelCardProps = {
  isTrained: boolean;
  isDisabled?: boolean;
  isTraining?: boolean;
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

type ModellingTutorialStep =
  | "training-card"
  | "model-card"
  | "waiting-for-predictions"
  | "prediction-card"
  | "prediction-details"
  | null;

const BLACK_BOX_REFLECTION_PROMPT =
  "Le modèle agit selon ses propres règles et tu ne peux pas voir exactement comment il différencie herbivores et carnivores, mais essayons de deviner ce qu'il a fait ! Inspecte ses prédictions: quelles pourraient être les caractéristiques qu'il a vraiment utilisées selon toi ? Explique ton raisonnement. Si tu trouves ça trop difficile, explique aussi pourquoi.";

function TutorialBackdrop({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      aria-label="Passer à l'étape suivante du tutoriel"
      className="fixed inset-0 z-[70] cursor-default bg-black/30"
      onClick={onDismiss}
    />
  );
}

function ModellingTutorialTarget({
  children,
  label,
  onDismiss,
  placement = "top",
  className = "",
}: {
  children: ReactNode;
  label: string;
  onDismiss: () => void;
  placement?: "top" | "right" | "bottom" | "left";
  className?: string;
}) {
  return (
    <Tooltip.Root isOpen>
      <div className={`relative ${className}`}>
        {children}
        <Tooltip.Trigger
          aria-label="Indication pour le tutoriel d'entraînement"
          className="pointer-events-none absolute inset-0 z-[80]"
        />
      </div>
      <TutorialBackdrop onDismiss={onDismiss} />
      <Tooltip.Content
        className="z-[90] w-[360px] max-w-[360px] break-normal rounded-[14px] border border-[#dedee0] bg-white px-[14px] py-[12px] text-[15px] font-semibold leading-[1.35] text-[#24324a] shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
        placement={placement}
        showArrow
        onClick={onDismiss}
      >
        <Tooltip.Arrow className="text-white [&_[data-slot=overlay-arrow]]:fill-white [&_[data-slot=overlay-arrow]]:stroke-[#dedee0]" />
        <p>{label}</p>
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

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
  displayFeatures,
  modelInput,
  onInspectTable,
  tutorialStep = null,
  onTutorialDismiss = () => {},
}: {
  condition: ModellingCondition;
  displayFeatures?: string[];
  modelInput: ModelInput;
  onInspectTable: () => void;
  tutorialStep?: ModellingTutorialStep;
  onTutorialDismiss?: () => void;
}) {
  const visibleFeatures = displayFeatures ?? (condition === "WB" ? modelInput.features : []);

  const card = (
    <section className="relative flex w-full flex-col gap-[10px] rounded-[24px] bg-white px-[24px] py-[20px] shadow-[0_2px_4px_rgba(0,0,0,0.06),0_-6px_6px_rgba(0,0,0,0.03),0_14px_14px_rgba(0,0,0,0.08)] backdrop-blur-[20px]">
      <p className="text-[16px] font-semibold leading-[1.5] text-black">
        Données d’entraînement:
      </p>

      {visibleFeatures.length > 0 && (
        <div className="flex flex-col gap-[10px]">
          <p className="text-[16px] leading-[1.5] text-black">Caractéristiques:</p>
          <div className="flex flex-wrap gap-[10px]">
            {visibleFeatures.map((feature) => (
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

  if (tutorialStep === "training-card") {
    return (
      <ModellingTutorialTarget
        label="Le modèle regarde les données que tu as préparées. Il regardera le vrai régime alimentaire UNIQUEMENT comme correction, pour savoir s'il a bien classifié les dinosaures."
        onDismiss={onTutorialDismiss}
        placement="bottom"
      >
        {card}
      </ModellingTutorialTarget>
    );
  }

  return card;
}

function BlackBoxedModel({ isTrained, isDisabled = false, isTraining = false, onTrain }: ModelCardProps) {
  const gearClassName = `absolute size-[20px] text-[#18181b] ${isTraining ? "animate-spin" : ""}`;

  return (
    <article className="relative flex h-[200px] w-[275px] flex-col items-center justify-center overflow-hidden rounded-[20px] bg-white shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)] backdrop-blur-[20px]">
      <GoGear aria-hidden="true" className={`${gearClassName} left-[10px] top-[10px]`} />
      <GoGear aria-hidden="true" className={`${gearClassName} right-[10px] top-[10px]`} />
      <GoGear aria-hidden="true" className={`${gearClassName} bottom-[10px] left-[10px]`} />
      <GoGear aria-hidden="true" className={`${gearClassName} bottom-[10px] right-[10px]`} />
      <h2 className="mb-[14px] text-center text-[24px] font-bold leading-[1.34] text-black">
        {MODEL_CONFIG.title}
      </h2>
      <Button
        className={`min-h-[40px] rounded-full px-[16px] text-[14px] font-medium ${
          isTrained || isTraining
            ? "border border-[#dedee0] bg-white text-[#18181b]"
            : "bg-[#0485f7] text-white hover:bg-[#006fee]"
        }`}
        isDisabled={isDisabled}
        onPress={onTrain}
      >
        {isTraining ? "Entraînement..." : isTrained ? "Entraîné" : "Entraîner"}
      </Button>
      {isTraining && (
        <p className="mt-[10px] text-center text-[14px] font-medium leading-[1.43] text-[#71717a]">
          Entraînement en cours...
        </p>
      )}
    </article>
  );
}

function formatTrainingAccuracy(result: ModelTrainingResult) {
  const accuracyPercent = modelTrainingAccuracyPercent(result);

  if (accuracyPercent === null) {
    return null;
  }

  return `${Math.round(accuracyPercent)} %`;
}

function modelTrainingAccuracyPercent(result: ModelTrainingResult | null) {
  const predictionRows = result?.predictionRows;
  const accuracy = result?.trainingAccuracy ?? (
    predictionRows?.length ? computeTrainingAccuracy(predictionRows) : undefined
  );

  if (accuracy === undefined) {
    return null;
  }

  return Number((accuracy * 100).toFixed(1));
}

function ModelSummary({
  result,
  onInspectTable,
  tutorialStep = null,
  onTutorialDismiss = () => {},
}: {
  result: ModelTrainingResult;
  onInspectTable?: () => void;
  tutorialStep?: ModellingTutorialStep;
  onTutorialDismiss?: () => void;
}) {
  const trainingAccuracy = formatTrainingAccuracy(result);
  const inspectButton = onInspectTable ? (
    <Button
      className="min-h-[32px] rounded-full border border-[#dedee0] bg-white px-[10px] text-[14px] font-medium leading-[20px] text-[#18181b]"
      onPress={onInspectTable}
    >
      Inspecter le tableau
    </Button>
  ) : null;

  const card = (
    <div className="flex w-[220px] items-center">
      <Surface variant="tertiary" className="flex min-h-[111px] w-[220px] items-center justify-center px-[22px] py-[16px]">
        <div className="flex w-[177px] flex-col items-center justify-center gap-[8px]">
          <p className="text-[16px] font-semibold leading-[1.5] text-black">
            Prédictions:
          </p>
          <span className="flex h-[36px] min-h-[36px] w-full items-center justify-center rounded-[24px] bg-[#ff383c] px-[14px] py-[8px] text-[14px] font-medium leading-[20px] text-white">
            Carnivores: {result.pred_carnivores}
          </span>
          <span className="flex h-[36px] min-h-[36px] w-full items-center justify-center rounded-[24px] bg-[#17c964] px-[14px] py-[8px] text-[14px] font-medium leading-[20px] text-white">
            Herbivores: {result.pred_herbivores}
          </span>
          {trainingAccuracy && (
            <span className="flex min-h-[36px] w-full items-center justify-center rounded-[24px] bg-[#18181b] px-[14px] py-[8px] text-center text-[14px] font-medium leading-[20px] text-white">
              Précision: {trainingAccuracy}
            </span>
          )}
          {tutorialStep === "prediction-details" && inspectButton ? (
            <ModellingTutorialTarget
              label="Tu peux voir plus en détails ses prédictions ici."
              onDismiss={onTutorialDismiss}
              placement="bottom"
            >
              {inspectButton}
            </ModellingTutorialTarget>
          ) : (
            inspectButton
          )}
        </div>
      </Surface>
    </div>
  );

  if (tutorialStep === "prediction-card") {
    return (
      <ModellingTutorialTarget
        label="L'algorithme te fait un rapport de son entrainement: il te dit combien de carnivores et d'herbivores il a identifiés et à quel point il était précis dans ses prédictions."
        onDismiss={onTutorialDismiss}
        placement="bottom"
      >
        {card}
      </ModellingTutorialTarget>
    );
  }

  return card;
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
  const isWhiteBoxTrainingRoute = condition === "WB" && searchParams.get("training") === "1";

  const trainingResult = useModelTrainingResult(condition);
  const isTrained = Boolean(trainingResult);
  const selectedFeatures = useSelectedFeatures();
  const [tableOverlay, setTableOverlay] = useState<TableOverlayState>(null);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const [blackBoxReflection, setBlackBoxReflection] = useState("");
  const [isBlackBoxTraining, setIsBlackBoxTraining] = useState(false);
  const [blackBoxTrainingError, setBlackBoxTrainingError] = useState<string | null>(null);
  const [tutorialStep, setTutorialStep] = useState<ModellingTutorialStep>(null);
  const [hasStartedTutorial, setHasStartedTutorial] = useState(false);

  useEffect(() => {
    markCollectionStepStart("Model");
  }, []);

  const modelInput = useResolvedModelInput({
    condition,
    selectedFeatures,
  });
  const trainingDataFeatures =
    condition === "WB"
      ? modelInput.features
      : experimentCondition === "C2"
        ? selectedFeatures
        : [];

  useEffect(() => {
    if (tutorialStep === "waiting-for-predictions" && isTrained) {
      setTutorialStep("prediction-card");
    }
  }, [isTrained, tutorialStep]);

  if (isWhiteBoxTrainingRoute) {
    const isViewingTrainedTree = condition === "WB" && Boolean(trainingResult?.whiteBoxTree?.length);
    const showIntro = condition === "WB" && !isViewingTrainedTree && searchParams.get("intro") === "1";
    const openInstructions = () => setIsInstructionsOpen(true);
    const closeInstructions = () => setIsInstructionsOpen(false);

    return (
      <>
        <WhiteBox
          condition={condition}
          initialNodes={trainingResult?.whiteBoxTree}
          isReadOnly={Boolean(trainingResult?.whiteBoxTree?.length)}
          showIntro={showIntro}
          onShowInstructions={openInstructions}
        />
        {!isViewingTrainedTree && isInstructionsOpen && (
          <ActivityInstructionsOverlay
            title="Consignes"
            onClose={closeInstructions}
            stepImage={{
              alt: "Étape d'entraînement du modèle",
              height: 540,
              src: "/Hints/StepsTrain.png",
              width: 6700,
            }}
          >
            <ModellingInstructionsContent condition="WB" />
          </ActivityInstructionsOverlay>
        )}
      </>
    );
  }

  const openInstructions = () => {
    setTutorialStep(null);
    setHasStartedTutorial(false);
    setIsInstructionsOpen(true);
  };
  const closeInstructions = () => {
    setIsInstructionsOpen(false);

    if (!hasStartedTutorial) {
      setTutorialStep("training-card");
      setHasStartedTutorial(true);
    }
  };
  const hasPredictionDetails = Boolean(trainingResult?.predictionRows?.length || condition === "BB");
  const advanceTutorial = () => {
    setTutorialStep((currentStep) => {
      if (currentStep === "training-card") {
        return "model-card";
      }

      if (currentStep === "model-card") {
        return isTrained ? "prediction-card" : "waiting-for-predictions";
      }

      if (currentStep === "prediction-card") {
        return hasPredictionDetails ? "prediction-details" : null;
      }

      if (currentStep === "prediction-details") {
        return null;
      }

      return currentStep;
    });
  };

  const trainModel = async () => {
    if (condition === "WB") {
      router.push(`/modelling?training=1${!isTrained ? "&intro=1" : ""}`);
      return;
    }

    if (isTrained || isBlackBoxTraining) {
      return;
    }

    setIsBlackBoxTraining(true);
    setBlackBoxTrainingError(null);

    try {
      const result = await fitBlackBoxModel(modelInput);

      markModelAsTrained(result, condition);
    } catch (error) {
      setBlackBoxTrainingError(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setIsBlackBoxTraining(false);
    }
  };
  const isBlackBoxReflectionComplete = blackBoxReflection.trim().length > 0;
  const canGoToEvaluation = isTrained && (condition !== "BB" || isBlackBoxReflectionComplete);
  const goToEvaluation = () => {
    saveModelEnd(
      condition === "BB"
        ? [BLACK_BOX_REFLECTION_PROMPT, blackBoxReflection].join("\n")
        : null,
      modelTrainingAccuracyPercent(trainingResult),
    );
    router.push("/evaluation");
  };

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
              L&apos;algorithme regarde les données, et apprend à déterminer si un dinosaure est
              carnivore ou herbivore. Comment fait-il cela ? Clique sur &quot;Entraîner&quot; !
            </p>
          </div>

          <section className="flex w-full items-center justify-center overflow-x-auto py-[18px]" aria-label="Modèle à entraîner">
            <div className="flex min-w-max items-center justify-center">
              <div className="w-[545px] shrink-0">
                <TrainingDataCard
                  condition={condition}
                  displayFeatures={trainingDataFeatures}
                  modelInput={modelInput}
                  onInspectTable={() => setTableOverlay({ kind: "training", dataFile: modelInput.data })}
                  tutorialStep={tutorialStep}
                  onTutorialDismiss={advanceTutorial}
                />
              </div>
              <HorizontalSeparator />
              <div className="shrink-0">
                {tutorialStep === "model-card" ? (
                  <ModellingTutorialTarget
                    label="Il doit ensuite apprendre à différencer les dinosaures. Pour cela lance l'entraînement du modèle !"
                    onDismiss={advanceTutorial}
                    placement="bottom"
                  >
                    <BlackBoxedModel
                      isDisabled={condition === "BB" && (isTrained || isBlackBoxTraining)}
                      isTrained={isTrained}
                      isTraining={isBlackBoxTraining}
                      onTrain={trainModel}
                    />
                  </ModellingTutorialTarget>
                ) : (
                  <BlackBoxedModel
                    isDisabled={condition === "BB" && (isTrained || isBlackBoxTraining)}
                    isTrained={isTrained}
                    isTraining={isBlackBoxTraining}
                    onTrain={trainModel}
                  />
                )}
              </div>
              {isTrained && trainingResult && (
                <>
                  <HorizontalSeparator />
                  <div className="shrink-0">
                    <ModelSummary
                      result={trainingResult}
                      onInspectTable={
                        trainingResult.predictionRows?.length
                          ? () => setTableOverlay({ kind: "predictions", modelInput, rows: trainingResult.predictionRows })
                          : condition === "BB"
                          ? () => setTableOverlay({ kind: "predictions", modelInput })
                          : undefined
                      }
                      tutorialStep={tutorialStep}
                      onTutorialDismiss={advanceTutorial}
                    />
                  </div>
                </>
              )}
            </div>
          </section>

          {condition === "BB" && blackBoxTrainingError && (
            <p className="rounded-[12px] bg-white px-[18px] py-[12px] text-[14px] font-medium text-[#b42318]">
              {blackBoxTrainingError}
            </p>
          )}

          {condition === "BB" && isTrained && (
            <section className="flex w-full flex-col gap-[12px]">
              <h2 className="text-[16px] font-medium leading-[1.43] text-[#18181b]">
                {BLACK_BOX_REFLECTION_PROMPT}
              </h2>
              <label className="flex min-h-[160px] min-w-0 flex-col gap-[6px]">
                <TextArea
                  className="h-full w-full flex-1 [&>div]:h-full [&>div]:w-full [&_textarea]:min-h-[128px] [&_textarea]:resize-none [&_textarea]:text-[14px]"
                  onChange={(event) => setBlackBoxReflection(event.target.value)}
                  placeholder="Ta réponse ici..."
                  value={blackBoxReflection}
                />
              </label>
            </section>
          )}

          <div className="flex justify-end">
            <Button
              className="min-h-[40px] rounded-[22px] bg-[#006fee] px-[18px] text-[15px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
              isDisabled={!canGoToEvaluation}
              onPress={goToEvaluation}
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
        <ActivityInstructionsOverlay
          title="Consignes"
          onClose={closeInstructions}
          stepImage={{
            alt: "Étape d'entraînement du modèle",
            height: 540,
            src: "/Hints/StepsTrain.png",
            width: 6700,
          }}
        >
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

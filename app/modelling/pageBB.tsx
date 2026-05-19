"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { GoGear } from "react-icons/go";
import { Separator } from "@/app/components";
import { readDinoLabels } from "@/app/lib/dinoLabels";
import { MODEL_CONFIGS, type ModelId, type ModellingCondition } from "./modelConfig";
import { resolveModelInput, type ModelInput } from "./modelInputs";
import { markModelAsTrained, type ModelTrainingResult } from "./trainingState";

type ModellingBlackBoxProps = {
  model?: ModelId;
  condition?: ModellingCondition;
};

type PredictionRow = {
  régime_alimentaire_prédit?: string;
} & Record<string, string | number | boolean | undefined>;
type SortDirection = "ascending" | "descending";
type SortConfig = {
  column: string;
  direction: SortDirection;
} | null;

const SURFACE_SHADOW =
  "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)]";
const PREDICTION_COLUMN = "régime_alimentaire_prédit";

function countPredictions(rows: PredictionRow[]): ModelTrainingResult {
  return rows.reduce<ModelTrainingResult>(
    (totals, row) => {
      if (row.régime_alimentaire_prédit === "carnivore") {
        return { ...totals, pred_carnivores: totals.pred_carnivores + 1 };
      }

      if (row.régime_alimentaire_prédit === "herbivore") {
        return { ...totals, pred_herbivores: totals.pred_herbivores + 1 };
      }

      return totals;
    },
    { pred_carnivores: 0, pred_herbivores: 0 },
  );
}

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

function BlackBoxModelCard({
  model,
  isLoading,
}: {
  model: ModelId;
  isLoading: boolean;
}) {
  const modelConfig = MODEL_CONFIGS[model];

  return (
    <article className={`relative flex h-[200px] w-[275px] flex-col items-center justify-center overflow-hidden rounded-[20px] bg-white ${SURFACE_SHADOW} backdrop-blur-[20px]`}>
      <GoGear aria-hidden="true" className={`absolute left-[10px] top-[10px] size-[20px] text-[#18181b] ${isLoading ? "animate-spin" : ""}`} />
      <GoGear aria-hidden="true" className={`absolute right-[10px] top-[10px] size-[20px] text-[#18181b] ${isLoading ? "animate-spin" : ""}`} />
      <GoGear aria-hidden="true" className={`absolute bottom-[10px] left-[10px] size-[20px] text-[#18181b] ${isLoading ? "animate-spin" : ""}`} />
      <GoGear aria-hidden="true" className={`absolute bottom-[10px] right-[10px] size-[20px] text-[#18181b] ${isLoading ? "animate-spin" : ""}`} />
      <h1 className="text-center text-[24px] font-bold leading-[1.34] text-black">
        {modelConfig.title}
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

function compareCellValues(firstValue: string | number | boolean | undefined, secondValue: string | number | boolean | undefined) {
  const firstText = String(firstValue ?? "");
  const secondText = String(secondValue ?? "");
  const firstNumber = Number(firstText);
  const secondNumber = Number(secondText);
  const canCompareAsNumbers = firstText.trim() !== "" && secondText.trim() !== "" && !Number.isNaN(firstNumber) && !Number.isNaN(secondNumber);

  if (canCompareAsNumbers) {
    return firstNumber - secondNumber;
  }

  return firstText.localeCompare(secondText, "fr", {
    numeric: true,
    sensitivity: "base",
  });
}

async function fetchBlackBoxTrainingPredictions(modelInput: ModelInput) {
  const response = await fetch("/api/evaluation/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      features: modelInput.features,
      labels: readDinoLabels(),
      dataFile: modelInput.data,
      targetFile: modelInput.data,
    }),
  });

  if (!response.ok) {
    throw new Error("Impossible d’entraîner le modèle boîte noire.");
  }

  const payload = (await response.json()) as { rows?: PredictionRow[] };
  return payload.rows ?? [];
}

async function fitBlackBoxModel(modelInput: ModelInput) {
  return countPredictions(await fetchBlackBoxTrainingPredictions(modelInput));
}

function PredictionTrainingTableOverlay({
  modelInput,
  onClose,
}: {
  modelInput: ModelInput;
  onClose: () => void;
}) {
  const [rows, setRows] = useState<PredictionRow[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const headers = useMemo(() => {
    const firstRow = rows[0];

    if (!firstRow) {
      return [];
    }

    return [...Object.keys(firstRow).filter((header) => header !== PREDICTION_COLUMN), PREDICTION_COLUMN];
  }, [rows]);

  useEffect(() => {
    let isActive = true;

    async function loadTable() {
      try {
        const nextRows = await fetchBlackBoxTrainingPredictions(modelInput);

        if (isActive) {
          setRows(nextRows);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
        }
      }
    }

    loadTable();

    return () => {
      isActive = false;
    };
  }, [modelInput]);

  const sortedRows = useMemo(() => {
    if (!sortConfig) {
      return rows;
    }

    return [...rows].sort((firstRow, secondRow) => {
      const comparison = compareCellValues(firstRow[sortConfig.column], secondRow[sortConfig.column]);

      return sortConfig.direction === "ascending" ? comparison : -comparison;
    });
  }, [rows, sortConfig]);

  const updateSort = (column: string) => {
    setSortConfig((currentSort) => {
      if (currentSort?.column !== column) {
        return { column, direction: "ascending" };
      }

      return {
        column,
        direction: currentSort.direction === "ascending" ? "descending" : "ascending",
      };
    });
  };

  return (
    <div className="fixed inset-0 z-30 flex items-center justify-center bg-black/45 px-[32px] py-[32px] backdrop-blur-[2px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="bb-training-table-title"
        className="flex max-h-full w-full max-w-[1280px] flex-col gap-[18px] overflow-hidden rounded-[24px] border border-[#dedee0] bg-[#f5f5f5] p-[32px] text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_14px_28px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-start justify-between gap-[18px]">
          <div>
            <h2 id="bb-training-table-title" className="text-[28px] font-bold leading-[1.16]">
              Données d&apos;entraînement avec prédictions
            </h2>
            <p className="mt-[6px] text-[14px] font-medium text-[#52525b]">
              {sortConfig
                ? `Tri: ${sortConfig.column} (${sortConfig.direction === "ascending" ? "croissant" : "décroissant"})`
                : "Tri: dataframe initial"}
            </p>
          </div>
          <div className="flex items-center gap-[10px]">
            <Button
              className="rounded-full border border-[#c9c9cf] bg-white px-[14px] py-[8px] text-[14px] font-medium text-[#27272a] transition hover:border-[#71717a] disabled:cursor-not-allowed disabled:opacity-45"
              isDisabled={!sortConfig}
              onPress={() => setSortConfig(null)}
            >
              Réinitialiser le tri
            </Button>
            <Button
              className="min-h-[40px] rounded-full bg-[#18181b] px-[16px] text-[14px] font-medium text-white"
              onPress={onClose}
            >
              Fermer
            </Button>
          </div>
        </div>

        <div className="min-h-0 overflow-auto rounded-[8px] border border-[#dedee0] bg-white">
          {errorMessage ? (
            <p className="p-[20px] text-[16px] text-[#b42318]">{errorMessage}</p>
          ) : (
            <table className="min-w-full border-collapse text-left text-[14px] leading-[1.35]">
              <thead className="sticky top-0 z-10 bg-[#f4f4f5] text-[#3f3f46]">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="whitespace-nowrap border-b border-[#dedee0] px-[12px] py-[10px] font-semibold">
                      <button
                        type="button"
                        className="flex w-full items-center gap-[6px] text-left font-semibold"
                        onClick={() => updateSort(header)}
                      >
                        <span>{header}</span>
                        {sortConfig?.column === header && (
                          <span className="text-[11px] uppercase text-[#71717a]" aria-hidden="true">
                            {sortConfig.direction === "ascending" ? "asc" : "desc"}
                          </span>
                        )}
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {sortedRows.map((row) => (
                  <tr key={String(row.nom)} className="odd:bg-white even:bg-[#fafafa]">
                    {headers.map((header) => (
                      <td key={header} className="whitespace-nowrap border-b border-[#ededf0] px-[12px] py-[9px] text-[#27272a]">
                        {String(row[header] ?? "")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}

export default function ModellingBlackBox({
  model = "A",
  condition = "BB",
}: ModellingBlackBoxProps) {
  const router = useRouter();
  const modelInput = useMemo(
    () =>
      resolveModelInput({
        modelId: model,
        condition,
        selectedFeatures: [],
        modelBFeatures: null,
      }),
    [condition, model],
  );
  const [trainingResult, setTrainingResult] = useState<ModelTrainingResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isTableOpen, setIsTableOpen] = useState(false);
  const isLoading = !trainingResult && !errorMessage;

  useEffect(() => {
    let isActive = true;

    async function trainModel() {
      try {
        const [result] = await Promise.all([
          fitBlackBoxModel(modelInput),
          new Promise((resolve) => setTimeout(resolve, 900)),
        ]);

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

    markModelAsTrained(model, trainingResult, condition);
    router.push("/modelling");
  };

  return (
    <div
      className="relative flex min-h-dvh w-full justify-center overflow-auto bg-cover bg-center bg-no-repeat px-[24px] py-[50px] text-[#18181b]"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div aria-hidden="true" className="fixed inset-0 bg-black/35" />
      <main className="relative flex min-h-[calc(100dvh-100px)] w-full min-w-[980px] flex-col items-center">
        <TrainingDataCard
          carnivores={modelInput.init_carnivores}
          herbivores={modelInput.init_herbivores}
          onInspectTable={() => setIsTableOpen(true)}
        />
        <Separator orientation="vertical" className="h-[42px] w-[5px]" />
        <BlackBoxModelCard model={model} isLoading={isLoading} />

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
            Retour aux modèles
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
          onClose={() => setIsTableOpen(false)}
        />
      )}
    </div>
  );
}

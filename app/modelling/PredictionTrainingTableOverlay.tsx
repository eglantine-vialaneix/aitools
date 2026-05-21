"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { DataTable, type SortConfig } from "@/app/components";
import { readDinoLabels } from "@/app/lib/dinoLabels";
import { type ModelInput } from "./modelInputs";
import { type ModelTrainingResult } from "./trainingState";
import { compareCellValues, type PredictionTableRow } from "./tableRows";

const PREDICTION_COLUMN = "régime_alimentaire_prédit";

export function countPredictions(rows: PredictionTableRow[]): ModelTrainingResult {
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

export async function fetchBlackBoxTrainingPredictions(modelInput: ModelInput) {
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

  const payload = (await response.json()) as { rows?: PredictionTableRow[] };
  return payload.rows ?? [];
}

export async function fitBlackBoxModel(modelInput: ModelInput) {
  return countPredictions(await fetchBlackBoxTrainingPredictions(modelInput));
}

export function PredictionTrainingTableOverlay({
  modelInput,
  rows: providedRows,
  onClose,
}: {
  modelInput?: ModelInput;
  rows?: PredictionTableRow[];
  onClose: () => void;
}) {
  const [fetchedRows, setFetchedRows] = useState<PredictionTableRow[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [fetchErrorMessage, setFetchErrorMessage] = useState<string | null>(null);
  const rows = providedRows ?? fetchedRows;
  const missingModelInputMessage = !providedRows && !modelInput
    ? "Aucune table de prédictions n’est disponible pour ce modèle."
    : null;
  const errorMessage = providedRows ? null : missingModelInputMessage ?? fetchErrorMessage;
  const headers = useMemo(() => {
    const firstRow = rows[0];

    if (!firstRow) {
      return [];
    }

    return [...Object.keys(firstRow).filter((header) => header !== PREDICTION_COLUMN), PREDICTION_COLUMN];
  }, [rows]);

  useEffect(() => {
    if (providedRows) {
      return;
    }

    if (!modelInput) {
      return;
    }

    let isActive = true;
    const input = modelInput;

    async function loadTable() {
      try {
        const nextRows = await fetchBlackBoxTrainingPredictions(input);

        if (isActive) {
          setFetchedRows(nextRows);
          setFetchErrorMessage(null);
        }
      } catch (error) {
        if (isActive) {
          setFetchErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
        }
      }
    }

    loadTable();

    return () => {
      isActive = false;
    };
  }, [modelInput, providedRows]);

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
        aria-labelledby="prediction-training-table-title"
        className="flex max-h-full w-full max-w-[1280px] flex-col gap-[18px] overflow-hidden rounded-[24px] border border-[#dedee0] bg-[#f5f5f5] p-[32px] text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_14px_28px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-start justify-between gap-[18px]">
          <div>
            <h2 id="prediction-training-table-title" className="text-[28px] font-bold leading-[1.16]">
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
            <DataTable
              headers={headers}
              rows={sortedRows}
              sortConfig={sortConfig}
              onSort={updateSort}
              getRowKey={(row) => String(row.nom)}
            />
          )}
        </div>
      </section>
    </div>
  );
}

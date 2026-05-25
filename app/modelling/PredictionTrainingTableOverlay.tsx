"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { DataTable, type SortConfig } from "@/app/components";
import { readDinoLabels } from "@/app/lib/dinoLabels";
import { type ModelInput } from "./modelInputs";
import { type ModelTrainingResult } from "./trainingState";
import { compareCellValues, loadLabelledTrainingRows, type PredictionTableRow } from "./tableRows";

const LABEL_COLUMN = "régime_alimentaire";
const PREDICTION_COLUMN = "régime_alimentaire_prédit";
const predictionRowsCache = new Map<string, PredictionTableRow[]>();
const inFlightPredictionRequests = new Map<string, Promise<PredictionTableRow[]>>();

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
  const payload = {
    features: modelInput.features,
    labels: readDinoLabels(),
    dataFile: modelInput.data,
    targetFile: modelInput.data,
  };
  const cacheKey = JSON.stringify(payload);
  const cachedRows = predictionRowsCache.get(cacheKey);

  if (cachedRows) {
    return cachedRows;
  }

  const inFlightRequest = inFlightPredictionRequests.get(cacheKey);

  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = fetch("/api/evaluation/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Impossible d’entraîner le modèle boîte noire.");
      }

      const responsePayload = (await response.json()) as { rows?: PredictionTableRow[] };
      const rows = responsePayload.rows ?? [];

      predictionRowsCache.set(cacheKey, rows);
      return rows;
    })
    .finally(() => {
      inFlightPredictionRequests.delete(cacheKey);
    });

  inFlightPredictionRequests.set(cacheKey, request);
  return request;
}

export async function fitBlackBoxModel(modelInput: ModelInput) {
  const predictionRows = await fetchBlackBoxTrainingPredictions(modelInput);

  return {
    ...countPredictions(predictionRows),
    predictionRows,
  };
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
  const [fetchedRowsKey, setFetchedRowsKey] = useState<string | null>(null);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [fetchErrorMessage, setFetchErrorMessage] = useState<string | null>(null);
  const [changedCells, setChangedCells] = useState<Set<string>>(new Set());
  const requestKey = modelInput ? JSON.stringify({ features: modelInput.features, dataFile: modelInput.data }) : null;
  const rows = useMemo(
    () => providedRows ?? (fetchedRowsKey === requestKey ? fetchedRows : []),
    [fetchedRows, fetchedRowsKey, providedRows, requestKey],
  );
  const missingModelInputMessage = !providedRows && !modelInput
    ? "Aucune table de prédictions n’est disponible pour ce modèle."
    : null;
  const errorMessage = providedRows ? null : missingModelInputMessage ?? fetchErrorMessage;
  const isLoading = !providedRows && Boolean(modelInput) && !errorMessage && rows.length === 0;
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
          setFetchedRowsKey(JSON.stringify({ features: input.features, dataFile: input.data }));
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

  useEffect(() => {
    if (!modelInput) {
      setChangedCells(new Set());
      return;
    }

    let isActive = true;
    const input = modelInput;

    async function loadChangedCells() {
      try {
        const loadedTable = await loadLabelledTrainingRows(input.data);

        if (isActive) {
          setChangedCells(loadedTable.changedCells);
        }
      } catch {
        if (isActive) {
          setChangedCells(new Set());
        }
      }
    }

    loadChangedCells();

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
          {isLoading ? (
            <p className="p-[20px] text-[16px] font-medium text-[#52525b]">Chargement du tableau…</p>
          ) : errorMessage ? (
            <p className="p-[20px] text-[16px] text-[#b42318]">{errorMessage}</p>
          ) : (
            <DataTable
              headers={headers}
              rows={sortedRows}
              sortConfig={sortConfig}
              onSort={updateSort}
              getRowKey={(row) => String(row.nom)}
              renderCell={(row, header, _rowIndex, _columnIndex, defaultContent) => {
                const wasOverwritten = changedCells.has(`${row.nom}:${header}`);

                if (wasOverwritten && header === LABEL_COLUMN) {
                  return (
                    <span>
                      <em>{defaultContent}</em>{" "}
                      <span aria-label="Régime mal étiqueté" title="Régime mal étiqueté">
                        ‼️
                      </span>
                    </span>
                  );
                }

                return wasOverwritten ? <em>{defaultContent}</em> : defaultContent;
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
}

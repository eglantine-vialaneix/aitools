"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@heroui/react";
import { DataTable, type SortConfig } from "@/app/components";
import { type ModelDataFile } from "./modelConfig";
import { compareCellValues, loadLabelledTrainingRows, type TrainingTableRow } from "./tableRows";

export function TrainingTableOverlay({
  dataFile,
  onClose,
}: {
  dataFile: ModelDataFile;
  onClose: () => void;
}) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<TrainingTableRow[]>([]);
  const [changedCells, setChangedCells] = useState<Set<string>>(new Set());
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [loadedDataFile, setLoadedDataFile] = useState<ModelDataFile | null>(null);
  const isLoading = loadedDataFile !== dataFile && !errorMessage;

  useEffect(() => {
    let isActive = true;

    async function loadTrainingTable() {
      try {
        const loadedTable = await loadLabelledTrainingRows(dataFile);

        if (isActive) {
          setHeaders(loadedTable.headers);
          setRows(loadedTable.rows);
          setChangedCells(loadedTable.changedCells);
          setErrorMessage(null);
          setLoadedDataFile(dataFile);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
        }
      }
    }

    loadTrainingTable();

    return () => {
      isActive = false;
    };
  }, [dataFile]);

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
        aria-labelledby="training-table-title"
        className="flex max-h-full w-full max-w-[1280px] flex-col gap-[18px] overflow-hidden rounded-[24px] border border-[#dedee0] bg-[#f5f5f5] p-[32px] text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_14px_28px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-start justify-between gap-[18px]">
          <div>
            <h2 id="training-table-title" className="text-[28px] font-bold leading-[1.16]">
              Données d&apos;entraînement
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
              getRowKey={(row) => row.nom}
              renderCell={(row, header) => {
                const wasOverwritten = changedCells.has(`${row.nom}:${header}`);

                return wasOverwritten ? <em>{row[header]}</em> : row[header];
              }}
            />
          )}
        </div>
      </section>
    </div>
  );
}

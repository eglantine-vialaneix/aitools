"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { DataTable, type SortConfig } from "@/app/components";
import { readDinoLabels } from "@/app/lib/dinoLabels";
import { writeSelectedFeatures } from "@/app/lib/featureSelectionState";

type TableRow = Record<string, string>;

const LABEL_COLUMN = "régime_alimentaire";
const NAME_COLUMN_WIDTH_CLASS = "w-[150px] min-w-[150px]";
const LABEL_COLUMN_WIDTH_CLASS = "w-[150px] min-w-[150px]";

function getStickyColumnClass(header: string, columnIndex: number, orderedHeaders: string[]) {
  if (header === "nom" && columnIndex === 0) {
    return `sticky left-0 ${NAME_COLUMN_WIDTH_CLASS}`;
  }

  if (header === LABEL_COLUMN && columnIndex === 1 && orderedHeaders[0] === "nom") {
    return `sticky left-[150px] ${LABEL_COLUMN_WIDTH_CLASS}`;
  }

  return "";
}

function parseCsvLine(line: string) {
  const values: string[] = [];
  let currentValue = "";
  let isInsideQuotes = false;

  for (let index = 0; index < line.length; index += 1) {
    const character = line[index];
    const nextCharacter = line[index + 1];

    if (character === '"' && isInsideQuotes && nextCharacter === '"') {
      currentValue += character;
      index += 1;
      continue;
    }

    if (character === '"') {
      isInsideQuotes = !isInsideQuotes;
      continue;
    }

    if (character === "," && !isInsideQuotes) {
      values.push(currentValue);
      currentValue = "";
      continue;
    }

    currentValue += character;
  }

  values.push(currentValue);
  return values;
}

function parseCsv(csvText: string) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0] ?? "");
  const rows = lines.slice(1).map((line) => {
    const values = parseCsvLine(line);

    return Object.fromEntries(headers.map((header, index) => [header, values[index] ?? ""]));
  });

  return { headers, rows };
}

function compareCellValues(firstValue: string, secondValue: string) {
  const firstNumber = Number(firstValue);
  const secondNumber = Number(secondValue);
  const canCompareAsNumbers = firstValue.trim() !== "" && secondValue.trim() !== "" && !Number.isNaN(firstNumber) && !Number.isNaN(secondNumber);

  if (canCompareAsNumbers) {
    return firstNumber - secondNumber;
  }

  return firstValue.localeCompare(secondValue, "fr", {
    numeric: true,
    sensitivity: "base",
  });
}

export default function FeatureSelectionBlackBox() {
  const router = useRouter();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [changedCells, setChangedCells] = useState<Set<string>>(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadTrainingTable() {
      try {
        const response = await fetch("/data/df_train.csv");

        if (!response.ok) {
          throw new Error("Impossible de charger df_train.csv.");
        }

        const csvText = await response.text();
        const parsedTable = parseCsv(csvText);
        const userLabels = readDinoLabels();
        const overwrittenCells = new Set<string>();

        const labelledRows = parsedTable.rows.map((row) => {
          const userDiet = userLabels[row.nom];

          if (!userDiet) {
            return { ...row };
          }

          if (userDiet !== row[LABEL_COLUMN]) {
            overwrittenCells.add(`${row.nom}:${LABEL_COLUMN}`);
          }

          return {
            ...row,
            [LABEL_COLUMN]: userDiet,
          };
        });

        if (isActive) {
          setHeaders(parsedTable.headers);
          setRows(labelledRows);
          setChangedCells(overwrittenCells);
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
  }, []);

  const featureHeaders = useMemo(
    () => headers.filter((header) => header !== "nom" && header !== LABEL_COLUMN),
    [headers],
  );

  const sortedRows = useMemo(() => {
    if (!sortConfig) {
      return rows;
    }

    return [...rows].sort((firstRow, secondRow) => {
      const comparison = compareCellValues(firstRow[sortConfig.column] ?? "", secondRow[sortConfig.column] ?? "");

      return sortConfig.direction === "ascending" ? comparison : -comparison;
    });
  }, [rows, sortConfig]);

  const toggleFeature = (feature: string) => {
    setSelectedFeatures((currentFeatures) => {
      if (currentFeatures.includes(feature)) {
        return currentFeatures.filter((currentFeature) => currentFeature !== feature);
      }

      if (currentFeatures.length >= 4) {
        return currentFeatures;
      }

      return [...currentFeatures, feature];
    });
  };

  const goToNextStep = () => {
    if (selectedFeatures.length === 4) {
      writeSelectedFeatures(selectedFeatures);
      router.push("/modelling");
    }
  };

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
    <div
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-[50px] py-[60px] text-[#18181b]"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
      <main className="relative flex max-h-[calc(100dvh-120px)] w-full max-w-[1280px] flex-col gap-[24px] overflow-hidden rounded-[24px] border border-[#dedee0] bg-[#f5f5f5] p-[32px] shadow-[-7px_7px_4px_0px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-[8px]">
          <p className="text-[16px] font-medium text-[#52525b]">Étape 2</p>
          <h1 className="text-[40px] font-bold leading-[1.1]">Sélection des caractéristiques</h1>
          <p className="max-w-[900px] text-[18px] leading-[1.45] text-[#3f3f46]">
            Choisis 4 caractéristiques parmi les colonnes disponibles.
          </p>
        </div>

        <section className="flex flex-wrap gap-[10px]" aria-label="Caractéristiques disponibles">
          {featureHeaders.map((feature) => (
            <Button
              key={feature}
              aria-pressed={selectedFeatures.includes(feature)}
              className={`min-h-[38px] rounded-full border px-[14px] py-[8px] text-[14px] font-medium transition ${
                selectedFeatures.includes(feature)
                  ? "border-[#18181b] bg-[#18181b] text-white"
                  : "border-[#c9c9cf] bg-white text-[#27272a] hover:border-[#71717a]"
              }`}
              onPress={() => toggleFeature(feature)}
            >
              {feature}
            </Button>
          ))}
          <span className="flex items-center px-[4px] text-[14px] font-medium text-[#52525b]">
            {selectedFeatures.length}/4
          </span>
        </section>

        <div className="flex items-center justify-between gap-[16px]">
          <p className="text-[14px] font-medium text-[#52525b]">
            {sortConfig
              ? `Tri: ${sortConfig.column} (${sortConfig.direction === "ascending" ? "croissant" : "décroissant"})`
              : "Tri: dataframe initial"}
          </p>
          <div className="flex items-center gap-[10px]">
            <Button
              className="rounded-full border border-[#c9c9cf] bg-white px-[14px] py-[8px] text-[14px] font-medium text-[#27272a] transition hover:border-[#71717a] disabled:cursor-not-allowed disabled:opacity-45"
              isDisabled={!sortConfig}
              onPress={() => setSortConfig(null)}
            >
              Réinitialiser le tri
            </Button>
            <Button
              className="min-h-[40px] rounded-[22px] bg-[#006fee] px-[18px] text-[15px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
              isDisabled={selectedFeatures.length !== 4}
              onPress={goToNextStep}
            >
              Suite
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
              getRowKey={(row) => row.nom}
              getHeaderClassName={(header, columnIndex, orderedHeaders) => {
                const isSelectedFeature = selectedFeatures.includes(header);
                const stickyClass = getStickyColumnClass(header, columnIndex, orderedHeaders);

                return `${isSelectedFeature ? "bg-[#d9ecff] text-[#005bc4]" : "bg-[#f4f4f5]"} ${stickyClass} ${stickyClass ? "z-30" : ""}`;
              }}
              getHeaderButtonClassName={(header) => selectedFeatures.includes(header) ? "text-[#005bc4]" : "text-[#3f3f46]"}
              getCellClassName={(row, header, rowIndex, columnIndex, orderedHeaders) => {
                const isSelectedFeature = selectedFeatures.includes(header);
                const rowBackgroundClass = rowIndex % 2 === 0 ? "bg-white" : "bg-[#fafafa]";
                const stickyClass = getStickyColumnClass(header, columnIndex, orderedHeaders);

                return `${isSelectedFeature ? "bg-[#edf6ff]" : rowBackgroundClass} ${stickyClass} ${stickyClass ? "z-20" : ""}`;
              }}
              renderCell={(row, header) => {
                const wasOverwritten = changedCells.has(`${row.nom}:${header}`);

                return wasOverwritten ? <em>{row[header]}</em> : row[header];
              }}
            />
          )}
        </div>
      </main>
    </div>
  );
}

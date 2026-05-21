"use client";

import { useEffect, useMemo, useState, type Key } from "react";
import { useRouter } from "next/navigation";
import { Button, ListBox, Select } from "@heroui/react";
import { ActivityInstructionsButton, DataTable, type SortConfig } from "@/app/components";
import { readDinoLabels } from "@/app/lib/dinoLabels";

type TableRow = Record<string, string>;
type FeatureType = "Numérique" | "Booléen" | "Catégorique";
type FeatureSelectionWhiteBoxProps = {
  onShowInstructions?: () => void;
};

const LABEL_COLUMN = "régime_alimentaire";
const NAME_COLUMN_WIDTH_CLASS = "w-[150px] min-w-[150px]";
const LABEL_COLUMN_WIDTH_CLASS = "w-[190px] min-w-[190px]";

function getStickyColumnClass(header: string, columnIndex: number, orderedHeaders: string[]) {
  if (header === "nom" && columnIndex === 0) {
    return `sticky left-0 ${NAME_COLUMN_WIDTH_CLASS}`;
  }

  if (header === LABEL_COLUMN && columnIndex === 1 && orderedHeaders[0] === "nom") {
    return `sticky left-[150px] ${LABEL_COLUMN_WIDTH_CLASS}`;
  }

  return "";
}

const FEATURE_TYPES: FeatureType[] = ["Numérique", "Booléen", "Catégorique"];

const CORRECT_FEATURE_TYPES: Record<string, FeatureType> = {
  période: "Catégorique",
  habitat: "Catégorique",
  type: "Catégorique",
  bipède: "Booléen",
  "longueur (m)": "Numérique",
  "poids (kg)": "Numérique",
  espèce: "Catégorique",
  "sous-ordre_taxonomique": "Catégorique",
  famille_taxonomique: "Catégorique",
};

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

export default function FeatureSelectionWhiteBox({ onShowInstructions }: FeatureSelectionWhiteBoxProps) {
  const router = useRouter();
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [changedCells, setChangedCells] = useState<Set<string>>(new Set());
  const [selectedTypes, setSelectedTypes] = useState<Record<string, FeatureType | undefined>>({});
  const [hasCheckedAnswers, setHasCheckedAnswers] = useState(false);
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

  const hasSelectedAllTypes =
    featureHeaders.length > 0 && featureHeaders.every((feature) => selectedTypes[feature]);

  const incorrectFeatures = useMemo(
    () =>
      featureHeaders.filter(
        (feature) => selectedTypes[feature] && selectedTypes[feature] !== CORRECT_FEATURE_TYPES[feature],
      ),
    [featureHeaders, selectedTypes],
  );

  const hasAllCorrectTypes = hasSelectedAllTypes && incorrectFeatures.length === 0;

  const updateFeatureType = (feature: string, key: Key | null) => {
    const featureType = typeof key === "string" ? key : null;

    setSelectedTypes((currentTypes) => ({
      ...currentTypes,
      [feature]: FEATURE_TYPES.includes(featureType as FeatureType) ? (featureType as FeatureType) : undefined,
    }));
  };

  const goToNextStep = () => {
    setHasCheckedAnswers(true);

    if (hasAllCorrectTypes) {
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
      {onShowInstructions && <ActivityInstructionsButton onPress={onShowInstructions} />}
      <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
      <main className="relative flex max-h-[calc(100dvh-120px)] w-full max-w-[1280px] flex-col gap-[24px] overflow-hidden rounded-[24px] border border-[#dedee0] bg-[#f5f5f5] p-[32px] shadow-[-7px_7px_4px_0px_rgba(0,0,0,0.25)]">
        <div className="flex flex-col gap-[8px]">
          <p className="text-[16px] font-medium text-[#52525b]">Étape 2</p>
          <h1 className="text-[40px] font-bold leading-[1.1]">Type des caractéristiques</h1>
          <p className="max-w-[900px] text-[18px] leading-[1.45] text-[#3f3f46]">
            Indique le type de chaque caractéristique. Le tableau ci-dessous est une copie de df_train avec tes étiquettes.
          </p>
        </div>

        <section className="flex h-fit flex-col gap-[10px]" aria-label="Types des caractéristiques">
          <div className="grid h-fit w-full grid-cols-5 gap-[12px]">
            {featureHeaders.map((feature) => {
              const selectedType = selectedTypes[feature];
              const isIncorrect = hasCheckedAnswers && selectedType !== CORRECT_FEATURE_TYPES[feature];
              const isCorrect = hasCheckedAnswers && selectedType === CORRECT_FEATURE_TYPES[feature];

              return (
                <div key={feature} className="flex flex-col gap-[6px]">
                  <span className="text-[13px] font-medium text-[#3f3f46]">{feature}</span>
                  <Select
                    aria-label={`Type de ${feature}`}
                    placeholder="Choisir..."
                    selectedKey={selectedType ?? null}
                    className="w-full"
                    onSelectionChange={(key) => updateFeatureType(feature, key)}
                  >
                    <Select.Trigger
                      className={`min-h-[44px] rounded-[8px] border bg-white text-[14px] ${
                        isIncorrect
                          ? "border-[#ff383c]"
                          : isCorrect
                            ? "border-[#17c964]"
                            : "border-[#c9c9cf]"
                      }`}
                    >
                      <Select.Value />
                      <Select.Indicator />
                    </Select.Trigger>
                    <Select.Popover>
                      <ListBox>
                        {FEATURE_TYPES.map((featureType) => (
                          <ListBox.Item key={featureType} id={featureType} textValue={featureType}>
                            {featureType}
                          </ListBox.Item>
                        ))}
                      </ListBox>
                    </Select.Popover>
                  </Select>
                </div>
              );
            })}
          </div>

          {hasCheckedAnswers && !hasAllCorrectTypes && (
            <p className="text-[14px] leading-[1.35] text-[#b42318]">
              Corrige les types indiqués en rouge.
            </p>
          )}
        </section>

        <div className="flex items-center justify-between gap-[16px]">
          <p className="text-[14px] font-medium text-[#52525b]">
            {sortConfig
              ? `Tri: ${sortConfig.column} (${sortConfig.direction === "ascending" ? "croissant" : "décroissant"})`
              : "Tri: dataframe initial"}
          </p>
          <div className="flex items-center gap-[10px]">
            <button
              type="button"
              className="rounded-full border border-[#c9c9cf] bg-white px-[14px] py-[8px] text-[14px] font-medium text-[#27272a] transition hover:border-[#71717a] disabled:cursor-not-allowed disabled:opacity-45"
              disabled={!sortConfig}
              onClick={() => setSortConfig(null)}
            >
              Réinitialiser le tri
            </button>
            <Button
              className="min-h-[40px] rounded-[22px] bg-[#006fee] px-[18px] text-[15px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
              isDisabled={!hasSelectedAllTypes}
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
                const stickyClass = getStickyColumnClass(header, columnIndex, orderedHeaders);

                return `bg-[#f4f4f5] ${stickyClass} ${stickyClass ? "z-30" : ""}`;
              }}
              getCellClassName={(row, header, rowIndex, columnIndex, orderedHeaders) => {
                const rowBackgroundClass = rowIndex % 2 === 0 ? "bg-white" : "bg-[#fafafa]";
                const stickyClass = getStickyColumnClass(header, columnIndex, orderedHeaders);

                return `${rowBackgroundClass} ${stickyClass} ${stickyClass ? "z-20" : ""}`;
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

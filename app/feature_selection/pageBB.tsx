"use client";

import { useEffect, useMemo, useState } from "react";
import { readDinoLabels } from "@/app/lib/dinoLabels";

type TableRow = Record<string, string>;

const LABEL_COLUMN = "régime_alimentaire";

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

export default function FeatureSelectionBlackBox() {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<TableRow[]>([]);
  const [changedCells, setChangedCells] = useState<Set<string>>(new Set());
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);
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
            Choisis 4 caractéristiques parmi les colonnes disponibles. Le tableau ci-dessous est une copie de df_train avec tes étiquettes.
          </p>
        </div>

        <section className="flex flex-wrap gap-[10px]" aria-label="Caractéristiques disponibles">
          {featureHeaders.map((feature) => (
            <button
              key={feature}
              type="button"
              aria-pressed={selectedFeatures.includes(feature)}
              className={`rounded-full border px-[14px] py-[8px] text-[14px] font-medium transition ${
                selectedFeatures.includes(feature)
                  ? "border-[#18181b] bg-[#18181b] text-white"
                  : "border-[#c9c9cf] bg-white text-[#27272a] hover:border-[#71717a]"
              }`}
              onClick={() => toggleFeature(feature)}
            >
              {feature}
            </button>
          ))}
          <span className="flex items-center px-[4px] text-[14px] font-medium text-[#52525b]">
            {selectedFeatures.length}/4
          </span>
        </section>

        <div className="min-h-0 overflow-auto rounded-[8px] border border-[#dedee0] bg-white">
          {errorMessage ? (
            <p className="p-[20px] text-[16px] text-[#b42318]">{errorMessage}</p>
          ) : (
            <table className="min-w-full border-collapse text-left text-[14px] leading-[1.35]">
              <thead className="sticky top-0 z-10 bg-[#f4f4f5] text-[#3f3f46]">
                <tr>
                  {headers.map((header) => (
                    <th key={header} className="whitespace-nowrap border-b border-[#dedee0] px-[12px] py-[10px] font-semibold">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.nom} className="odd:bg-white even:bg-[#fafafa]">
                    {headers.map((header) => {
                      const wasOverwritten = changedCells.has(`${row.nom}:${header}`);

                      return (
                        <td key={header} className="whitespace-nowrap border-b border-[#ededf0] px-[12px] py-[9px] text-[#27272a]">
                          {wasOverwritten ? <em>{row[header]}</em> : row[header]}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </main>
    </div>
  );
}

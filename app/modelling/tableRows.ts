"use client";

import { readDinoLabels } from "@/app/lib/dinoLabels";
import { type ModelDataFile } from "./modelConfig";

export type TableCellValue = string | number | boolean | undefined;
export type TrainingTableRow = Record<string, string>;
export type PredictionTableRow = {
  régime_alimentaire_prédit?: string;
} & Record<string, TableCellValue>;

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

export function compareCellValues(firstValue: TableCellValue, secondValue: TableCellValue) {
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

export async function loadLabelledTrainingRows(dataFile: ModelDataFile) {
  const response = await fetch(`/data/${dataFile}`);

  if (!response.ok) {
    throw new Error(`Impossible de charger ${dataFile}.`);
  }

  const csvText = await response.text();
  const parsedTable = parseCsv(csvText);
  const userLabels = readDinoLabels();
  const changedCells = new Set<string>();
  const rows = parsedTable.rows.map((row) => {
    const userDiet = userLabels[row.nom];

    if (!userDiet) {
      return { ...row };
    }

    if (userDiet !== row[LABEL_COLUMN]) {
      changedCells.add(`${row.nom}:${LABEL_COLUMN}`);
    }

    return {
      ...row,
      [LABEL_COLUMN]: userDiet,
    };
  });

  return {
    headers: parsedTable.headers,
    rows,
    changedCells,
  };
}

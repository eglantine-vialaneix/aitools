import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

type GiniRequest = {
  features?: unknown;
  labels?: unknown;
  filters?: unknown;
  dataFile?: unknown;
};

type DataFile = "df_train.csv" | "df_train_partial.csv";
type CellValue = string | number | boolean;
type TableRow = Record<string, CellValue>;
type Diet = "herbivore" | "carnivore";

type SplitFilter = {
  feature: string;
  operator: "eq" | "gte";
  value: CellValue;
  branch: "yes" | "no";
};

type NodeCounts = {
  total: number;
  carnivores: number;
  herbivores: number;
  majority: Diet;
  isPure: boolean;
};

const LABEL_COLUMN = "régime_alimentaire";
const NAME_COLUMN = "nom";
const DATA_ROOT = path.join(process.cwd(), "public", "data");
const giniCache = new Map<string, unknown>();
const inFlightGini = new Map<string, Promise<unknown>>();

function isSplitFilter(value: unknown): value is SplitFilter {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return false;
  }

  const candidate = value as Record<string, unknown>;

  return (
    typeof candidate.feature === "string" &&
    (candidate.operator === "eq" || candidate.operator === "gte") &&
    (typeof candidate.value === "string" ||
      typeof candidate.value === "number" ||
      typeof candidate.value === "boolean") &&
    (candidate.branch === "yes" || candidate.branch === "no")
  );
}

function stableStringify(value: unknown): string {
  if (!value || typeof value !== "object") {
    return JSON.stringify(value);
  }

  if (Array.isArray(value)) {
    return `[${value.map(stableStringify).join(",")}]`;
  }

  const objectValue = value as Record<string, unknown>;
  return `{${Object.keys(objectValue)
    .sort()
    .map((key) => `${JSON.stringify(key)}:${stableStringify(objectValue[key])}`)
    .join(",")}}`;
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

function rawValueToTypedValue(value: string, columnValues: string[]): CellValue {
  const isBooleanColumn = columnValues.every((columnValue) => columnValue === "True" || columnValue === "False");

  if (isBooleanColumn) {
    return value === "True";
  }

  const isNumericColumn = columnValues.every((columnValue) => columnValue.trim() !== "" && Number.isFinite(Number(columnValue)));

  if (isNumericColumn) {
    return Number(value);
  }

  return value;
}

function parseCsv(csvText: string) {
  const lines = csvText.trim().split(/\r?\n/);
  const headers = parseCsvLine(lines[0] ?? "");
  const rawRows = lines.slice(1).map(parseCsvLine);
  const valuesByHeader = Object.fromEntries(
    headers.map((header, index) => [header, rawRows.map((row) => row[index] ?? "")]),
  );

  const rows = rawRows.map((rawRow) =>
    Object.fromEntries(
      headers.map((header, index) => [
        header,
        rawValueToTypedValue(rawRow[index] ?? "", valuesByHeader[header] ?? []),
      ]),
    ),
  ) as TableRow[];

  return { headers, rows };
}

async function readRows(dataFile: DataFile) {
  const csvText = await readFile(path.join(DATA_ROOT, dataFile), "utf8");
  return parseCsv(csvText).rows;
}

function normalizeForColumn(row: TableRow | undefined, feature: string, value: CellValue): CellValue {
  const sample = row?.[feature];

  if (typeof sample === "number") {
    return Number(value);
  }

  if (typeof sample === "boolean") {
    return value === true || value === "True" || value === "true";
  }

  return String(value);
}

function maskForSplit(rows: TableRow[], feature: string, operator: "eq" | "gte", rawValue: CellValue) {
  const value = normalizeForColumn(rows[0], feature, rawValue);

  return rows.map((row) => {
    if (operator === "gte") {
      return Number(row[feature]) >= Number(value);
    }

    return row[feature] === value;
  });
}

function applyFilters(rows: TableRow[], filters: SplitFilter[]) {
  return filters.reduce((filteredRows, condition) => {
    if (!filteredRows[0] || !(condition.feature in filteredRows[0])) {
      return filteredRows;
    }

    const mask = maskForSplit(filteredRows, condition.feature, condition.operator, condition.value);
    return filteredRows.filter((_, index) => (condition.branch === "yes" ? mask[index] : !mask[index]));
  }, rows);
}

function counts(rows: TableRow[]): NodeCounts {
  const carnivores = rows.filter((row) => row[LABEL_COLUMN] === "carnivore").length;
  const herbivores = rows.filter((row) => row[LABEL_COLUMN] === "herbivore").length;

  return {
    total: rows.length,
    carnivores,
    herbivores,
    majority: carnivores >= herbivores ? "carnivore" : "herbivore",
    isPure: carnivores === 0 || herbivores === 0,
  };
}

function nodeImpurityScore(rows: TableRow[]) {
  const nodeCounts = counts(rows);

  if (nodeCounts.total === 0) {
    return 0;
  }

  return (nodeCounts.carnivores * nodeCounts.herbivores) / nodeCounts.total;
}

function giniImpurity(yesRows: TableRow[], noRows: TableRow[]) {
  const yesCounts = counts(yesRows);
  const noCounts = counts(noRows);

  if (yesCounts.total === 0 || noCounts.total === 0) {
    return Infinity;
  }

  return (
    (yesCounts.herbivores * yesCounts.carnivores) / yesCounts.total +
    (noCounts.herbivores * noCounts.carnivores) / noCounts.total
  );
}

function uniqueValues(rows: TableRow[], feature: string) {
  return [...new Set(rows.map((row) => row[feature]))].sort((first, second) => {
    if (typeof first === "number" && typeof second === "number") {
      return first - second;
    }

    const firstText = String(first);
    const secondText = String(second);

    if (firstText < secondText) {
      return -1;
    }

    if (firstText > secondText) {
      return 1;
    }

    return 0;
  });
}

function formatCriterion(value: CellValue, isNumeric: boolean) {
  const formattedValue = typeof value === "number" && Number.isFinite(value) ? Number(value.toFixed(3)) : value;
  return isNumeric ? `>= ${formattedValue}` : `= ${formattedValue}`;
}

async function computeGiniResponse(payload: {
  features: string[];
  labels: Record<string, Diet>;
  filters: SplitFilter[];
  dataFile: DataFile;
}) {
  const labelledRows = (await readRows(payload.dataFile)).map((row) => {
    const name = String(row[NAME_COLUMN] ?? "");
    const diet = payload.labels[name];

    return diet ? { ...row, [LABEL_COLUMN]: diet } : row;
  });
  const rows = applyFilters(labelledRows, payload.filters);
  const nodeCounts = counts(rows);
  const missingFeatures: string[] = [];
  const results = payload.features.map((feature) => {
    if (!rows[0] || !(feature in rows[0])) {
      missingFeatures.push(feature);

      return {
        feature,
        gini: nodeImpurityScore(rows),
        criterion: "",
        operator: "eq" as const,
        value: "",
        yes: counts([]),
        no: nodeCounts,
        isSplittable: false,
        reason: "Feature is not present in this dataset.",
      };
    }

    const isNumeric = typeof rows[0][feature] === "number";
    const operator = isNumeric ? "gte" : "eq";
    const pairs = uniqueValues(rows, feature)
      .map((value) => {
        const mask = maskForSplit(rows, feature, operator, value);
        const yes = rows.filter((_, index) => mask[index]);
        const no = rows.filter((_, index) => !mask[index]);

        return { value, gini: giniImpurity(yes, no), yes, no };
      })
      .filter((pair) => Number.isFinite(pair.gini));

    if (!pairs.length) {
      const fallbackValue = uniqueValues(rows, feature)[0] ?? "";

      return {
        feature,
        gini: nodeImpurityScore(rows),
        criterion: formatCriterion(fallbackValue, isNumeric),
        operator,
        value: fallbackValue,
        yes: nodeCounts,
        no: counts([]),
        isSplittable: false,
        reason: "This feature cannot split the current node into two non-empty groups.",
      };
    }

    const best = pairs.reduce((currentBest, pair) => (pair.gini < currentBest.gini ? pair : currentBest), pairs[0]);

    return {
      feature,
      gini: best.gini,
      criterion: formatCriterion(best.value, isNumeric),
      operator,
      value: best.value,
      yes: counts(best.yes),
      no: counts(best.no),
      isSplittable: true,
    };
  });

  return { counts: nodeCounts, results, missingFeatures };
}

export async function POST(request: Request) {
  const body = (await request.json()) as GiniRequest;
  const features = Array.isArray(body.features)
    ? body.features.filter((feature): feature is string => typeof feature === "string")
    : [];
  const labels =
    body.labels && typeof body.labels === "object" && !Array.isArray(body.labels)
      ? Object.fromEntries(
          Object.entries(body.labels).filter(
            (entry): entry is [string, Diet] =>
              typeof entry[0] === "string" &&
              (entry[1] === "herbivore" || entry[1] === "carnivore"),
          ),
        )
      : {};
  const filters = Array.isArray(body.filters) ? body.filters.filter(isSplitFilter) : [];
  const dataFile: DataFile = body.dataFile === "df_train_partial.csv" ? "df_train_partial.csv" : "df_train.csv";

  if (features.length === 0) {
    return NextResponse.json({ counts: counts([]), results: [], missingFeatures: [] });
  }

  const payload = { features, labels, filters, dataFile };
  const cacheKey = stableStringify(payload);
  const cachedResponse = giniCache.get(cacheKey);

  if (cachedResponse) {
    return NextResponse.json(cachedResponse);
  }

  const existingRequest = inFlightGini.get(cacheKey);

  if (existingRequest) {
    return NextResponse.json(await existingRequest);
  }

  const nextRequest = computeGiniResponse(payload);
  inFlightGini.set(cacheKey, nextRequest);

  try {
    const response = await nextRequest;
    giniCache.set(cacheKey, response);
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to compute Gini impurity.",
      },
      { status: 500 },
    );
  } finally {
    inFlightGini.delete(cacheKey);
  }
}

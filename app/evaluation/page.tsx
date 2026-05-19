"use client";

import { useEffect, useMemo, useState } from "react";
import { Button, Input, TextArea } from "@heroui/react";
import { GoGear } from "react-icons/go";
import { Separator } from "@/app/components";
import { readDinoLabels } from "@/app/lib/dinoLabels";
import {
  conditionForStep,
  useExperimentCondition,
} from "@/app/lib/experimentCondition";
import { readSelectedFeatures } from "@/app/lib/featureSelectionState";
import {
  MODEL_IDS,
  type ModelId,
  type ModellingCondition,
} from "@/app/modelling/modelConfig";
import {
  bestAndWorstGiniFeatures,
  resolveModelInput,
  type ModelInput,
} from "@/app/modelling/modelInputs";

type AccuracyField = "correct" | "total" | "accuracy";
type MatrixField = "carnivoreCorrect" | "carnivoreWrong" | "herbivoreCorrect" | "herbivoreWrong";
type AccuracyInputs = Record<ModelId, Record<AccuracyField, string>>;
type MatrixInputs = Record<ModelId, Record<MatrixField, string>>;
type TestTableRow = Record<string, string | number | boolean>;
type SortDirection = "ascending" | "descending";
type SortConfig = {
  column: string;
  direction: SortDirection;
} | null;
type TableOverlayState = {
  modelId: ModelId;
  modelInput: ModelInput;
} | null;
type ExpectedModelAnswers = {
  accuracy: Record<AccuracyField, number>;
  matrix: Record<MatrixField, number>;
};

const BACKGROUND_IMAGE = "/background.png";
const LABEL_COLUMN = "régime_alimentaire";
const PREDICTION_COLUMN = "régime_alimentaire_prédit";
const TEST_FEATURE_COLUMNS = [
  "période",
  "habitat",
  "type",
  "bipède",
  "longueur (m)",
  "poids (kg)",
  "espèce",
  "sous-ordre_taxonomique",
  "famille_taxonomique",
];

const QUESTION_PROMPTS = [
  "Comment qualifierais-tu la performance de chaque modèle? Bonne ? Mauvaise ? Pourquoi ?",
  "Que corrigerais-tu pour améliorer la performance des moins bons modèles?",
  "Quelle est la meilleure façon d’évaluer un modèle selon toi? Propose une troisième méthode.",
];

function modelTitle(modelId: ModelId) {
  return `Modèle ${modelId}`;
}

function modelTableColumns(condition: ModellingCondition, features: string[]) {
  const visibleFeatures = condition === "BB" ? TEST_FEATURE_COLUMNS : features;

  return ["nom", LABEL_COLUMN, ...visibleFeatures, PREDICTION_COLUMN];
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

function emptyAccuracyInputs() {
  return Object.fromEntries(
    MODEL_IDS.map((modelId) => [modelId, { correct: "", total: "", accuracy: "" }]),
  ) as AccuracyInputs;
}

function emptyMatrixInputs() {
  return Object.fromEntries(
    MODEL_IDS.map((modelId) => [
      modelId,
      {
        carnivoreCorrect: "",
        carnivoreWrong: "",
        herbivoreCorrect: "",
        herbivoreWrong: "",
      },
    ]),
  ) as MatrixInputs;
}

function isCountCorrect(value: string, expectedValue: number) {
  return value.trim() !== "" && Number(value) === expectedValue;
}

function isAccuracyCorrect(value: string, expectedValue: number) {
  if (value.trim() === "") {
    return false;
  }

  return Math.abs(Number(value) - expectedValue) <= 0.1;
}

function computeExpectedAnswers(rows: TestTableRow[]): ExpectedModelAnswers {
  const matrix = rows.reduce<Record<MatrixField, number>>(
    (counts, row) => {
      const actual = row[LABEL_COLUMN];
      const prediction = row[PREDICTION_COLUMN];
      const isCorrect = actual === prediction;

      if (actual === "carnivore") {
        counts[isCorrect ? "carnivoreCorrect" : "carnivoreWrong"] += 1;
      }

      if (actual === "herbivore") {
        counts[isCorrect ? "herbivoreCorrect" : "herbivoreWrong"] += 1;
      }

      return counts;
    },
    {
      carnivoreCorrect: 0,
      carnivoreWrong: 0,
      herbivoreCorrect: 0,
      herbivoreWrong: 0,
    },
  );
  const correct = matrix.carnivoreCorrect + matrix.herbivoreCorrect;
  const total = rows.length;
  const accuracy = total > 0 ? Number(((correct / total) * 100).toFixed(1)) : 0;

  return {
    accuracy: { correct, total, accuracy },
    matrix,
  };
}

async function fetchPredictionRows(modelInput: ModelInput) {
  const response = await fetch("/api/evaluation/predictions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      features: modelInput.features,
      labels: readDinoLabels(),
      dataFile: modelInput.data,
    }),
  });

  if (!response.ok) {
    throw new Error("Impossible de calculer les prédictions du modèle.");
  }

  const payload = (await response.json()) as { rows?: TestTableRow[] };
  return payload.rows ?? [];
}

function EvaluationModelCard({
  modelId,
  onInspectTable,
}: {
  modelId: ModelId;
  onInspectTable: () => void;
}) {
  return (
    <article className="relative flex h-full min-h-[112px] w-full min-w-[199px] flex-col items-center justify-center gap-[10px] overflow-hidden rounded-[20px] bg-white px-[18px] py-[18px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)] backdrop-blur-[20px]">
      <h2 className="whitespace-nowrap text-center text-[16px] font-semibold leading-[1.5] text-black">
        {modelTitle(modelId)}
      </h2>
      <Button
        className="min-h-[32px] rounded-full border border-[#dedee0] bg-white px-[10px] text-[14px] font-medium text-[#18181b]"
        onPress={onInspectTable}
      >
        Inspecter le tableau
      </Button>
      <GoGear aria-hidden="true" className="absolute left-[10px] top-[10px] size-[20px] text-[#18181b]" />
      <GoGear aria-hidden="true" className="absolute right-[15px] top-[10px] size-[20px] text-[#18181b]" />
      <GoGear aria-hidden="true" className="absolute bottom-[15px] left-[10px] size-[20px] text-[#18181b]" />
      <GoGear aria-hidden="true" className="absolute bottom-[15px] right-[15px] size-[20px] text-[#18181b]" />
    </article>
  );
}

function answerKey(section: "accuracy", modelId: ModelId, field: AccuracyField) {
  return `${section}:${modelId}:${field}`;
}

function matrixKey(modelId: ModelId, field: MatrixField) {
  return `matrix:${modelId}:${field}`;
}

function SmallInput({
  ariaLabel,
  placeholder,
  value,
  onChange,
  isInvalid = false,
}: {
  ariaLabel: string;
  placeholder: string;
  value: string;
  onChange?: (value: string) => void;
  isInvalid?: boolean;
}) {
  return (
    <Input
      aria-label={ariaLabel}
      className={`h-[36px] w-[146px] [&>div]:h-[36px] [&>div]:min-h-[36px] [&>div]:rounded-[12px] [&>div]:bg-white [&_input]:text-[14px] ${
        isInvalid ? "[&>div]:border-[#ff383c]" : ""
      }`}
      onChange={(event) => onChange?.(event.target.value)}
      placeholder={placeholder}
      type="number"
      value={value}
    />
  );
}

function AccuracyFormula({
  modelId,
  correct,
  total,
  accuracy,
  invalidFields,
  onChange,
}: {
  modelId: ModelId;
  correct: string;
  total: string;
  accuracy: string;
  invalidFields: Set<string>;
  onChange: (field: AccuracyField, value: string) => void;
}) {
  return (
    <div className="flex items-center justify-start gap-[10px]">
      <div className="flex flex-col items-start gap-px">
        <SmallInput
          ariaLabel={`${modelTitle(modelId)} nombre de prédictions correctes`}
          isInvalid={invalidFields.has(answerKey("accuracy", modelId, "correct"))}
          onChange={(value) => onChange("correct", value)}
          placeholder="Nombre de corrects..."
          value={correct}
        />
        <Separator label="" className="w-[146px]" />
        <SmallInput
          ariaLabel={`${modelTitle(modelId)} nombre total de prédictions`}
          isInvalid={invalidFields.has(answerKey("accuracy", modelId, "total"))}
          onChange={(value) => onChange("total", value)}
          placeholder="Nombre total..."
          value={total}
        />
      </div>
      <span className="text-[16px] font-semibold leading-[1.5] text-[#71717a]">=</span>
      <SmallInput
        ariaLabel={`${modelTitle(modelId)} exactitude calculée`}
        isInvalid={invalidFields.has(answerKey("accuracy", modelId, "accuracy"))}
        onChange={(value) => onChange("accuracy", value)}
        placeholder="Exactitude..."
        value={accuracy}
      />
      <span className="text-[16px] font-semibold leading-[1.5] text-[#71717a]">%</span>
    </div>
  );
}

function MatrixInput({
  ariaLabel,
  isInvalid,
  onChange,
  value,
}: {
  ariaLabel: string;
  isInvalid: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <input
      aria-label={ariaLabel}
      className={`h-full w-full bg-transparent px-[8px] text-center text-[12px] leading-[1.3] text-black outline-none ${
        isInvalid ? "rounded-[3px] ring-2 ring-inset ring-[#ff383c]" : ""
      }`}
      inputMode="numeric"
      onChange={(event) => onChange(event.target.value)}
      value={value}
    />
  );
}

function ConfusionMatrix({
  invalidFields,
  matrixInput,
  modelId,
  onChange,
}: {
  invalidFields: Set<string>;
  matrixInput: Record<MatrixField, string>;
  modelId: ModelId;
  onChange: (field: MatrixField, value: string) => void;
}) {
  const rows: { label: string; correctField: MatrixField; wrongField: MatrixField }[] = [
    { label: "Carnivore", correctField: "carnivoreCorrect", wrongField: "carnivoreWrong" },
    { label: "Herbivore", correctField: "herbivoreCorrect", wrongField: "herbivoreWrong" },
  ];

  return (
    <table className="w-[245px] table-fixed overflow-hidden rounded-[4px] border border-[#b9b9b9] bg-white text-[12px] text-black">
      <thead>
        <tr className="h-[36px] bg-[#f0f0f0]">
          <th className="w-[90px] border border-[#b9b9b9] px-[8px] text-left font-semibold leading-[1.3]">
            {modelTitle(modelId).toUpperCase()}
          </th>
          <th className="w-[66px] border border-[#b9b9b9] px-[5px] text-center font-semibold leading-[1.3]">
            Correct
          </th>
          <th className="w-[66px] border border-[#b9b9b9] px-[5px] text-center font-semibold leading-[1.3]">
            Faux
          </th>
        </tr>
      </thead>
      <tbody>
        {rows.map((row) => (
          <tr key={row.label} className="h-[36px]">
            <th
              className="border border-[#b9b9b9] bg-[#f0f0f0] px-[8px] text-left font-semibold leading-[1.3]"
            >
              {row.label}
            </th>
            <td className="border border-[#b9b9b9]">
              <MatrixInput
                ariaLabel={`${modelTitle(modelId)} ${row.label} correct`}
                isInvalid={invalidFields.has(matrixKey(modelId, row.correctField))}
                onChange={(value) => onChange(row.correctField, value)}
                value={matrixInput[row.correctField]}
              />
            </td>
            <td className="border border-[#b9b9b9]">
              <MatrixInput
                ariaLabel={`${modelTitle(modelId)} ${row.label} faux`}
                isInvalid={invalidFields.has(matrixKey(modelId, row.wrongField))}
                onChange={(value) => onChange(row.wrongField, value)}
                value={matrixInput[row.wrongField]}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function ReflectionPrompt({ prompt }: { prompt: string }) {
  return (
    <label className="flex min-h-[225px] min-w-[116px] flex-col gap-[4px]">
      <span className="pr-[8px] text-[14px] font-medium leading-[1.43] text-[#18181b]">
        {prompt}
      </span>
      <TextArea
        className="h-full w-full flex-1 [&>div]:h-full [&>div]:w-full [&_textarea]:min-h-[174px] [&_textarea]:resize-none [&_textarea]:text-[14px]"
        placeholder="Ta réponse ici..."
      />
    </label>
  );
}

function TestTableOverlay({
  condition,
  modelId,
  modelInput,
  onClose,
}: {
  condition: ModellingCondition;
  modelId: ModelId;
  modelInput: ModelInput;
  onClose: () => void;
}) {
  const [headers, setHeaders] = useState<string[]>([]);
  const [rows, setRows] = useState<TestTableRow[]>([]);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    async function loadTestTable() {
      try {
        const nextRows = await fetchPredictionRows(modelInput);
        const nextHeaders = modelTableColumns(condition, modelInput.features);

        if (isActive) {
          setHeaders(nextHeaders);
          setRows(nextRows);
          setErrorMessage(null);
        }
      } catch (error) {
        if (isActive) {
          setErrorMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
        }
      }
    }

    loadTestTable();

    return () => {
      isActive = false;
    };
  }, [condition, modelInput]);

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
        aria-labelledby="test-table-title"
        className="flex max-h-full w-full max-w-[1280px] flex-col gap-[18px] overflow-hidden rounded-[24px] border border-[#dedee0] bg-[#f5f5f5] p-[32px] text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_14px_28px_rgba(0,0,0,0.08)]"
      >
        <div className="flex items-start justify-between gap-[18px]">
          <div>
            <h2 id="test-table-title" className="text-[28px] font-bold leading-[1.16]">
              Données de test - {modelTitle(modelId)}
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

export default function EvaluationPage() {
  const experimentCondition = useExperimentCondition();
  const resolvedCondition = conditionForStep(experimentCondition, "evaluation");
  const condition: ModellingCondition = resolvedCondition ?? "WB";
  const selectedFeatures = useMemo(() => readSelectedFeatures(), []);
  const [modelBFeatures, setModelBFeatures] = useState<string[] | null>(null);
  const [tableOverlay, setTableOverlay] = useState<TableOverlayState>(null);
  const [accuracyInputs, setAccuracyInputs] = useState<AccuracyInputs>(() => emptyAccuracyInputs());
  const [matrixInputs, setMatrixInputs] = useState<MatrixInputs>(() => emptyMatrixInputs());
  const [invalidFields, setInvalidFields] = useState<Set<string>>(new Set());
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [isCheckingAnswers, setIsCheckingAnswers] = useState(false);

  const modelInputs = useMemo(
    () =>
      Object.fromEntries(
        MODEL_IDS.map((modelId) => [
          modelId,
          resolveModelInput({
            modelId,
            condition,
            selectedFeatures,
            modelBFeatures,
          }),
        ]),
      ) as Record<ModelId, ModelInput>,
    [condition, modelBFeatures, selectedFeatures],
  );

  useEffect(() => {
    let isActive = true;

    async function loadModelBFeatures() {
      if (condition !== "WB" || selectedFeatures.length !== 4) {
        setModelBFeatures(null);
        return;
      }

      try {
        const response = await fetch("/api/modelling/gini", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            features: selectedFeatures,
            labels: readDinoLabels(),
            dataFile: "df_train.csv",
          }),
        });

        if (!response.ok) {
          throw new Error("Impossible de calculer les caractéristiques du modèle B.");
        }

        const payload = (await response.json()) as { results?: { feature: string; gini: number }[] };
        const nextModelBFeatures = bestAndWorstGiniFeatures(payload.results ?? []);

        if (isActive) {
          setModelBFeatures(nextModelBFeatures.length ? nextModelBFeatures : null);
        }
      } catch {
        if (isActive) {
          setModelBFeatures(null);
        }
      }
    }

    loadModelBFeatures();

    return () => {
      isActive = false;
    };
  }, [condition, selectedFeatures]);

  const updateAccuracyInput = (modelId: ModelId, field: AccuracyField, value: string) => {
    setAccuracyInputs((currentInputs) => ({
      ...currentInputs,
      [modelId]: {
        ...currentInputs[modelId],
        [field]: value,
      },
    }));
  };
  const updateMatrixInput = (modelId: ModelId, field: MatrixField, value: string) => {
    setMatrixInputs((currentInputs) => ({
      ...currentInputs,
      [modelId]: {
        ...currentInputs[modelId],
        [field]: value,
      },
    }));
  };
  const verifyAnswers = async () => {
    setIsCheckingAnswers(true);
    setVerificationMessage(null);

    try {
      const expectedByModel = Object.fromEntries(
        await Promise.all(
          MODEL_IDS.map(async (modelId) => [
            modelId,
            computeExpectedAnswers(await fetchPredictionRows(modelInputs[modelId])),
          ]),
        ),
      ) as Record<ModelId, ExpectedModelAnswers>;
      const nextInvalidFields = new Set<string>();

      MODEL_IDS.forEach((modelId) => {
        const expected = expectedByModel[modelId];
        const accuracyInput = accuracyInputs[modelId];
        const matrixInput = matrixInputs[modelId];

        (["correct", "total"] as const).forEach((field) => {
          if (!isCountCorrect(accuracyInput[field], expected.accuracy[field])) {
            nextInvalidFields.add(answerKey("accuracy", modelId, field));
          }
        });

        if (!isAccuracyCorrect(accuracyInput.accuracy, expected.accuracy.accuracy)) {
          nextInvalidFields.add(answerKey("accuracy", modelId, "accuracy"));
        }

        (Object.keys(expected.matrix) as MatrixField[]).forEach((field) => {
          if (!isCountCorrect(matrixInput[field], expected.matrix[field])) {
            nextInvalidFields.add(matrixKey(modelId, field));
          }
        });
      });

      setInvalidFields(nextInvalidFields);
      setVerificationMessage(
        nextInvalidFields.size === 0
          ? "Tout est correct."
          : "Certaines réponses semblent incorrectes. Les cases concernées sont indiquées en rouge.",
      );
    } catch (error) {
      setVerificationMessage(error instanceof Error ? error.message : "Une erreur est survenue.");
    } finally {
      setIsCheckingAnswers(false);
    }
  };

  if (!resolvedCondition) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-zinc-50 text-zinc-900">
        <p className="rounded-3xl bg-white p-8 text-lg shadow-lg">
          Choisis d&apos;abord une condition sur la page d&apos;accueil.
        </p>
      </div>
    );
  }

  return (
    <div className="relative flex min-h-dvh w-full items-center justify-center overflow-auto bg-cover bg-center bg-no-repeat p-[40px] text-[#18181b]" style={{ backgroundImage: `url('${BACKGROUND_IMAGE}')` }}>
      <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
      <main className="relative flex min-h-[calc(100dvh-80px)] w-full max-w-[1360px] overflow-auto rounded-[24px] bg-[#eaeaea]/90 p-[50px_30px_40px] shadow-[0_2px_4px_rgba(0,0,0,0.04),0_1px_2px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.06)]">
        <div className="grid min-h-[760px] min-w-[1048px] flex-1 grid-cols-[minmax(199px,1fr)_minmax(290px,1.25fr)_minmax(245px,1fr)] grid-rows-[auto_repeat(3,minmax(112px,1fr))_minmax(225px,1.4fr)] items-stretch justify-center gap-x-[104px] gap-y-[20px]">
          <h1 className="col-span-3 whitespace-nowrap text-[30.72px] font-bold leading-[1.34] text-black">
            Pour chaque modèle, calcule son exactitude et sa matrice de confusion:
          </h1>

          {MODEL_IDS.map((modelId, index) => (
            <div key={modelId} style={{ gridColumn: 1, gridRow: index + 2 }}>
              <EvaluationModelCard
                modelId={modelId}
                onInspectTable={() => setTableOverlay({ modelId, modelInput: modelInputs[modelId] })}
              />
            </div>
          ))}

          {MODEL_IDS.map((modelId, index) => (
            <div key={modelId} className="flex items-center" style={{ gridColumn: 2, gridRow: index + 2 }}>
              <AccuracyFormula
                accuracy={accuracyInputs[modelId].accuracy}
                correct={accuracyInputs[modelId].correct}
                invalidFields={invalidFields}
                modelId={modelId}
                onChange={(field, value) => updateAccuracyInput(modelId, field, value)}
                total={accuracyInputs[modelId].total}
              />
            </div>
          ))}

          {MODEL_IDS.map((modelId, index) => (
            <div key={modelId} className="flex items-start" style={{ gridColumn: 3, gridRow: index + 2 }}>
              <ConfusionMatrix
                invalidFields={invalidFields}
                matrixInput={matrixInputs[modelId]}
                modelId={modelId}
                onChange={(field, value) => updateMatrixInput(modelId, field, value)}
              />
            </div>
          ))}

          {QUESTION_PROMPTS.map((prompt, index) => (
            <div key={prompt} className="min-h-0" style={{ gridColumn: index + 1, gridRow: 5 }}>
              <ReflectionPrompt prompt={prompt} />
            </div>
          ))}

          <div className="col-span-3 flex items-center justify-end gap-[14px]">
            {verificationMessage && (
              <p
                className={`text-[14px] font-medium ${
                  invalidFields.size === 0 ? "text-[#0a7f38]" : "text-[#b42318]"
                }`}
              >
                {verificationMessage}
              </p>
            )}
            <Button
              className="min-h-[40px] rounded-[22px] bg-[#006fee] px-[18px] text-[15px] font-medium text-white disabled:cursor-not-allowed disabled:opacity-45"
              isDisabled={isCheckingAnswers}
              onPress={verifyAnswers}
            >
              Vérifier mes réponses
            </Button>
          </div>
        </div>
      </main>
      {tableOverlay && (
        <TestTableOverlay
          condition={condition}
          modelId={tableOverlay.modelId}
          modelInput={tableOverlay.modelInput}
          onClose={() => setTableOverlay(null)}
        />
      )}
    </div>
  );
}

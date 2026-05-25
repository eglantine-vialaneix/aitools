"use client";

import { type WhiteBoxGiniResult, type WhiteBoxSplitFilter, type WhiteBoxTreeNode } from "./trainingState";
import { loadLabelledTableRows, type LabelledDataFile, type PredictionTableRow, type TrainingTableRow } from "./tableRows";

function isBooleanLikeValue(value: string | number | boolean | undefined) {
  return value === true || value === false || String(value).toLowerCase() === "true" || String(value).toLowerCase() === "false";
}

function normalizeComparableValue(value: string | number | boolean | undefined) {
  return isBooleanLikeValue(value) ? String(value).toLowerCase() : String(value);
}

function valuesAreEqual(firstValue: string | number | boolean | undefined, secondValue: string | number | boolean | undefined) {
  return normalizeComparableValue(firstValue) === normalizeComparableValue(secondValue);
}

export function rowMatchesWhiteBoxSplit(row: TrainingTableRow, split: WhiteBoxGiniResult) {
  const rowValue = row[split.feature];

  if (split.operator === "gte") {
    return Number(rowValue) >= Number(split.value);
  }

  return valuesAreEqual(rowValue, split.value);
}

export function rowMatchesWhiteBoxFilter(row: TrainingTableRow, filter: WhiteBoxSplitFilter) {
  const rowValue = row[filter.feature];
  const matchesCondition =
    filter.operator === "gte"
      ? Number(rowValue) >= Number(filter.value)
      : valuesAreEqual(rowValue, filter.value);

  return filter.branch === "yes" ? matchesCondition : !matchesCondition;
}

export function predictRowWithWhiteBoxTree(row: TrainingTableRow, nodes: WhiteBoxTreeNode[]) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  let currentNode = nodesById.get("root") ?? nodes[0];

  while (currentNode?.selectedSplit && currentNode.leftId && currentNode.rightId) {
    const nextNodeId = rowMatchesWhiteBoxSplit(row, currentNode.selectedSplit)
      ? currentNode.rightId
      : currentNode.leftId;
    const nextNode = nodesById.get(nextNodeId);

    if (!nextNode) {
      break;
    }

    currentNode = nextNode;
  }

  return currentNode?.counts?.majority ?? "herbivore";
}

export async function buildWhiteBoxPredictionRows(nodes: WhiteBoxTreeNode[], dataFile: LabelledDataFile) {
  const table = await loadLabelledTableRows(dataFile);

  return table.rows.map<PredictionTableRow>((row) => ({
    ...row,
    régime_alimentaire_prédit: predictRowWithWhiteBoxTree(row, nodes),
  }));
}


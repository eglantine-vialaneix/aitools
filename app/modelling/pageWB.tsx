"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@heroui/react";
import { GoGear } from "react-icons/go";
import { Separator } from "@/app/components";
import { readDinoLabels } from "@/app/lib/dinoLabels";
import { readSelectedFeatures } from "@/app/lib/featureSelectionState";
import { type ModelId, type ModellingCondition } from "./modelConfig";
import {
  bestAndWorstGiniFeatures,
  resolveModelInput,
  type ModelInput,
} from "./modelInputs";
import { TrainingTableOverlay } from "./TrainingTableOverlay";
import { markModelAsTrained, type ModelTrainingResult } from "./trainingState";

type ModellingWhiteBoxProps = {
  model?: ModelId;
  condition?: ModellingCondition;
  showIntro?: boolean;
};

type SplitFilter = {
  feature: string;
  operator: "eq" | "gte";
  value: string | number | boolean;
  branch: "yes" | "no";
};

type NodeCounts = {
  total: number;
  carnivores: number;
  herbivores: number;
  majority: "carnivore" | "herbivore";
  isPure: boolean;
};

type GiniResult = {
  feature: string;
  gini: number;
  criterion: string;
  operator: "eq" | "gte";
  value: string | number | boolean;
  yes: NodeCounts;
  no: NodeCounts;
  isSplittable?: boolean;
};

type TreeNodeData = {
  id: string;
  depth: number;
  branchLabel?: "NON" | "OUI";
  pathLabels: string[];
  filters: SplitFilter[];
  availableFeatures: string[];
  counts?: NodeCounts;
  selectedSplit?: GiniResult;
  leftId?: string;
  rightId?: string;
  isLeaf?: boolean;
};

type GiniState = {
  isLoading: boolean;
  errorMessage: string | null;
  results: GiniResult[];
};

type TreeNodeProps = {
  node: TreeNodeData;
  nodeIndex: number;
  giniState?: GiniState;
  onOpen: (nodeId: string) => void;
  onSelectFeature: (nodeId: string, split: GiniResult) => void;
  onConfirm: (nodeId: string) => void;
  onDefineLeaf: (nodeId: string) => void;
};

const SURFACE_SHADOW =
  "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)]";

function formatGini(value: number | undefined) {
  return value === undefined ? "…" : value.toFixed(2);
}

function formatCondition(split: GiniResult) {
  if (split.operator === "eq") {
    return `${split.feature} = ${split.value}`;
  }

  if (split.operator === "gte") {
    return `${split.feature} ≥ ${split.value}`;
  }

  return `${split.feature} ${split.criterion.replaceAll(">=", "≥").replaceAll("<=", "≤")}`;
}

function formatBranchCondition(split: GiniResult, branch: "oui" | "non") {
  if (branch === "oui") {
    return formatCondition(split);
  }

  if (split.operator === "eq") {
    return `${split.feature} ≠ ${split.value}`;
  }

  if (split.operator === "gte") {
    return `${split.feature} < ${split.value}`;
  }

  return formatCondition(split);
}

function TrainingDataCard({
  features,
  carnivores,
  herbivores,
  onInspectTable,
}: {
  features: string[];
  carnivores: number;
  herbivores: number;
  onInspectTable: () => void;
}) {
  return (
    <section className="relative z-10 flex w-full max-w-[545px] flex-col gap-[10px] rounded-[24px] bg-white px-[24px] py-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)] backdrop-blur-[20px]">
      <div className="flex items-center justify-between gap-[18px]">
        <p className="text-[16px] font-semibold leading-[1.5] text-black">
          Données d’entraînement:
        </p>
        <Button
          className="min-h-[32px] rounded-full border border-[#dedee0] bg-white px-[10px] text-[14px] font-medium text-[#18181b]"
          onPress={onInspectTable}
        >
          Inspecter le tableau
        </Button>
      </div>

      <div className="flex items-center gap-[10px]">
        <p className="text-[16px] leading-[1.5] text-black">Caractéristiques:</p>
        <div className="flex flex-wrap items-center gap-[10px]">
          {features.map((feature) => (
            <span
              key={feature}
              className="inline-flex min-h-[32px] items-center justify-center rounded-full bg-[#ebebec] px-[10px] text-[14px] font-medium leading-[1.43] text-[#18181b]"
            >
              {feature}
            </span>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-[68px]">
        <p className="text-[16px] leading-[1.5] text-black">Données:</p>
        <div className="flex flex-1 items-center justify-center gap-[8px]">
          <span className="flex min-h-[32px] flex-1 items-center justify-center rounded-full bg-[#ff383c] px-[10px] text-[14px] font-medium text-white">
            Carnivores: {carnivores}
          </span>
          <span className="flex min-h-[32px] flex-1 items-center justify-center rounded-full bg-[#17c964] px-[10px] text-[14px] font-medium text-white">
            Herbivores: {herbivores}
          </span>
        </div>
      </div>
    </section>
  );
}

function LeafNode({ node }: { node: TreeNodeData }) {
  const prediction = node.counts?.majority ?? "herbivore";
  const carnivores = node.counts?.carnivores ?? 0;
  const herbivores = node.counts?.herbivores ?? 0;

  return (
    <article className={`relative flex min-h-[220px] w-[196px] flex-col gap-[14px] rounded-[24px] bg-white p-[24px] ${SURFACE_SHADOW} backdrop-blur-[20px]`}>
      <p className="text-[16px] font-medium leading-[1.5] text-[#18181b]">{prediction === "carnivore" ? "Carnivore" : "Herbivore"}</p>
      <ul className="list-disc pl-[20px] text-[14px] leading-[1.43] text-[#71717a]">
        {node.pathLabels.slice(-2).map((label) => (
          <li key={label}>{label}</li>
        ))}
      </ul>
      <div className="flex flex-col gap-[8px]">
        <span className="flex min-h-[32px] items-center justify-center rounded-full bg-[#ff383c] px-[10px] text-[14px] font-medium text-white">
          Carnivores: {carnivores}
        </span>
        <span className="flex min-h-[32px] items-center justify-center rounded-full bg-[#17c964] px-[10px] text-[14px] font-medium text-white">
          Herbivores: {herbivores}
        </span>
      </div>
      <span
        className={`mt-auto flex min-h-[36px] items-center justify-center rounded-full px-[14px] text-[14px] font-medium text-white ${
          prediction === "carnivore" ? "bg-[#ff383c]" : "bg-[#17c964]"
        }`}
      >
        {prediction === "carnivore" ? "Carnivore" : "Herbivore"}
      </span>
    </article>
  );
}

function TreeNode({
  node,
  nodeIndex,
  giniState,
  onOpen,
  onSelectFeature,
  onConfirm,
  onDefineLeaf,
}: TreeNodeProps) {
  const isChooserOpen = Boolean(giniState);
  const isSplitConfirmed = Boolean(node.leftId && node.rightId);
  const selectedFeature = node.selectedSplit?.feature ?? null;
  const splitByFeature = useMemo(
    () => new Map((giniState?.results ?? []).map((result) => [result.feature, result])),
    [giniState?.results],
  );

  if (node.isLeaf) {
    return <LeafNode node={node} />;
  }

  return (
    <article className={`relative flex w-[393px] flex-col gap-[20px] rounded-[24px] bg-white p-[24px] ${SURFACE_SHADOW} backdrop-blur-[20px]`}>
      <div className="flex flex-col gap-[8px]">
        <p className="text-[16px] font-medium leading-[1.5] text-[#18181b]">
          {isSplitConfirmed && node.selectedSplit
            ? `${formatCondition(node.selectedSplit)} ?`
            : `Caractéristique ${nodeIndex}:`}
        </p>
        <p className="text-[14px] leading-[1.43] text-[#71717a]">
          {isSplitConfirmed && node.selectedSplit
            ? `Le dinosaure respecte-t-il : ${formatCondition(node.selectedSplit)} ?`
            : "Choisis la caractéristique selon laquelle séparer les données :"}
        </p>
      </div>

      {isSplitConfirmed ? (
        <div className="grid grid-cols-2 gap-[8px]">
          <span className="flex min-h-[36px] items-center justify-center rounded-full bg-[#ebebec] px-[14px] text-[14px] font-medium text-[#18181b]">
            NON
          </span>
          <span className="flex min-h-[36px] items-center justify-center rounded-full bg-[#ebebec] px-[14px] text-[14px] font-medium text-[#18181b]">
            OUI
          </span>
        </div>
      ) : (
        <div className="flex flex-col gap-[8px]">
          {!isChooserOpen && (
            <>
              <Button
                className="flex min-h-[36px] w-full items-center justify-center gap-[8px] rounded-full bg-[#0485f7] px-[14px] text-[14px] font-medium text-white disabled:opacity-60"
                isDisabled={node.availableFeatures.length === 0}
                onPress={() => onOpen(node.id)}
              >
                <GoGear aria-hidden="true" className="size-[16px] shrink-0" />
                <span>Calculer l&apos;impureté de Gini</span>
                <GoGear aria-hidden="true" className="size-[16px] shrink-0" />
              </Button>
              {node.depth > 0 && (
                <Button
                  className="min-h-[36px] w-full rounded-full bg-[#ebebec] px-[14px] text-[14px] font-medium text-[#0485f7]"
                  onPress={() => onDefineLeaf(node.id)}
                >
                  Définir comme Feuille
                </Button>
              )}
            </>
          )}

          {isChooserOpen && (
            <>
              <div className="relative flex w-full flex-col gap-[2px] rounded-[24px] bg-white p-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.06),0_-6px_6px_rgba(0,0,0,0.03),0_14px_14px_rgba(0,0,0,0.08)]">
                {node.availableFeatures.map((feature) => {
                  const split = splitByFeature.get(feature);
                  const isSelected = selectedFeature === feature;
                  const canSplit = Boolean(split?.isSplittable ?? split);

                  return (
                    <button
                      key={feature}
                      type="button"
                      className={`flex min-h-[36px] w-full items-center gap-[12px] rounded-[20px] px-[12px] py-[6px] text-left transition ${
                        isSelected ? "bg-[#ebebec]" : "hover:bg-[#f5f5f5]"
                      }`}
                      disabled={!canSplit}
                      onClick={() => canSplit && split && onSelectFeature(node.id, split)}
                    >
                      <span
                        className={`size-[16px] shrink-0 rounded-[4px] border ${
                          isSelected ? "border-[#0485f7] bg-[#0485f7]" : "border-[#71717a]"
                        }`}
                      />
                      <span className="min-w-0 flex-1 text-[14px] font-medium leading-[1.43] text-[#18181b]">
                        {feature}: impureté de Gini = {formatGini(split?.gini)}
                      </span>
                    </button>
                  );
                })}
              </div>

              {giniState?.isLoading && (
                <p className="text-[13px] leading-[1.35] text-[#71717a]">Calcul en cours…</p>
              )}
              {giniState?.errorMessage && (
                <p className="text-[13px] leading-[1.35] text-[#b42318]">{giniState.errorMessage}</p>
              )}

              <Button
                className="min-h-[36px] w-full rounded-full bg-[#ebebec] px-[14px] text-[14px] font-medium text-[#18181b] disabled:cursor-not-allowed disabled:opacity-50"
                isDisabled={!node.selectedSplit}
                onPress={() => onConfirm(node.id)}
              >
                Confirmer mon choix
              </Button>
            </>
          )}
        </div>
      )}
    </article>
  );
}

function TreeCanvas({
  nodes,
  openNodeId,
  giniByNode,
  onOpen,
  onSelectFeature,
  onConfirm,
  onDefineLeaf,
}: {
  nodes: TreeNodeData[];
  openNodeId: string | null;
  giniByNode: Record<string, GiniState>;
  onOpen: (nodeId: string) => void;
  onSelectFeature: (nodeId: string, split: GiniResult) => void;
  onConfirm: (nodeId: string) => void;
  onDefineLeaf: (nodeId: string) => void;
}) {
  const nodesById = useMemo(() => {
    return new Map(nodes.map((node) => [node.id, node]));
  }, [nodes]);
  const rootNode = nodesById.get("root") ?? nodes[0];

  function TreeBranch({ node }: { node: TreeNodeData }) {
    const leftNode = node.leftId ? nodesById.get(node.leftId) : undefined;
    const rightNode = node.rightId ? nodesById.get(node.rightId) : undefined;
    const hasChildren = Boolean(leftNode && rightNode);

    return (
      <div className="relative flex flex-col items-center">
        <TreeNode
          node={node}
          nodeIndex={node.depth + 1}
          giniState={openNodeId === node.id ? giniByNode[node.id] : undefined}
          onOpen={onOpen}
          onSelectFeature={onSelectFeature}
          onConfirm={onConfirm}
          onDefineLeaf={onDefineLeaf}
        />

        {hasChildren && leftNode && rightNode && (
          <>
            <div className="relative h-[70px] w-full min-w-[620px]" aria-hidden="true">
              <Separator
                orientation="vertical"
                className="absolute left-[calc(50%-1.5px)] top-0 h-[32px] w-[3px]"
              />
              <Separator
                label=""
                className="absolute left-[25%] top-[30px] w-1/2"
              />
              <Separator
                orientation="vertical"
                className="absolute left-[calc(25%-1.5px)] top-[30px] h-[40px] w-[3px]"
              />
              <Separator
                orientation="vertical"
                className="absolute left-[calc(75%-1.5px)] top-[30px] h-[40px] w-[3px]"
              />
            </div>
            <div className="flex items-start justify-center gap-[120px]">
              <TreeBranch node={leftNode} />
              <TreeBranch node={rightNode} />
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <section className="relative z-10 flex w-max min-w-full flex-col items-center">
      {rootNode && <TreeBranch node={rootNode} />}
    </section>
  );
}

function createRootNode(features: string[]): TreeNodeData {
  return {
    id: "root",
    depth: 0,
    pathLabels: [],
    filters: [],
    availableFeatures: features,
  };
}

function shouldCreateLeaf(counts: NodeCounts, availableFeatures: string[]) {
  return counts.isPure || availableFeatures.length === 0 || counts.total <= 1;
}

function countTreePredictions(nodes: TreeNodeData[]): ModelTrainingResult {
  return nodes.reduce<ModelTrainingResult>(
    (totals, node) => {
      if (node.leftId || node.rightId || !node.isLeaf || !node.counts) {
        return totals;
      }

      if (node.counts.majority === "carnivore") {
        return {
          ...totals,
          pred_carnivores: totals.pred_carnivores + node.counts.total,
        };
      }

      return {
        ...totals,
        pred_herbivores: totals.pred_herbivores + node.counts.total,
      };
    },
    { pred_carnivores: 0, pred_herbivores: 0 },
  );
}

function childNode({
  id,
  parent,
  split,
  branch,
  counts,
  availableFeatures,
}: {
  id: string;
  parent: TreeNodeData;
  split: GiniResult;
  branch: "oui" | "non";
  counts: NodeCounts;
  availableFeatures: string[];
}): TreeNodeData {
  const branchLabel = branch === "oui" ? "OUI" : "NON";

  return {
    id,
    depth: parent.depth + 1,
    branchLabel,
    pathLabels: [...parent.pathLabels, `${formatBranchCondition(split, branch)}`],
    filters: [
      ...parent.filters,
      {
        feature: split.feature,
        operator: split.operator,
        value: split.value,
        branch: branch === "oui" ? "yes" : "no",
      },
    ],
    availableFeatures,
    counts,
    isLeaf: shouldCreateLeaf(counts, availableFeatures),
  };
}

async function fetchGiniForNode(node: TreeNodeData, dataFile: ModelInput["data"]) {
  const response = await fetch("/api/modelling/gini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      features: node.availableFeatures,
      filters: node.filters,
      labels: readDinoLabels(),
      dataFile,
    }),
  });

  if (!response.ok) {
    throw new Error("Impossible de calculer l’impureté de Gini.");
  }

  const payload = (await response.json()) as { results?: GiniResult[] };

  return [...(payload.results ?? [])].sort((first, second) => first.gini - second.gini);
}

export default function ModellingWhiteBox({
  model = "A",
  condition = "WB",
  showIntro = false,
}: ModellingWhiteBoxProps) {
  const router = useRouter();
  const selectedFeatures = useMemo(() => readSelectedFeatures(), []);
  const [modelBFeatures, setModelBFeatures] = useState<string[] | null>(null);
  const modelInput = useMemo(
    () =>
      resolveModelInput({
        modelId: model,
        condition,
        selectedFeatures,
        modelBFeatures,
      }),
    [condition, model, modelBFeatures, selectedFeatures],
  );
  const [isIntroOpen, setIsIntroOpen] = useState(showIntro);
  const [nodes, setNodes] = useState<TreeNodeData[]>(() => [createRootNode(modelInput.features)]);
  const [openNodeId, setOpenNodeId] = useState<string | null>(null);
  const [giniByNode, setGiniByNode] = useState<Record<string, GiniState>>({});
  const [isTableOpen, setIsTableOpen] = useState(false);
  const isTreeComplete = useMemo(() => {
    const terminalNodes = nodes.filter((node) => !node.leftId && !node.rightId);

    return terminalNodes.length > 0 && terminalNodes.every((node) => node.isLeaf);
  }, [nodes]);

  useEffect(() => {
    let isActive = true;

    async function loadModelBFeatures() {
      if (condition !== "WB" || model !== "B" || selectedFeatures.length !== 4) {
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
  }, [condition, model, selectedFeatures]);

  useEffect(() => {
    setNodes([createRootNode(modelInput.features)]);
    setOpenNodeId(null);
    setGiniByNode({});
  }, [modelInput.features]);

  const updateNode = (nodeId: string, updater: (node: TreeNodeData) => TreeNodeData) => {
    setNodes((currentNodes) =>
      currentNodes.map((currentNode) => (currentNode.id === nodeId ? updater(currentNode) : currentNode)),
    );
  };

  const openNode = async (nodeId: string) => {
    setOpenNodeId(nodeId);

    if (giniByNode[nodeId]?.results.length) {
      return;
    }

    const node = nodes.find((candidate) => candidate.id === nodeId);

    if (!node) {
      return;
    }

    setGiniByNode((current) => ({
      ...current,
      [nodeId]: { isLoading: true, errorMessage: null, results: [] },
    }));

    try {
      const results = await fetchGiniForNode(node, modelInput.data);
      setGiniByNode((current) => ({
        ...current,
        [nodeId]: { isLoading: false, errorMessage: null, results },
      }));
    } catch (error) {
      setGiniByNode((current) => ({
        ...current,
        [nodeId]: {
          isLoading: false,
          errorMessage: error instanceof Error ? error.message : "Une erreur est survenue.",
          results: [],
        },
      }));
    }
  };

  const selectFeature = (nodeId: string, split: GiniResult) => {
    updateNode(nodeId, (node) => ({ ...node, selectedSplit: split }));
  };

  const confirmNode = (nodeId: string) => {
    const node = nodes.find((candidate) => candidate.id === nodeId);

    if (!node?.selectedSplit) {
      return;
    }

    const split = node.selectedSplit;
    const nextFeatures = node.availableFeatures.filter((feature) => feature !== split.feature);
    const noNode = childNode({
      id: `${node.id}-no`,
      parent: node,
      split,
      branch: "non",
      counts: split.no,
      availableFeatures: nextFeatures,
    });
    const yesNode = childNode({
      id: `${node.id}-yes`,
      parent: node,
      split,
      branch: "oui",
      counts: split.yes,
      availableFeatures: nextFeatures,
    });

    setNodes((currentNodes) => {
      const withoutPreviousChildren = currentNodes.filter(
        (currentNode) => currentNode.id !== noNode.id && currentNode.id !== yesNode.id,
      );

      return [
        ...withoutPreviousChildren.map((currentNode) =>
          currentNode.id === nodeId
            ? { ...currentNode, leftId: noNode.id, rightId: yesNode.id }
            : currentNode,
        ),
        noNode,
        yesNode,
      ];
    });
    setOpenNodeId(null);
  };

  const defineLeaf = (nodeId: string) => {
    updateNode(nodeId, (node) => ({
      ...node,
      isLeaf: true,
      counts: node.counts ?? {
        total: modelInput.init_carnivores + modelInput.init_herbivores,
        carnivores: modelInput.init_carnivores,
        herbivores: modelInput.init_herbivores,
        majority:
          modelInput.init_carnivores >= modelInput.init_herbivores ? "carnivore" : "herbivore",
        isPure: false,
      },
    }));
    setOpenNodeId(null);
  };

  const finishTraining = () => {
    if (!isTreeComplete) {
      return;
    }

    markModelAsTrained(model, countTreePredictions(nodes), condition);
    router.push(`/modelling?condition=${condition}`);
  };

  return (
    <div
      className="relative min-h-dvh w-full overflow-auto bg-cover bg-center bg-no-repeat px-[24px] py-[50px] text-[#18181b]"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div aria-hidden="true" className="fixed inset-0 bg-black/35" />
      <main className="relative mx-auto flex min-h-[calc(100dvh-100px)] w-max min-w-full flex-col items-center">
        <TrainingDataCard
          features={modelInput.features}
          carnivores={modelInput.init_carnivores}
          herbivores={modelInput.init_herbivores}
          onInspectTable={() => setIsTableOpen(true)}
        />
        <Separator orientation="vertical" className="h-[12px] w-[5px]" />
        <TreeCanvas
          nodes={nodes}
          openNodeId={openNodeId}
          giniByNode={giniByNode}
          onOpen={openNode}
          onSelectFeature={selectFeature}
          onConfirm={confirmNode}
          onDefineLeaf={defineLeaf}
        />

        <div className="fixed bottom-[20px] right-[20px] flex items-center gap-[10px]">
          <Link
            href={`/modelling?condition=${condition}`}
            className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-white/50 bg-white/85 px-[16px] text-[14px] font-medium text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-[20px] transition hover:bg-white"
          >
            Retour aux modèles
          </Link>
          {isTreeComplete && (
            <Button
              className="min-h-[40px] rounded-full bg-[#0485f7] px-[16px] text-[14px] font-medium text-white shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              onPress={finishTraining}
            >
              Terminer l&apos;entraînement
            </Button>
          )}
        </div>
      </main>

      {isIntroOpen && (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/45 px-[24px] backdrop-blur-[2px]">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="gini-intro-title"
            className="flex w-full max-w-[560px] flex-col gap-[18px] rounded-[24px] bg-white p-[28px] text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)]"
          >
            <div>
              <p className="text-[14px] font-medium text-[#52525b]">Avant de commencer</p>
              <h2 id="gini-intro-title" className="mt-[6px] text-[28px] font-extrabold leading-[1.12]">
                Impureté de Gini
              </h2>
            </div>
            <div className="flex flex-col gap-[12px] text-[16px] leading-[1.5] text-[#3f3f46]">
              <p>
                Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec tempor
                neque vitae mi luctus, sed dignissim dui faucibus.
              </p>
              <p>
                Integer at sapien non lectus volutpat gravida. Fusce euismod, erat
                vel commodo luctus, montre ici un exemple jouet pour comparer deux séparations.
              </p>
            </div>
            <div className="flex justify-end">
              <Button
                className="min-h-[40px] rounded-full bg-[#0485f7] px-[18px] text-[15px] font-medium text-white"
                onPress={() => setIsIntroOpen(false)}
              >
                C&apos;est parti !
              </Button>
            </div>
          </section>
        </div>
      )}
      {isTableOpen && (
        <TrainingTableOverlay
          dataFile={modelInput.data}
          onClose={() => setIsTableOpen(false)}
        />
      )}
    </div>
  );
}

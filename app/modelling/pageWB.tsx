"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Tooltip } from "@heroui/react";
import { GoGear } from "react-icons/go";
import {
  ActivityInstructionsButton,
  ActivityInstructionsOverlay,
  GiniInstructionsContent,
  Separator,
} from "@/app/components";
import { readDinoLabels } from "@/app/lib/dinoLabels";
import { saveTrainedTree, type TrainedTreeNode } from "@/app/lib/experimentCollection";
import { useSelectedFeatures } from "@/app/lib/featureSelectionState";
import { type ModellingCondition } from "./modelConfig";
import {
  useResolvedModelInput,
  type ModelInput,
} from "./modelInputs";
import { TrainingTableOverlay } from "./TrainingTableOverlay";
import { markModelAsTrained, type ModelTrainingResult } from "./trainingState";
import { computeTrainingAccuracy, loadLabelledTrainingRows, type PredictionTableRow, type TrainingTableRow } from "./tableRows";

type ModellingWhiteBoxProps = {
  condition?: ModellingCondition;
  showIntro?: boolean;
  onShowInstructions?: () => void;
  initialNodes?: TreeNodeData[];
  isReadOnly?: boolean;
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
  reason?: string;
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

type ModellingTutorialStep =
  | "input-data"
  | "inspect-table"
  | "root-node"
  | "waiting-for-gini"
  | "gini-results"
  | "waiting-for-children"
  | "repeat"
  | null;

type ConnectorLine = {
  id: string;
  path: string;
};

type TreeNodeProps = {
  node: TreeNodeData;
  nodeIndex: number;
  giniState?: GiniState;
  onOpen: (nodeId: string) => void;
  onSelectFeature: (nodeId: string, split: GiniResult) => void;
  onConfirm: (nodeId: string) => void;
  onDefineLeaf: (nodeId: string) => void;
  tutorialStep?: ModellingTutorialStep;
  onTutorialDismiss?: () => void;
};

const SURFACE_SHADOW =
  "shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)]";
const giniRequestCache = new Map<string, GiniResult[]>();
const inFlightGiniRequests = new Map<string, Promise<GiniResult[]>>();

function TutorialBackdrop({ onDismiss }: { onDismiss: () => void }) {
  return (
    <button
      type="button"
      aria-label="Passer à l'étape suivante du tutoriel"
      className="fixed inset-0 z-[70] cursor-default bg-black/30"
      onClick={onDismiss}
    />
  );
}

function ModellingTutorialTarget({
  children,
  label,
  onDismiss,
  placement = "top",
  className = "",
}: {
  children: ReactNode;
  label: string;
  onDismiss: () => void;
  placement?: "top" | "right" | "bottom" | "left";
  className?: string;
}) {
  return (
    <Tooltip.Root isOpen>
      <div className={`relative ${className}`}>
        {children}
        <Tooltip.Trigger
          aria-label="Indication pour le tutoriel d'entraînement"
          className="pointer-events-none absolute inset-0 z-[80]"
        />
      </div>
      <TutorialBackdrop onDismiss={onDismiss} />
      <Tooltip.Content
        className="z-[90] w-[330px] max-w-[330px] break-normal rounded-[14px] border border-[#dedee0] bg-white px-[14px] py-[12px] text-[15px] font-semibold leading-[1.35] text-[#24324a] shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
        placement={placement}
        showArrow
        onClick={onDismiss}
      >
        <Tooltip.Arrow className="text-white [&_[data-slot=overlay-arrow]]:fill-white [&_[data-slot=overlay-arrow]]:stroke-[#dedee0]" />
        <p>{label}</p>
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

function formatGini(value: number | undefined) {
  return value === undefined ? "…" : value.toFixed(2);
}

function isBooleanDisplayValue(value: string | number | boolean) {
  return value === true || value === false || value === "True" || value === "False" || value === "true" || value === "false";
}

function formatBooleanDisplayValue(value: string | number | boolean) {
  return value === true || value === "True" || value === "true" ? "vrai" : "faux";
}

function invertBooleanDisplayValue(value: string | number | boolean) {
  return value === true || value === "True" || value === "true" ? false : true;
}

function formatSplitValue(value: string | number | boolean) {
  return isBooleanDisplayValue(value) ? formatBooleanDisplayValue(value) : String(value);
}

function formatCondition(split: GiniResult) {
  if (split.operator === "eq") {
    return `${split.feature} = ${formatSplitValue(split.value)}`;
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
    if (isBooleanDisplayValue(split.value)) {
      return `${split.feature} = ${formatSplitValue(invertBooleanDisplayValue(split.value))}`;
    }

    return `${split.feature} ≠ ${split.value}`;
  }

  if (split.operator === "gte") {
    return `${split.feature} < ${split.value}`;
  }

  return formatCondition(split);
}

function canSelectSplit(split: GiniResult | undefined, availableFeatureCount: number) {
  if (!split) {
    return false;
  }

  if (split.isSplittable !== false) {
    return true;
  }

  return availableFeatureCount === 1 && split.criterion.length > 0;
}

function TrainingDataCard({
  features,
  carnivores,
  herbivores,
  onInspectTable,
  tutorialStep = null,
  onTutorialDismiss = () => {},
}: {
  features: string[];
  carnivores: number;
  herbivores: number;
  onInspectTable: () => void;
  tutorialStep?: ModellingTutorialStep;
  onTutorialDismiss?: () => void;
}) {
  const inspectButton = (
    <Button
      className="min-h-[32px] rounded-full border border-[#dedee0] bg-white px-[10px] text-[14px] font-medium text-[#18181b]"
      onPress={onInspectTable}
    >
      Inspecter le tableau
    </Button>
  );

  const card = (
    <section className="relative z-10 flex w-full max-w-[545px] flex-col gap-[10px] rounded-[24px] bg-white px-[24px] py-[20px] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)] backdrop-blur-[20px]">
      <div className="flex items-center justify-between gap-[18px]">
        <p className="text-[16px] font-semibold leading-[1.5] text-black">
          Données d’entraînement:
        </p>
        {tutorialStep === "inspect-table" ? (
          <ModellingTutorialTarget
            label="Tu peux revoir ton tableau ici"
            onDismiss={onTutorialDismiss}
            placement="bottom"
          >
            {inspectButton}
          </ModellingTutorialTarget>
        ) : (
          inspectButton
        )}
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

  if (tutorialStep === "input-data") {
    return (
      <ModellingTutorialTarget
        label="1) L'arbre regarde les données initiales"
        onDismiss={onTutorialDismiss}
        placement="bottom"
      >
        {card}
      </ModellingTutorialTarget>
    );
  }

  return card;
}

function LeafNode({ node }: { node: TreeNodeData }) {
  const prediction = node.counts?.majority ?? "herbivore";
  const carnivores = node.counts?.carnivores ?? 0;
  const herbivores = node.counts?.herbivores ?? 0;

  return (
    <article
      data-tree-node-card={node.id}
      className={`relative flex min-h-[220px] w-[196px] flex-col gap-[14px] rounded-[24px] bg-white p-[24px] ${SURFACE_SHADOW} backdrop-blur-[20px]`}
    >
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
  tutorialStep = null,
  onTutorialDismiss = () => {},
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

  const shouldShowRootNodeHint = node.id === "root" && tutorialStep === "root-node";
  const shouldShowGiniResultsHint = node.id === "root" && tutorialStep === "gini-results";

  const nodeCard = (
    <article
      data-tree-node-card={node.id}
      className={`relative flex w-[393px] flex-col gap-[20px] rounded-[24px] bg-white p-[24px] ${SURFACE_SHADOW} backdrop-blur-[20px]`}
    >
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
          <span
            data-tree-branch-button={`${node.id}:no`}
            className="flex min-h-[36px] items-center justify-center rounded-full bg-[#ebebec] px-[14px] text-[14px] font-medium text-[#18181b]"
          >
            NON
          </span>
          <span
            data-tree-branch-button={`${node.id}:yes`}
            className="flex min-h-[36px] items-center justify-center rounded-full bg-[#ebebec] px-[14px] text-[14px] font-medium text-[#18181b]"
          >
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
                  Définir comme feuille: arrêter l&apos;algorithme ici.
                </Button>
              )}
            </>
          )}

          {isChooserOpen && (
            <>
              {shouldShowGiniResultsHint ? (
                <ModellingTutorialTarget
                  label="3) Il choisit ensuite la caractéristique avec l'impureté la plus basse"
                  onDismiss={onTutorialDismiss}
                  placement="right"
                >
                  <div className="relative flex w-full flex-col gap-[2px] rounded-[24px] bg-white p-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.06),0_-6px_6px_rgba(0,0,0,0.03),0_14px_14px_rgba(0,0,0,0.08)]">
                    {node.availableFeatures.map((feature) => {
                      const split = splitByFeature.get(feature);
                      const isSelected = selectedFeature === feature;
                      const canSplit = canSelectSplit(split, node.availableFeatures.length);

                      return (
                        <button
                          key={feature}
                          type="button"
                          className={`flex min-h-[36px] w-full items-center gap-[12px] rounded-[20px] px-[12px] py-[6px] text-left transition ${
                            isSelected ? "bg-[#ebebec]" : "hover:bg-[#f5f5f5]"
                          }`}
                          disabled={!canSplit}
                          title={split?.reason}
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
                </ModellingTutorialTarget>
              ) : (
                <div className="relative flex w-full flex-col gap-[2px] rounded-[24px] bg-white p-[4px] shadow-[0_2px_4px_rgba(0,0,0,0.06),0_-6px_6px_rgba(0,0,0,0.03),0_14px_14px_rgba(0,0,0,0.08)]">
                {node.availableFeatures.map((feature) => {
                  const split = splitByFeature.get(feature);
                  const isSelected = selectedFeature === feature;
                  const canSplit = canSelectSplit(split, node.availableFeatures.length);

                  return (
                    <button
                      key={feature}
                      type="button"
                      className={`flex min-h-[36px] w-full items-center gap-[12px] rounded-[20px] px-[12px] py-[6px] text-left transition ${
                        isSelected ? "bg-[#ebebec]" : "hover:bg-[#f5f5f5]"
                      }`}
                      disabled={!canSplit}
                      title={split?.reason}
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
              )}

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

  if (shouldShowRootNodeHint) {
    return (
      <ModellingTutorialTarget
        label="2) L'algorithme doit choisir quelle question poser pour séparer les dinosaures"
        onDismiss={onTutorialDismiss}
        placement="right"
      >
        {nodeCard}
      </ModellingTutorialTarget>
    );
  }

  return nodeCard;
}

function TreeCanvas({
  nodes,
  openNodeId,
  giniByNode,
  onOpen,
  onSelectFeature,
  onConfirm,
  onDefineLeaf,
  tutorialStep = null,
  onTutorialDismiss = () => {},
}: {
  nodes: TreeNodeData[];
  openNodeId: string | null;
  giniByNode: Record<string, GiniState>;
  onOpen: (nodeId: string) => void;
  onSelectFeature: (nodeId: string, split: GiniResult) => void;
  onConfirm: (nodeId: string) => void;
  onDefineLeaf: (nodeId: string) => void;
  tutorialStep?: ModellingTutorialStep;
  onTutorialDismiss?: () => void;
}) {
  const canvasRef = useRef<HTMLElement | null>(null);
  const [connectorLines, setConnectorLines] = useState<ConnectorLine[]>([]);
  const nodesById = useMemo(() => {
    return new Map(nodes.map((node) => [node.id, node]));
  }, [nodes]);
  const rootNode = nodesById.get("root") ?? nodes[0];

  useLayoutEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      setConnectorLines([]);
      return;
    }

    let animationFrame: number | null = null;

    const measureConnectors = () => {
      const canvasRect = canvas.getBoundingClientRect();
      const nextConnectorLines: ConnectorLine[] = [];

      nodes.forEach((node) => {
        if (!node.leftId || !node.rightId) {
          return;
        }

        const connections = [
          { branch: "no", childId: node.leftId },
          { branch: "yes", childId: node.rightId },
        ] as const;

        connections.forEach(({ branch, childId }) => {
          const branchButton = canvas.querySelector<HTMLElement>(
            `[data-tree-branch-button="${node.id}:${branch}"]`,
          );
          const childCard = canvas.querySelector<HTMLElement>(
            `[data-tree-node-card="${childId}"]`,
          );

          if (!branchButton || !childCard) {
            return;
          }

          const buttonRect = branchButton.getBoundingClientRect();
          const childRect = childCard.getBoundingClientRect();
          const startX = buttonRect.left + buttonRect.width / 2 - canvasRect.left;
          const startY = buttonRect.bottom - canvasRect.top;
          const endX = childRect.left + childRect.width / 2 - canvasRect.left;
          const endY = childRect.top - canvasRect.top;
          const midpointY = startY + (endY - startY) / 2;

          nextConnectorLines.push({
            id: `${node.id}-${branch}-${childId}`,
            path: `M ${startX} ${startY} V ${midpointY} H ${endX} V ${endY}`,
          });
        });
      });

      setConnectorLines(nextConnectorLines);
    };

    const scheduleMeasure = () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }

      animationFrame = requestAnimationFrame(measureConnectors);
    };

    scheduleMeasure();

    const resizeObserver = new ResizeObserver(scheduleMeasure);
    resizeObserver.observe(canvas);
    canvas
      .querySelectorAll<HTMLElement>("[data-tree-node-card], [data-tree-branch-button]")
      .forEach((element) => resizeObserver.observe(element));
    window.addEventListener("resize", scheduleMeasure);

    return () => {
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }

      resizeObserver.disconnect();
      window.removeEventListener("resize", scheduleMeasure);
    };
  }, [giniByNode, nodes, openNodeId]);

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
          tutorialStep={tutorialStep}
          onTutorialDismiss={onTutorialDismiss}
        />

        {hasChildren && leftNode && rightNode && (
          <>
            <div className="h-[70px] w-full min-w-[620px]" aria-hidden="true" />
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
    <section
      ref={canvasRef}
      className="relative z-10 mx-auto flex w-max min-w-full flex-col items-center pb-[120px]"
    >
      <svg
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 h-full w-full overflow-visible"
      >
        {connectorLines.map((connector) => (
          <path
            key={connector.id}
            d={connector.path}
            fill="none"
            stroke="#dedee0"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="3"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
      {tutorialStep === "repeat" ? (
        <ModellingTutorialTarget
          className="relative z-10 flex w-max min-w-full flex-col items-center"
          label="Et il recommence jusqu'à ce que tous les dinosaures soient classés."
          onDismiss={onTutorialDismiss}
          placement="bottom"
        >
          {rootNode && <TreeBranch node={rootNode} />}
        </ModellingTutorialTarget>
      ) : (
        <div className="relative z-10 flex w-max min-w-full flex-col items-center">
          {rootNode && <TreeBranch node={rootNode} />}
        </div>
      )}
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

function rowMatchesSplit(row: TrainingTableRow, split: GiniResult) {
  const rowValue = row[split.feature];

  if (split.operator === "gte") {
    return Number(rowValue) >= Number(split.value);
  }

  return String(rowValue) === String(split.value);
}

function predictRowWithTree(row: TrainingTableRow, nodes: TreeNodeData[]) {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  let currentNode = nodesById.get("root") ?? nodes[0];

  while (currentNode?.selectedSplit && currentNode.leftId && currentNode.rightId) {
    const nextNodeId = rowMatchesSplit(row, currentNode.selectedSplit)
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

function collectionTreeFromNodes(nodes: TreeNodeData[]): TrainedTreeNode | null {
  const nodesById = new Map(nodes.map((node) => [node.id, node]));
  const rootNode = nodesById.get("root") ?? nodes[0];

  if (!rootNode) {
    return null;
  }

  const visitNode = (node: TreeNodeData): TrainedTreeNode => {
    if (!node.selectedSplit || !node.leftId || !node.rightId) {
      return node.counts?.majority ?? "herbivore";
    }

    const yesNode = nodesById.get(node.rightId);
    const noNode = nodesById.get(node.leftId);

    return {
      [formatCondition(node.selectedSplit)]: {
        yes: yesNode ? visitNode(yesNode) : "herbivore",
        no: noNode ? visitNode(noNode) : "herbivore",
      },
    };
  };

  return visitNode(rootNode);
}

async function buildWhiteBoxPredictionRows(nodes: TreeNodeData[], dataFile: ModelInput["data"]) {
  const trainingTable = await loadLabelledTrainingRows(dataFile);

  return trainingTable.rows.map<PredictionTableRow>((row) => ({
    ...row,
    régime_alimentaire_prédit: predictRowWithTree(row, nodes),
  }));
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
  const payload = {
    features: node.availableFeatures,
    filters: node.filters,
    labels: readDinoLabels(),
    dataFile,
  };
  const cacheKey = JSON.stringify(payload);
  const cachedResults = giniRequestCache.get(cacheKey);

  if (cachedResults) {
    return cachedResults;
  }

  const inFlightRequest = inFlightGiniRequests.get(cacheKey);

  if (inFlightRequest) {
    return inFlightRequest;
  }

  const request = fetch("/api/modelling/gini", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  })
    .then(async (response) => {
      if (!response.ok) {
        throw new Error("Impossible de calculer l’impureté de Gini.");
      }

      const responsePayload = (await response.json()) as { results?: GiniResult[] };
      const results = [...(responsePayload.results ?? [])].sort((first, second) => first.gini - second.gini);

      giniRequestCache.set(cacheKey, results);
      return results;
    })
    .finally(() => {
      inFlightGiniRequests.delete(cacheKey);
    });

  inFlightGiniRequests.set(cacheKey, request);
  return request;
}

export default function ModellingWhiteBox({
  condition = "WB",
  showIntro = false,
  initialNodes,
  isReadOnly = false,
}: ModellingWhiteBoxProps) {
  const router = useRouter();
  const selectedFeatures = useSelectedFeatures();
  const modelInput = useResolvedModelInput({
    condition,
    selectedFeatures,
  });
  const [isIntroOpen, setIsIntroOpen] = useState(showIntro && !isReadOnly);
  const [nodes, setNodes] = useState<TreeNodeData[]>(() =>
    initialNodes?.length ? initialNodes : [createRootNode(modelInput.features)],
  );
  const [openNodeId, setOpenNodeId] = useState<string | null>(null);
  const [giniByNode, setGiniByNode] = useState<Record<string, GiniState>>({});
  const [isTableOpen, setIsTableOpen] = useState(false);
  const [tutorialStep, setTutorialStep] = useState<ModellingTutorialStep>(null);
  const [shouldStartTutorialAfterIntro, setShouldStartTutorialAfterIntro] = useState(showIntro && !isReadOnly);
  const isTreeComplete = useMemo(() => {
    const terminalNodes = nodes.filter((node) => !node.leftId && !node.rightId);

    return terminalNodes.length > 0 && terminalNodes.every((node) => node.isLeaf);
  }, [nodes]);

  useEffect(() => {
    setNodes(initialNodes?.length ? initialNodes : [createRootNode(modelInput.features)]);
    setOpenNodeId(null);
    setGiniByNode({});
  }, [initialNodes, modelInput.features]);

  const openGiniInstructions = () => {
    setShouldStartTutorialAfterIntro(false);
    setIsIntroOpen(true);
  };

  const closeGiniInstructions = () => {
    setIsIntroOpen(false);

    if (shouldStartTutorialAfterIntro) {
      setTutorialStep("input-data");
      setShouldStartTutorialAfterIntro(false);
    }
  };

  const advanceTutorial = () => {
    setTutorialStep((currentStep) => {
      if (currentStep === "input-data") {
        return "inspect-table";
      }

      if (currentStep === "inspect-table") {
        return "root-node";
      }

      if (currentStep === "root-node") {
        return "waiting-for-gini";
      }

      if (currentStep === "gini-results") {
        return "waiting-for-children";
      }

      if (currentStep === "repeat") {
        return null;
      }

      return currentStep;
    });
  };

  const updateNode = (nodeId: string, updater: (node: TreeNodeData) => TreeNodeData) => {
    setNodes((currentNodes) =>
      currentNodes.map((currentNode) => (currentNode.id === nodeId ? updater(currentNode) : currentNode)),
    );
  };

  const openNode = async (nodeId: string) => {
    setOpenNodeId(nodeId);

    if (giniByNode[nodeId]?.isLoading) {
      return;
    }

    if (giniByNode[nodeId]?.results.length) {
      setTutorialStep((currentStep) =>
        currentStep === "waiting-for-gini" && nodeId === "root" ? "gini-results" : currentStep,
      );
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
      setTutorialStep((currentStep) =>
        currentStep === "waiting-for-gini" && nodeId === "root" ? "gini-results" : currentStep,
      );
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
    setTutorialStep((currentStep) =>
      currentStep === "waiting-for-children" && nodeId === "root" ? "repeat" : currentStep,
    );
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

  const finishTraining = async () => {
    if (!isTreeComplete) {
      return;
    }

    const trainingResult = countTreePredictions(nodes);

    try {
      trainingResult.predictionRows = await buildWhiteBoxPredictionRows(nodes, modelInput.data);
      trainingResult.trainingAccuracy = computeTrainingAccuracy(trainingResult.predictionRows);
    } catch {
      trainingResult.predictionRows = undefined;
      trainingResult.trainingAccuracy = undefined;
    }

    trainingResult.whiteBoxTree = nodes;
    saveTrainedTree(collectionTreeFromNodes(nodes));
    markModelAsTrained(trainingResult, condition);
    router.push("/modelling");
  };

  return (
    <div
      className="relative h-dvh w-full overflow-hidden bg-cover bg-center bg-no-repeat px-[24px] py-[50px] text-[#18181b]"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      {!isReadOnly && !isIntroOpen && <ActivityInstructionsButton onPress={openGiniInstructions} />}
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 z-0 bg-black/35" />
      <main className="relative z-10 mx-auto flex h-[calc(100dvh-130px)] w-full min-w-0 flex-col items-center">
        <div className="min-h-0 w-full min-w-0 flex-1 overflow-auto overscroll-contain">
          <div className="flex w-max min-w-full flex-col items-center">
            <TrainingDataCard
              features={modelInput.features}
              carnivores={modelInput.init_carnivores}
              herbivores={modelInput.init_herbivores}
              onInspectTable={() => setIsTableOpen(true)}
              tutorialStep={tutorialStep}
              onTutorialDismiss={advanceTutorial}
            />
            <Separator orientation="vertical" className="h-[12px] w-[5px] shrink-0" />
            <TreeCanvas
              nodes={nodes}
              openNodeId={openNodeId}
              giniByNode={giniByNode}
              onOpen={openNode}
              onSelectFeature={selectFeature}
              onConfirm={confirmNode}
              onDefineLeaf={defineLeaf}
              tutorialStep={tutorialStep}
              onTutorialDismiss={advanceTutorial}
            />
          </div>
        </div>

        <div className="fixed bottom-[20px] right-[20px] z-20 flex items-center gap-[10px]">
          {(isReadOnly || !isTreeComplete) && (
            <Link
              href="/modelling"
              className="inline-flex min-h-[40px] items-center justify-center rounded-full border border-white/50 bg-white/85 px-[16px] text-[14px] font-medium text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.06)] backdrop-blur-[20px] transition hover:bg-white"
            >
              Retour
            </Link>
          )}
          {!isReadOnly && isTreeComplete && (
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
        <ActivityInstructionsOverlay title="Impureté de Gini" onClose={closeGiniInstructions}>
          <GiniInstructionsContent />
        </ActivityInstructionsOverlay>
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

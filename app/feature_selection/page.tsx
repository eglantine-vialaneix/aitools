"use client";

import { useState } from "react";
import { ActivityInstructionsOverlay, FeatureSelectionInstructionsContent } from "@/app/components";
import { conditionForStep, useExperimentCondition } from "@/app/lib/experimentCondition";
import BlackBox from "./pageBB";
import WhiteBox from "./pageWB";

export default function FeatureSelectionInstructions() {
  const experimentCondition = useExperimentCondition();
  const condition = conditionForStep(experimentCondition, "feature_selection");
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const openInstructions = () => setIsInstructionsOpen(true);
  const closeInstructions = () => setIsInstructionsOpen(false);

  if (condition === "WB") {
    return (
      <>
        <WhiteBox onShowInstructions={openInstructions} />
        {isInstructionsOpen && (
          <ActivityInstructionsOverlay title="Consignes de sélection" onClose={closeInstructions}>
            <FeatureSelectionInstructionsContent condition="WB" />
          </ActivityInstructionsOverlay>
        )}
      </>
    );
  }

  if (condition === "BB") {
    return (
      <>
        <BlackBox onShowInstructions={openInstructions} />
        {isInstructionsOpen && (
          <ActivityInstructionsOverlay title="Consignes de sélection" onClose={closeInstructions}>
            <FeatureSelectionInstructionsContent condition="BB" />
          </ActivityInstructionsOverlay>
        )}
      </>
    );
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 text-zinc-900">
      <p className="rounded-3xl bg-white p-8 text-lg shadow-lg">
        Choisis d&apos;abord une condition sur la page d&apos;accueil.
      </p>
    </div>
  );
}

"use client";

import { useState } from "react";
import BlackBox from "./pageBB";
import WhiteBox from "./pageWB";
import { ActivityInstructionsOverlay, LoremIpsumInstructions } from "@/app/components";
import { conditionForStep, useExperimentCondition } from "@/app/lib/experimentCondition";

export default function DataLabellingInstructions() {
  const experimentCondition = useExperimentCondition();
  const condition = conditionForStep(experimentCondition, "data_labelling");
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(true);
  const openInstructions = () => setIsInstructionsOpen(true);
  const closeInstructions = () => setIsInstructionsOpen(false);

  if (condition === "WB") {
    return (
      <>
        <WhiteBox onShowInstructions={openInstructions} />
        {isInstructionsOpen && (
          <ActivityInstructionsOverlay title="Consignes de classification" onClose={closeInstructions}>
            <LoremIpsumInstructions />
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
          <ActivityInstructionsOverlay title="Consignes de classification" onClose={closeInstructions}>
            <LoremIpsumInstructions />
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

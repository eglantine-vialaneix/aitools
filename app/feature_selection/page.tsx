"use client";

import { conditionForStep, useExperimentCondition } from "@/app/lib/experimentCondition";
import BlackBox from "./pageBB";
import WhiteBox from "./pageWB";

export default function FeatureSelectionInstructions() {
  const experimentCondition = useExperimentCondition();
  const condition = conditionForStep(experimentCondition, "feature_selection");

  if (condition === "WB") {
    return <WhiteBox />;
  }

  if (condition === "BB") {
    return <BlackBox />;
  }

  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-50 text-zinc-900">
      <p className="rounded-3xl bg-white p-8 text-lg shadow-lg">
        Choisis d&apos;abord une condition sur la page d&apos;accueil.
      </p>
    </div>
  );
}

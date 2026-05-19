"use client";

import BlackBox from "./pageBB";
import WhiteBox from "./pageWB";
import { conditionForStep, useExperimentCondition } from "@/app/lib/experimentCondition";

export default function DataLabellingInstructions() {
  const experimentCondition = useExperimentCondition();
  const condition = conditionForStep(experimentCondition, "data_labelling");

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

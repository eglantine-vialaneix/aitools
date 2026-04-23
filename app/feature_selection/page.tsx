"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import BlackBox from "./pageBB";
import WhiteBox from "./pageWB";

const assignedCondition: "WB" | "BB" = "WB";

export default function FeatureSelectionInstructions() {
  const searchParams = useSearchParams();
  const condition = searchParams.get("condition");

  if (condition === "WB") {
    return <WhiteBox />;
  }

  if (condition === "BB") {
    return <BlackBox />;
  }

  return (
    <div
      className="relative flex min-h-dvh w-full items-center justify-center overflow-hidden bg-cover bg-center bg-no-repeat px-[50px] py-[60px] text-[#18181b]"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div aria-hidden="true" className="absolute inset-0 bg-black/35" />
      <main className="relative flex min-h-[calc(100dvh-120px)] w-full max-w-[1180px] flex-col rounded-[24px] border border-[#dedee0] bg-[#f5f5f5] p-[56px] shadow-[-7px_7px_4px_0px_rgba(0,0,0,0.25)]">
        <div className="max-w-[820px]">
          <h1 className="text-[48px] font-bold leading-[1.12]">Étape 2: Sélection des caractéristiques</h1>
          <div className="mt-[36px] flex flex-col gap-[20px] text-[22px] leading-[1.45] text-[#3f3f46]">
            <p>
              Lorem ipsum dolor sit amet, consectetur adipiscing elit. Integer vitae velit at
              sapien facilisis cursus. Donec commodo, nibh sed interdum posuere, lorem mi
              ullamcorper neque, vitae tincidunt urna magna eu ligula.
            </p>
            <p>
              Sed a magna non risus pretium finibus. Praesent at sapien id sem luctus blandit.
              Curabitur vitae nibh sed libero gravida fermentum. Cras luctus, massa non
              tristique finibus, neque neque viverra erat, non tempor urna arcu non ipsum.
            </p>
            <p>
              Mauris posuere, risus et dignissim tincidunt, lacus quam faucibus sem, vitae
              dictum justo augue nec lectus. Suspendisse potenti. Aliquam erat volutpat.
            </p>
          </div>
        </div>

        <div className="mt-auto flex w-full items-end justify-between gap-[24px] pt-[48px]">
          <div className="flex flex-wrap gap-[12px]">
            <Link
              href="/feature_selection?condition=WB"
              className="flex h-[44px] items-center justify-center rounded-[22px] bg-[#52525b] px-[18px] text-[16px] font-medium text-[#fcfcfc] transition hover:bg-[#3f3f46]"
            >
              feature selection WB
            </Link>
            <Link
              href="/feature_selection?condition=BB"
              className="flex h-[44px] items-center justify-center rounded-[22px] bg-[#52525b] px-[18px] text-[16px] font-medium text-[#fcfcfc] transition hover:bg-[#3f3f46]"
            >
              feature selection BB
            </Link>
          </div>
          <Link
            className="inline-flex h-[48px] items-center justify-center rounded-full bg-[#006fee] px-[24px] text-[16px] font-medium text-white transition hover:bg-[#0059c9]"
            href={`/feature_selection?condition=${assignedCondition}`}
          >
            Suite
          </Link>
        </div>
      </main>
    </div>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { TextArea } from "@heroui/react";
import { ActivityInstructionsButton } from "@/app/components";
import { Dino, type DinoName } from "@/app/components/Dino";
import { DinoBucket } from "@/app/components/DinoBucket";
import { clearDinoLabels, saveDinoLabels, type DinoDiet } from "@/app/lib/dinoLabels";

const imgBlackBox1 = "/background.png";
const pageClassName = "content-stretch flex h-dvh w-full items-center justify-center overflow-hidden px-[clamp(14px,3.5vw,50px)] py-[clamp(14px,5dvh,60px)] relative";
const contentClassName = "content-stretch flex flex-[1_0_0] gap-[clamp(14px,3vw,50px)] h-full w-full items-stretch justify-end min-h-0 min-w-0 relative";
const leftPanelClassName = "flex flex-1 min-w-[clamp(120px,14vw,180px)] pt-[clamp(12px,5dvh,60px)] pl-[clamp(0px,3vw,50px)] flex-col justify-center items-end gap-[clamp(16px,5dvh,60px)] self-stretch overflow-visible";
const stackedCardsClassName = "content-center flex flex-nowrap h-[clamp(150px,25dvh,255px)] items-center justify-end pr-[clamp(80px,13.4dvh,137px)] relative shrink-0 self-end";
const stackedDinoClassName = "content-stretch flex h-[clamp(150px,25dvh,255px)] items-center mr-[clamp(-137px,-13.4dvh,-80px)] relative shrink-0 w-[clamp(106px,17.6dvh,180px)]";
const mainCardClassName = "content-stretch flex aspect-[636.2648315429688/904] h-auto max-h-full w-[min(42vw,calc((100dvh-32px)*0.704))] min-w-[220px] items-center justify-center relative shrink-0";
const mainDinoClassName = "aspect-[636.2648315429688/904] content-stretch flex h-full w-full items-center relative shrink-0";
const sidePanelClassName = "content-stretch flex flex-col gap-[clamp(12px,3dvh,36px)] h-full min-h-0 items-center justify-center relative shrink-0 w-[clamp(220px,23vw,333px)]";
const bucketDinoClassName = "content-stretch flex h-[clamp(72px,12.5dvh,128px)] items-center relative shrink-0 w-[clamp(51px,8.8dvh,90px)]";

type DinoState = "left" | "selected" | "herbivore" | "carnivore";

type DinoItem = {
  name: DinoName;
  state: DinoState;
};

type BlackBoxProps = {
  onShowInstructions?: () => void;
};

const dinoDiets: Record<DinoName, "herbivore" | "carnivore"> = {
  Apatosaurus: "herbivore",
  Brachiosaurus: "herbivore",
  Gallimimus: "carnivore",
  Megalosaurus: "carnivore",
  Plateosaurus: "herbivore",
  Spinosaurus: "carnivore",
  Stegosaurus: "herbivore",
  Styracosaurus: "herbivore",
  Tyrannosaurus: "carnivore",
  Utahraptor: "carnivore",
};

const initialDinos: DinoItem[] = [
  { name: "Apatosaurus", state: "selected" },
  { name: "Brachiosaurus", state: "left" },
  { name: "Gallimimus", state: "left" },
  { name: "Megalosaurus", state: "left" },
  { name: "Plateosaurus", state: "left" },
  { name: "Spinosaurus", state: "left" },
  { name: "Stegosaurus", state: "left" },
  { name: "Styracosaurus", state: "left" },
  { name: "Tyrannosaurus", state: "left" },
  { name: "Utahraptor", state: "left" },
];

function NextControl({ isDisabled, onClick }: { isDisabled: boolean; onClick: () => void }) {
  return (
    <div className="content-stretch flex h-[40px] w-full items-center gap-[10px]" data-node-id="217:6804">
      <div className="flex h-[12px] flex-[1_0_0] items-center">
        <hr className="w-full border-0 border-t border-[var(--border,#dedee0)]" />
      </div>
      <button
        type="button"
        aria-label="arrow-right"
        className="max-h-[40px] min-h-[40px] min-w-[40px] shrink-0 rounded-[24px] bg-[#ebebec] p-[12px] text-[#18181b] transition hover:bg-[#dedee0] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={isDisabled}
        onClick={onClick}
      >
        <svg aria-hidden="true" className="size-[16px]" fill="none" viewBox="0 0 16 16">
          <path
            d="M3.75 8h8.5M8.75 3.75 13 8l-4.25 4.25"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.6"
          />
        </svg>
      </button>
      <div className="flex h-[12px] flex-[1_0_0] items-center">
        <hr className="w-full border-0 border-t border-[var(--border,#dedee0)]" />
      </div>
    </div>
  );
}

export default function BlackBox({ onShowInstructions }: BlackBoxProps) {
  const [dinos, setDinos] = useState<DinoItem[]>(initialDinos);

  useEffect(() => {
    clearDinoLabels();
  }, []);

  const remainingDinos = dinos.filter((dino) => dino.state === "left").map((dino) => dino.name);
  const selectedDino = dinos.find((dino) => dino.state === "selected")?.name ?? null;
  const herbivoreDinos = dinos.filter((dino) => dino.state === "herbivore").map((dino) => dino.name);
  const carnivoreDinos = dinos.filter((dino) => dino.state === "carnivore").map((dino) => dino.name);
  const hasNextDino = selectedDino !== null;
  const hasLabelledAllDinos = dinos.every((dino) => dino.state === "herbivore" || dino.state === "carnivore");

  useEffect(() => {
    if (!hasLabelledAllDinos) {
      return;
    }

    saveDinoLabels(
      Object.fromEntries(dinos.map((dino) => [dino.name, dino.state as DinoDiet])),
    );
  }, [dinos, hasLabelledAllDinos]);

  const renderBucketCards = (bucketDinos: DinoName[]) => {
    return bucketDinos.map((dino) => (
      <Dino key={dino} className={bucketDinoClassName} dino={dino} labelled1 size="sm" />
    ));
  };

  const goToNextDino = () => {
    if (!selectedDino) {
      return;
    }

    setDinos((currentDinos) => {
      const currentSelectedIndex = currentDinos.findIndex((dino) => dino.state === "selected");

      if (currentSelectedIndex === -1) {
        return currentDinos;
      }

      let promotedNextDino = false;

      return currentDinos.map((dino, index) => {
        if (index === currentSelectedIndex) {
          return { ...dino, state: dinoDiets[dino.name] };
        }

        if (!promotedNextDino && dino.state === "left") {
          promotedNextDino = true;
          return { ...dino, state: "selected" };
        }

        return dino;
      });
    });
  };

  return (
    <div className={pageClassName} data-name="BlackBox - 1" data-node-id="4:14">
      {onShowInstructions && <ActivityInstructionsButton onPress={onShowInstructions} />}
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <Image fill alt="" className="absolute max-w-none object-cover" sizes="100vw" src={imgBlackBox1} />
        <div className="absolute inset-0" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1440 1024\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.25\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(4.4087e-15 51.2 -72 3.1351e-15 720 512)\\'><stop stop-color=\\'rgba(102,102,102,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(77,77,77,1)\\' offset=\\'0.25\\'/><stop stop-color=\\'rgba(51,51,51,1)\\' offset=\\'0.5\\'/><stop stop-color=\\'rgba(26,26,26,1)\\' offset=\\'0.75\\'/><stop stop-color=\\'rgba(13,13,13,1)\\' offset=\\'0.875\\'/><stop stop-color=\\'rgba(6,6,6,1)\\' offset=\\'0.9375\\'/><stop stop-color=\\'rgba(0,0,0,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" }} />
      </div>
      <div className={contentClassName}>
        <div className={leftPanelClassName} data-name="left">
          <div className={stackedCardsClassName} data-name="all cards left" style={{
            backdropFilter: "blur(4.5px)",
            maskImage: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 1) 100%)",
            WebkitMaskImage: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 1) 100%)"
          }}>
            {[...remainingDinos].reverse().map((dino) => (
              <Dino
                key={dino}
                className={stackedDinoClassName}
                dino={dino}
                size="md"
              />
            ))}
            <Dino className={stackedDinoClassName} dino="Number" size="md" digit={remainingDinos.length} />
          </div>
          <div className="flex w-full min-w-[180px] flex-col items-start gap-[4px] flex-[1_0_0] self-stretch">
            <p className="font-medium text-[14px] leading-[1.43] text-[#efefef]">Tes notes:</p>
            <TextArea className="w-full h-full [&>div]:w-full" placeholder="Écris tes notes ici..." />
          </div>
        </div>
        <div className={mainCardClassName} data-name="Main card">
          {selectedDino ? (
            <Dino className={mainDinoClassName} dino={selectedDino} labelled1 size="Main" />
          ) : (
            <div className="bg-[#f5f5f5] border border-dashed border-[#dedee0] flex h-full flex-col items-center justify-center gap-[24px] rounded-[20px] text-[24px] text-[#71717a] w-full">
              <p>Tous les dinosaures ont été assignés.</p>
              <Link
                className="inline-flex h-[48px] items-center justify-center rounded-full bg-[#006fee] px-[24px] text-[16px] font-medium text-white transition hover:bg-[#0059c9]"
                href="/feature_selection"
              >
                Suite
              </Link>
            </div>
          )}
        </div>
        <div className={sidePanelClassName} data-name="right">
          <DinoBucket className="flex-1 min-h-0" data-name="all herbivores">
            {renderBucketCards(herbivoreDinos)}
          </DinoBucket>
          <NextControl isDisabled={!hasNextDino} onClick={goToNextDino} />
          <DinoBucket className="flex-1 min-h-0" data-name="all carnivores">
            {renderBucketCards(carnivoreDinos)}
          </DinoBucket>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { TextArea } from "@heroui/react";
import { Dino, type DinoName } from "@/app/components/Dino";
import { Button } from "@/app/components/Button";

const imgBlackBox1 = "/background.png";

const dinos: DinoName[] = [
  "Apatosaurus",
  "Brachiosaurus",
  "Gallimimus",
  "Megalosaurus",
  "Plateosaurus",
  "Spinosaurus",
  "Stegosaurus",
  "Styracosaurus",
  "Tyrannosaurus",
  "Utahraptor",
];

export default function BlackBox() {
  const [currentIndex, setCurrentIndex] = useState(0);

  const selectedDino = dinos[currentIndex];
  const previousDinos = dinos.slice(0, currentIndex);
  const upcomingDinos = dinos.slice(currentIndex + 1);
  const hasPreviousDino = currentIndex > 0;
  const hasNextDino = currentIndex < dinos.length - 1;

  const goToPreviousDino = () => {
    setCurrentIndex((index) => Math.max(index - 1, 0));
  };

  const goToNextDino = () => {
    setCurrentIndex((index) => Math.min(index + 1, dinos.length - 1));
  };

  return (
    <div className="content-stretch flex h-dvh min-h-[600px] w-full items-center justify-center px-[50px] py-[60px] relative" data-name="BlackBox - 1" data-node-id="4:14">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img alt="" className="absolute max-w-none object-cover size-full" src={imgBlackBox1} />
        <div className="absolute inset-0" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1440 1024\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.25\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(4.4087e-15 51.2 -72 3.1351e-15 720 512)\\'><stop stop-color=\\'rgba(102,102,102,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(77,77,77,1)\\' offset=\\'0.25\\'/><stop stop-color=\\'rgba(51,51,51,1)\\' offset=\\'0.5\\'/><stop stop-color=\\'rgba(26,26,26,1)\\' offset=\\'0.75\\'/><stop stop-color=\\'rgba(13,13,13,1)\\' offset=\\'0.875\\'/><stop stop-color=\\'rgba(6,6,6,1)\\' offset=\\'0.9375\\'/><stop stop-color=\\'rgba(0,0,0,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" }} />
      </div>
      <div className="content-stretch flex flex-[1_0_0] gap-[50px] h-full w-full items-stretch justify-end min-h-px min-w-px relative">
        <div className="flex flex-1 min-w-[180px] pt-[60px] pl-[50px] flex-col justify-center items-end gap-[60px] self-stretch overflow-visible" data-name="left">
          <div className="content-center flex flex-nowrap h-[255px] items-center justify-end pr-[137px] relative shrink-0 self-end" data-name="all cards left" style={{
            backdropFilter: "blur(4.5px)",
            maskImage: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 1) 100%)",
            WebkitMaskImage: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 1) 100%)"
          }}>
            {upcomingDinos.toReversed().map((dino) => (
              <Dino
                key={dino}
                className="content-stretch flex h-[255px] items-center mr-[-137px] relative shrink-0 w-[180px]"
                dino={dino}
                size="md"
              />
            ))}
            <Dino className="h-[255px] mr-[-137px] relative shrink-0 w-[180px]" dino="Number" size="md" digit={upcomingDinos.length} />
          </div>
          <div className="flex w-full min-w-[180px] flex-col items-start gap-[4px] flex-[1_0_0] self-stretch">
            <p className="font-medium text-[14px] leading-[1.43] text-[#efefef]">Your notes:</p>
            <TextArea className="w-full h-full [&>div]:w-full" placeholder="Write your notes here..." />
          </div>
        </div>
        <div className="content-stretch flex h-full items-center justify-center relative shrink-0 w-[629px]" data-name="Main card">
          <Dino className="aspect-[636.2648315429688/904] content-stretch flex h-full items-center relative shrink-0" dino={selectedDino} labelled1 size="Main" />
        </div>
        <div className="content-stretch flex flex-col gap-[36px] h-full min-h-[600px] items-center justify-center relative shrink-0 w-[333px]" data-name="right">
          <div className="bg-[#f5f5f5] border border-[#dedee0] border-solid relative w-full flex-1 min-h-0 overflow-hidden rounded-[24px]">
            <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_-7px_7px_4px_0px_rgba(0,0,0,0.25)]" />
            <div className="relative z-10 grid h-full w-full grid-cols-3 auto-rows-min content-start gap-x-[10px] gap-y-[10px] overflow-hidden p-[20px]">
              {previousDinos.map((dino) => (
                <Dino key={dino} dino={dino} labelled1 size="sm" />
              ))}
            </div>
          </div>
          <Button isDisabled={!hasPreviousDino} variant="default" onClick={goToPreviousDino}>
            Previous
          </Button>
          <div className="flex h-[50px] w-full items-center justify-center rounded-[25px] border-2 border-[#efefef] text-[24px] font-medium leading-[32px] text-[#efefef]">
            {currentIndex + 1} / {dinos.length}
          </div>
          <Button isDisabled={!hasNextDino} variant="default" onClick={goToNextDino}>
            Next
          </Button>
          <div className="bg-[#f5f5f5] border border-[#dedee0] border-solid relative w-full flex-1 min-h-0 overflow-hidden rounded-[24px]">
            <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_-7px_7px_4px_0px_rgba(0,0,0,0.25)]" />
            <div className="relative z-10 grid h-full w-full grid-cols-3 auto-rows-min content-start gap-x-[10px] gap-y-[10px] overflow-hidden p-[20px]">
              {upcomingDinos.map((dino) => (
                <Dino key={dino} dino={dino} labelled1 size="sm" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

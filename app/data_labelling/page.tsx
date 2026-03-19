"use client";

import { useState } from "react";
import { Dino, type DinoName } from "@/app/components/Dino";
import { Button } from "@/app/components/Button";
import { Separator } from "@/app/components/Separator";
import { DinoBucket } from "@/app/components/DinoBucket";

const imgWhiteBox1 = "/background.png";

type DinoState = "left" | "selected" | "herbivore" | "carnivore";

type DinoItem = {
  name: DinoName;
  state: DinoState;
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

export default function WhiteBox() {
  const [dinos, setDinos] = useState<DinoItem[]>(initialDinos);
  const [activeBucket, setActiveBucket] = useState<"herbivore" | "carnivore" | null>(null);

  const remainingDinos = dinos.filter((dino) => dino.state === "left").map((dino) => dino.name);
  const selectedDino = dinos.find((dino) => dino.state === "selected")?.name ?? null;
  const herbivoreDinos = dinos.filter((dino) => dino.state === "herbivore").map((dino) => dino.name);
  const carnivoreDinos = dinos.filter((dino) => dino.state === "carnivore").map((dino) => dino.name);
  const dinoCount = remainingDinos.length;

  const renderBucketCards = (bucketDinos: DinoName[]) => {
    return bucketDinos.map((dino) => <Dino key={dino} dino={dino} size="sm" />);
  };

  const assignSelectedDino = (diet: "herbivore" | "carnivore") => {
    if (!selectedDino) {
      return;
    }

    setDinos((currentDinos) => {
      const selectedIndex = currentDinos.findIndex((dino) => dino.state === "selected");

      if (selectedIndex === -1) {
        return currentDinos;
      }

      let promotedNextDino = false;

      return currentDinos.map((dino, index) => {
        if (index === selectedIndex) {
          return { ...dino, state: diet };
        }

        if (!promotedNextDino && dino.state === "left") {
          promotedNextDino = true;
          return { ...dino, state: "selected" };
        }

        return dino;
      });
    });

    setActiveBucket(diet);
  };

  return (
    <div className="content-stretch flex items-center justify-center py-[60px] relative size-full" data-name="WhiteBox - 1" data-node-id="4:13">
      <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
        <img alt="" className="absolute max-w-none object-cover size-full" src={imgWhiteBox1} />
        <div className="absolute inset-0" style={{ backgroundImage: "url('data:image/svg+xml;utf8,<svg viewBox=\\'0 0 1440 1024\\' xmlns=\\'http://www.w3.org/2000/svg\\' preserveAspectRatio=\\'none\\'><rect x=\\'0\\' y=\\'0\\' height=\\'100%\\' width=\\'100%\\' fill=\\'url(%23grad)\\' opacity=\\'0.25\\'/><defs><radialGradient id=\\'grad\\' gradientUnits=\\'userSpaceOnUse\\' cx=\\'0\\' cy=\\'0\\' r=\\'10\\' gradientTransform=\\'matrix(4.4087e-15 51.2 -72 3.1351e-15 720 512)\\'><stop stop-color=\\'rgba(102,102,102,1)\\' offset=\\'0\\'/><stop stop-color=\\'rgba(77,77,77,1)\\' offset=\\'0.25\\'/><stop stop-color=\\'rgba(51,51,51,1)\\' offset=\\'0.5\\'/><stop stop-color=\\'rgba(26,26,26,1)\\' offset=\\'0.75\\'/><stop stop-color=\\'rgba(13,13,13,1)\\' offset=\\'0.875\\'/><stop stop-color=\\'rgba(6,6,6,1)\\' offset=\\'0.9375\\'/><stop stop-color=\\'rgba(0,0,0,1)\\' offset=\\'1\\'/></radialGradient></defs></svg>')" }} />
      </div>
      <div className="content-stretch flex flex-[1_0_0] gap-[50px] h-full items-center justify-end min-h-px min-w-px px-[50px] relative" data-node-id="10:189">
        <div className="content-stretch flex items-center py-[191px] relative shrink-0" data-name="left" data-node-id="11:6">
          <div className="content-center flex flex-wrap gap-y-[49px] items-center justify-center pr-[137px] relative shrink-0" data-name="all cards left" data-node-id="10:175" style={{
            backdropFilter: "blur(4.5px)",
            maskImage: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 1) 100%)",
            WebkitMaskImage: "linear-gradient(90deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.3) 40%, rgba(0, 0, 0, 1) 100%)"
          }}>
            {remainingDinos.reverse().map((dino) => (
              <Dino
                key={dino}
                className="content-stretch flex h-[255px] items-center mr-[-137px] relative shrink-0 w-[180px]"
                dino={dino}
                size="md"
              />
            ))}
            <Dino className="h-[255px] mr-[-137px] relative shrink-0 w-[180px]" dino="Number" size="md" digit={dinoCount} />
          </div>
        </div>
        <div className="content-stretch flex h-[892px] items-center justify-center relative shrink-0 w-[629px]" data-name="Main card" data-node-id="10:187">
          {selectedDino ? (
            <Dino className="aspect-[636.2648315429688/904] content-stretch flex h-full items-center relative shrink-0" dino={selectedDino} size="Main" />
          ) : (
            <div className="bg-[#f5f5f5] border border-dashed border-[#dedee0] flex h-full items-center justify-center rounded-[20px] text-[24px] text-[#71717a] w-full">
              All dinosaurs have been assigned
            </div>
          )}
        </div>
        <div className="content-stretch flex flex-col gap-[36px] h-full items-center justify-center relative shrink-0 w-[333px]" data-name="right" data-node-id="15:5918">
          <DinoBucket isActive={activeBucket === "herbivore"} data-name="all herbivores" data-node-id="19:12746">
            {renderBucketCards(herbivoreDinos)}
          </DinoBucket>
          <Button isActive={activeBucket === "herbivore"} isDisabled={!selectedDino} variant="herbivore" onClick={() => assignSelectedDino("herbivore")}>
            Herbivore
          </Button>
          <Separator label="OR" />
          <Button isActive={activeBucket === "carnivore"} isDisabled={!selectedDino} variant="carnivore" onClick={() => assignSelectedDino("carnivore")}>
            Carnivore
          </Button>
          <DinoBucket isActive={activeBucket === "carnivore"} data-name="all carnivores" data-node-id="19:12750">
            {renderBucketCards(carnivoreDinos)}
          </DinoBucket>
        </div>
      </div>
    </div>
  );
}


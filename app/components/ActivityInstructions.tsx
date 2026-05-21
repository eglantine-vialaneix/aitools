"use client";

import { Button } from "@heroui/react";
import { type ReactNode } from "react";

type ActivityInstructionsOverlayProps = {
  title: string;
  children: ReactNode;
  onClose: () => void;
};

type ActivityInstructionsButtonProps = {
  onPress: () => void;
};

export function ActivityInstructionsOverlay({
  title,
  children,
  onClose,
}: ActivityInstructionsOverlayProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-[24px] py-[24px] backdrop-blur-[2px]">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="activity-instructions-title"
        className="flex max-h-full w-full max-w-[640px] flex-col gap-[18px] overflow-auto rounded-[24px] border border-[#dedee0] bg-white p-[28px] text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.06),0_-6px_12px_rgba(0,0,0,0.03),0_14px_28px_rgba(0,0,0,0.08)]"
      >
        <div>
          <p className="text-[14px] font-medium text-[#52525b]">Avant de commencer</p>
          <h2 id="activity-instructions-title" className="mt-[6px] text-[28px] font-extrabold leading-[1.12]">
            {title}
          </h2>
        </div>
        <div className="flex flex-col gap-[12px] text-[16px] leading-[1.5] text-[#3f3f46]">
          {children}
        </div>
        <div className="flex justify-end">
          <Button
            className="min-h-[40px] rounded-full bg-[#0485f7] px-[18px] text-[15px] font-medium text-white"
            onPress={onClose}
          >
            C&apos;est parti !
          </Button>
        </div>
      </section>
    </div>
  );
}

export function ActivityInstructionsButton({ onPress }: ActivityInstructionsButtonProps) {
  return (
    <Button
      className="fixed left-[16px] top-[16px] z-40 min-h-[32px] rounded-full border border-white/50 bg-white/90 px-[12px] text-[13px] font-medium text-[#18181b] shadow-[0_2px_8px_rgba(0,0,0,0.12)] backdrop-blur-[20px] transition hover:bg-white"
      onPress={onPress}
    >
      Euh je dois faire quoi déjà ?
    </Button>
  );
}

export function LoremIpsumInstructions() {
  return (
    <>
      <p>
        Lorem ipsum dolor sit amet, consectetur adipiscing elit. Donec tempor neque vitae mi
        luctus, sed dignissim dui faucibus.
      </p>
      <p>
        Integer at sapien non lectus volutpat gravida. Fusce euismod, erat vel commodo luctus,
        servira ici de texte d&apos;explication pour cette activité.
      </p>
    </>
  );
}

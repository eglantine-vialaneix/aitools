"use client";

import { Tooltip } from "@heroui/react";
import { type ReactNode } from "react";

export type DataLabellingTutorialStep = 1 | 2 | 3 | null;

type DataLabellingTutorialHintProps = {
  label: string;
  onDismiss: () => void;
  placement?: "top" | "right" | "bottom" | "left";
};

type DataLabellingTutorialTargetProps = DataLabellingTutorialHintProps & {
  children: ReactNode;
  className?: string;
};

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

function TooltipBody({ label, onDismiss, placement = "top" }: DataLabellingTutorialHintProps) {
  return (
    <Tooltip.Content
      className="z-[90] w-[270px] max-w-[270px] break-normal rounded-[14px] border border-[#dedee0] bg-white px-[14px] py-[12px] text-[15px] font-semibold leading-[1.35] text-[#24324a] shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
      placement={placement}
      showArrow
      onClick={onDismiss}
    >
      <Tooltip.Arrow className="text-white [&_[data-slot=overlay-arrow]]:fill-white [&_[data-slot=overlay-arrow]]:stroke-[#dedee0]" />
      <p>{label}</p>
    </Tooltip.Content>
  );
}

export function DataLabellingCenterTutorialHint({ label, onDismiss }: DataLabellingTutorialHintProps) {
  return (
    <Tooltip.Root isOpen>
      <TutorialBackdrop onDismiss={onDismiss} />
      <Tooltip.Trigger
        aria-label="Indication centrale pour le tutoriel de classification"
        className="pointer-events-none fixed left-1/2 top-1/2 z-[80] h-[1px] w-[1px] -translate-x-1/2 -translate-y-1/2"
      />
      <TooltipBody label={label} onDismiss={onDismiss} placement="top" />
    </Tooltip.Root>
  );
}

export function DataLabellingTutorialTarget({
  children,
  className = "",
  label,
  onDismiss,
  placement = "top",
}: DataLabellingTutorialTargetProps) {
  return (
    <Tooltip.Root isOpen>
      <div className={`relative ${className}`}>
        {children}
        <Tooltip.Trigger
          aria-label="Indication pour le tutoriel de classification"
          className="pointer-events-none absolute inset-0 z-[80]"
        />
      </div>
      <TutorialBackdrop onDismiss={onDismiss} />
      <TooltipBody label={label} onDismiss={onDismiss} placement={placement} />
    </Tooltip.Root>
  );
}

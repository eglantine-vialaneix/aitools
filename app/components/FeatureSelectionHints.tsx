"use client";

import { Tooltip } from "@heroui/react";
import { type ReactNode } from "react";

export type FeatureSelectionTutorialStep = 1 | 2 | 3 | null;

type FeatureSelectionHintProps = {
  label?: string;
  onDismiss: () => void;
  placement?: "top" | "right" | "bottom" | "left";
};

type FeatureSelectionTutorialTargetProps = FeatureSelectionHintProps & {
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

function TooltipBody({
  label,
  onDismiss,
  placement = "top",
  widthClassName = "w-[280px] max-w-[280px]",
}: FeatureSelectionHintProps & { widthClassName?: string }) {
  return (
    <Tooltip.Content
      className={`z-[90] ${widthClassName} break-normal rounded-[12px] border border-[#dedee0] bg-white px-[12px] py-[10px] text-[13px] font-medium leading-[1.35] text-[#24324a] shadow-[0_12px_28px_rgba(0,0,0,0.18)]`}
      placement={placement}
      showArrow
      onClick={onDismiss}
    >
      <Tooltip.Arrow className="text-white [&_[data-slot=overlay-arrow]]:fill-white [&_[data-slot=overlay-arrow]]:stroke-[#dedee0]" />
      <p>{label}</p>
    </Tooltip.Content>
  );
}

export function PeriodHeaderHint({ onDismiss }: FeatureSelectionHintProps) {
  return (
    <Tooltip.Root isOpen>
      <TutorialBackdrop onDismiss={onDismiss} />
      <Tooltip.Trigger
        aria-label="Indication pour trier et déplacer les colonnes"
        className="pointer-events-none absolute inset-0"
      />
      <TooltipBody
        label="Clique sur le nom d'une colonne pour l'ordonner. Tu peux aussi déplacer les colonnes."
        onDismiss={onDismiss}
      />
    </Tooltip.Root>
  );
}

export function ResetSortHint({ onDismiss }: FeatureSelectionHintProps) {
  return (
    <Tooltip.Root isOpen>
      <TutorialBackdrop onDismiss={onDismiss} />
      <Tooltip.Trigger
        aria-label="Indication pour réinitialiser le tableau"
        className="pointer-events-none absolute inset-0"
      />
      <TooltipBody
        label="Ici, tu peux réinitialiser le tableau."
        onDismiss={onDismiss}
        widthClassName="w-[250px] max-w-[250px]"
      />
    </Tooltip.Root>
  );
}

export function FeatureSelectionTutorialTarget({
  children,
  className = "",
  label = "",
  onDismiss,
  placement = "bottom",
}: FeatureSelectionTutorialTargetProps) {
  return (
    <Tooltip.Root isOpen>
      <div className={`relative ${className}`}>
        {children}
        <Tooltip.Trigger
          aria-label="Indication pour le tutoriel de sélection des caractéristiques"
          className="pointer-events-none absolute inset-0 z-[80]"
        />
      </div>
      <TutorialBackdrop onDismiss={onDismiss} />
      <TooltipBody
        label={label}
        onDismiss={onDismiss}
        placement={placement}
        widthClassName="w-[360px] max-w-[360px]"
      />
    </Tooltip.Root>
  );
}

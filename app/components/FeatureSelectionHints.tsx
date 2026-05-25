"use client";

import { Tooltip } from "@heroui/react";

type FeatureSelectionHintProps = {
  onDismiss: () => void;
};

export function PeriodHeaderHint({ onDismiss }: FeatureSelectionHintProps) {
  return (
    <Tooltip.Root isOpen onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <Tooltip.Trigger
        aria-label="Indication pour trier et déplacer les colonnes"
        className="pointer-events-none absolute inset-0"
      />
      <Tooltip.Content
        className="z-[90] w-[280px] max-w-[280px] break-normal rounded-[12px] border border-[#dedee0] bg-white px-[12px] py-[10px] text-[13px] font-medium leading-[1.35] text-[#24324a] shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
        placement="top"
        showArrow
      >
        <Tooltip.Arrow className="text-white [&_[data-slot=overlay-arrow]]:fill-white [&_[data-slot=overlay-arrow]]:stroke-[#dedee0]" />
        <button
          type="button"
          aria-label="Fermer les indications du tableau"
          className="absolute right-[8px] top-[6px] flex h-[20px] w-[20px] items-center justify-center rounded-full text-[13px] text-[#64748b] hover:bg-[#eef6ff]"
          onClick={onDismiss}
        >
          x
        </button>
        <p className="pr-[18px]">
          Clique sur le nom d&apos;une colonne pour l&apos;ordonner. Tu peux aussi déplacer les colonnes.
        </p>
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

export function ResetSortHint({ onDismiss }: FeatureSelectionHintProps) {
  return (
    <Tooltip.Root isOpen onOpenChange={(isOpen) => !isOpen && onDismiss()}>
      <Tooltip.Trigger
        aria-label="Indication pour réinitialiser le tableau"
        className="pointer-events-none absolute inset-0"
      />
      <Tooltip.Content
        className="z-[80] w-[250px] max-w-[250px] break-normal rounded-[12px] border border-[#dedee0] bg-white px-[12px] py-[10px] text-[13px] font-medium leading-[1.35] text-[#24324a] shadow-[0_12px_28px_rgba(0,0,0,0.18)]"
        placement="top"
        showArrow
      >
        <Tooltip.Arrow className="text-white [&_[data-slot=overlay-arrow]]:fill-white [&_[data-slot=overlay-arrow]]:stroke-[#dedee0]" />
        <button
          type="button"
          aria-label="Fermer les indications du tableau"
          className="absolute right-[8px] top-[6px] flex h-[20px] w-[20px] items-center justify-center rounded-full text-[13px] text-[#64748b] hover:bg-[#eef6ff]"
          onClick={onDismiss}
        >
          x
        </button>
        <p className="pr-[18px]">Ici, tu peux réinitialiser le tableau.</p>
      </Tooltip.Content>
    </Tooltip.Root>
  );
}

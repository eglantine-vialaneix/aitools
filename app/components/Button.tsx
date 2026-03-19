import { Button as HeroUIButton, ButtonProps as HeroUIButtonProps } from "@heroui/react";
import { ReactNode } from "react";

type ButtonTone = "herbivore" | "carnivore" | "default";

export type ButtonProps = Omit<HeroUIButtonProps, "variant"> & {
  children?: ReactNode;
  variant?: ButtonTone;
  isActive?: boolean;
};

export function Button({
  children,
  variant = "default",
  isActive = false,
  className,
  ...props
}: ButtonProps) {
  const variantStyles = {
    herbivore: "bg-[#17c964] text-[#fcfcfc]",
    carnivore: "bg-[#ff383c] text-[#fcfcfc]",
    default: "bg-[#27272a] text-[#fcfcfc]",
  };

  return (
    <HeroUIButton
      variant="primary"
      className={`
        content-stretch flex items-center justify-center px-[16px] py-[11px] 
        rounded-[22px] max-h-[40px] min-h-[40px] w-full gap-[8px]
        font-['Inter:Medium',sans-serif] font-medium text-[24px] leading-[32px]
        transition-all duration-200
        ${variantStyles[variant]}
        ${isActive ? "scale-[1.02] shadow-[0_0_0_3px_rgba(24,24,27,0.14)]" : ""}
        ${className || ""}
      `}
      {...props}
    >
      {children}
    </HeroUIButton>
  );
}

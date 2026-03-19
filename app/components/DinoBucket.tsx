import { ComponentPropsWithoutRef, ReactNode } from "react";

export type DinoBucketProps = ComponentPropsWithoutRef<"div"> & {
  children?: ReactNode;
  isActive?: boolean;
};

export function DinoBucket({ children, className = "", isActive = false, style, ...props }: DinoBucketProps) {
  return (
    <div
      className={`bg-[#f5f5f5] border border-[#dedee0] border-solid relative w-full h-full overflow-hidden ${className}`}
      style={{
        borderRadius: "24px",
        backgroundColor: "var(--background/background, #f5f5f5)",
        borderColor: isActive ? "#18181b" : "var(--border, #dedee0)",
        boxShadow: isActive ? "0 0 0 3px rgba(24, 24, 27, 0.12)" : undefined,
        transition: "border-color 200ms ease, box-shadow 200ms ease",
        ...style,
      }}
      {...props}
    >
      <div className="absolute inset-0 pointer-events-none rounded-[inherit] shadow-[inset_-7px_7px_4px_0px_rgba(0,0,0,0.25)]" />
      <div className="relative z-10 grid h-full w-full grid-cols-5 auto-rows-min content-start gap-x-[10px] gap-y-[10px] overflow-hidden pl-[20px] pr-[60px] py-[20px]">
        {children}
      </div>
    </div>
  );
}

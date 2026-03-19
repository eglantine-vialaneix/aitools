export type SeparatorProps = {
  label?: string;
  className?: string;
};

export function Separator({ label = "OR", className = "" }: SeparatorProps) {
  return (
    <div 
      className={`content-stretch flex h-[12px] items-center justify-center max-h-[12px] relative shrink-0 w-full gap-[8px] ${className}`}
      style={{ borderRadius: "var(--dimensions/radius/rounded-sm, 4px)" }}
    >
      <hr className="flex-[1_0_0] border-0 border-t border-[var(--border,#dedee0)]" />
      <div className="content-stretch flex items-center justify-center px-[12px] relative shrink-0">
        <p className="font-[family-name:var(--font,'Inter:Medium',sans-serif)] font-[var(--font-medium,normal)] font-medium leading-[1.34] relative shrink-0 text-[16px] whitespace-nowrap"
          style={{ color: "var(--foreground/muted, #71717a)" }}
        >
          {label}
        </p>
      </div>
      <hr className="flex-[1_0_0] border-0 border-t border-[var(--border,#dedee0)]" />
    </div>
  );
}

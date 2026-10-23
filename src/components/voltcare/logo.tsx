import { cn } from "@/lib/utils";

/**
 * Voltcare wordmark — official brand colors.
 * V=red, O,L,T=black, C=yellow, A,R=black, E=blue
 */
const LETTERS = [
  { c: "V", color: "var(--brand-red)" },
  { c: "O", color: "currentColor" },
  { c: "L", color: "currentColor" },
  { c: "T", color: "currentColor" },
  { c: "C", color: "var(--brand-yellow)" },
  { c: "A", color: "currentColor" },
  { c: "R", color: "currentColor" },
  { c: "E", color: "var(--brand-blue)" },
];

function Word({ taglineClass }: { taglineClass: string }) {
  return (
    <>
      <div className="flex items-baseline gap-[1px] font-black tracking-[0.02em] text-[22px]">
        {LETTERS.map((l, i) => (
          <span key={i} style={{ color: l.color }}>{l.c}</span>
        ))}
      </div>
      <div className={cn("mt-1 text-[9px] font-semibold tracking-[0.25em]", taglineClass)}>
        ELECTRICAL SOLUTIONS
      </div>
    </>
  );
}

/** Dark background (sidebar) — non-brand letters render white. */
export function VoltcareLogo({ className, showTagline = true }: { className?: string; showTagline?: boolean }) {
  return (
    <div className={cn("flex flex-col leading-none text-white", className)}>
      <div className="flex items-baseline gap-[1px] font-black tracking-[0.02em] text-[22px]">
        {LETTERS.map((l, i) => (
          <span key={i} style={{ color: l.color }}>{l.c}</span>
        ))}
      </div>
      {showTagline && (
        <div className="mt-1 text-[9px] font-semibold tracking-[0.25em] text-white/70">
          ELECTRICAL SOLUTIONS
        </div>
      )}
    </div>
  );
}

/** Light background (documents, print) — non-brand letters render black. */
export function VoltcareLogoLight({ className, showTagline = true }: { className?: string; showTagline?: boolean }) {
  return (
    <div className={cn("flex flex-col leading-none text-black", className)}>
      <Word taglineClass="text-muted-foreground" />
      {!showTagline && null}
    </div>
  );
}

export function VoltcareMark({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-8 w-8 items-center justify-center rounded-md bg-primary text-white font-black", className)}>
      V
    </div>
  );
}

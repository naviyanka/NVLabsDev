import type { ReactNode } from "react";

export function NxCard({
  eyebrow, title, right, children, className = "",
}: { eyebrow?: string; title?: string; right?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={"nx-card p-5 " + className}>
      {(eyebrow || title || right) && (
        <header className="flex items-start justify-between gap-3 pb-4">
          <div>
            {eyebrow && <div className="eyebrow pb-1">{eyebrow}</div>}
            {title && <div className="display text-[15px] font-semibold text-[var(--text)]">{title}</div>}
          </div>
          {right && <div className="shrink-0">{right}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

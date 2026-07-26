import type { ReactNode } from "react";

export function PageHeader({
  eyebrow, title, subtitle, right,
}: { eyebrow?: string; title: string; subtitle?: string; right?: ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 pb-6">
      <div>
        {eyebrow && <div className="eyebrow pb-1.5">{eyebrow}</div>}
        <h1 className="display text-[26px] font-bold text-[var(--text)]">{title}</h1>
        {subtitle && <p className="pt-1 text-[13px] text-[var(--text-sub)]">{subtitle}</p>}
      </div>
      {right && <div className="flex shrink-0 items-center gap-2">{right}</div>}
    </div>
  );
}

export function PageWrapper({ children }: { children: ReactNode }) {
  return <div className="px-7 py-6">{children}</div>;
}

export function SectionEyebrow({ children }: { children: ReactNode }) {
  return <div className="eyebrow pb-2">{children}</div>;
}

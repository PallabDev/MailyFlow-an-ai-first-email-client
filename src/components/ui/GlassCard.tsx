import type { ReactNode } from "react";

export default function GlassCard({
  children,
  className = "",
  hover = false,
}: {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border border-line bg-surface shadow-[0_1px_2px_rgba(17,24,39,0.04)] ${
        hover
          ? "transition-all duration-300 hover:-translate-y-1 hover:border-line-strong hover:shadow-[0_18px_40px_-18px_rgba(17,24,39,0.22)]"
          : ""
      } ${className}`}
    >
      {children}
    </div>
  );
}

import { useRef, useState } from "react";
import type { ButtonHTMLAttributes, ReactNode } from "react";

type Variant = "primary" | "secondary" | "ghost";

interface Props extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  glow?: boolean;
  magnetic?: boolean;
  children: ReactNode;
}

const base =
  "relative inline-flex items-center justify-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all duration-200 select-none";

const variants: Record<Variant, string> = {
  primary: "bg-accent text-white hover:brightness-[1.08] shadow-sm",
  secondary: "bg-surface text-text border border-line hover:border-line-strong",
  ghost: "text-text hover:bg-surface2",
};

export default function Button({
  variant = "primary",
  glow = false,
  magnetic = false,
  className = "",
  children,
  ...rest
}: Props) {
  const ref = useRef<HTMLButtonElement>(null);
  const [t, setT] = useState({ x: 0, y: 0 });

  const onMove = (e: React.MouseEvent) => {
    if (!magnetic || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width - 0.5) * 10;
    const y = ((e.clientY - r.top) / r.height - 0.5) * 10;
    setT({ x, y });
  };

  return (
    <button
      ref={ref}
      onMouseMove={onMove}
      onMouseLeave={() => setT({ x: 0, y: 0 })}
      className={`${base} ${variants[variant]} ${className}`}
      style={{ transform: `translate(${t.x}px, ${t.y}px)` }}
      {...rest}
    >
      {glow && (
        <span
          aria-hidden
          className="animate-glow pointer-events-none absolute -inset-1 -z-10 rounded-xl blur-md"
          style={{ background: "var(--glow)" }}
        />
      )}
      {children}
    </button>
  );
}

import { ReactNode } from "react";
import { C } from "../data/design";

type PrimaryProps = {
  onClick?: () => void;
  children: ReactNode;
  color?: "main" | "mint";
  disabled?: boolean;
  type?: "button" | "submit";
};

export function PrimaryBtn({ onClick, children, color = "main", disabled, type = "button" }: PrimaryProps) {
  const bg = color === "mint" ? C.success : C.primary;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3.5 rounded-xl font-semibold text-white text-[15px] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: bg }}
    >
      {children}
    </button>
  );
}

type SecondaryProps = {
  onClick?: () => void;
  children: ReactNode;
  disabled?: boolean;
};

export function SecondaryBtn({ onClick, children, disabled }: SecondaryProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-full py-3.5 rounded-xl font-semibold text-[14px] transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
      style={{ background: C.surfaceHi, color: C.text, border: `1px solid ${C.border}` }}
    >
      {children}
    </button>
  );
}

type GhostProps = {
  onClick?: () => void;
  children: ReactNode;
};

export function GhostBtn({ onClick, children }: GhostProps) {
  return (
    <button
      onClick={onClick}
      className="w-full py-3 text-sm font-medium transition-colors"
      style={{ color: C.textL }}
    >
      {children}
    </button>
  );
}

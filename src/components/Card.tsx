import { ReactNode } from "react";
import { C } from "../data/design";

type Props = {
  children: ReactNode;
  className?: string;
};

export function Card({ children, className = "" }: Props) {
  return (
    <div
      className={`max-w-md w-full rounded-2xl ${className}`}
      style={{
        background: C.surface,
        border: `1px solid ${C.border}`,
        boxShadow: "0 8px 30px rgba(0,0,0,0.35)",
        color: C.text,
      }}
    >
      {children}
    </div>
  );
}

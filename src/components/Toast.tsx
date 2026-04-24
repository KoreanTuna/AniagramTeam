import { useEffect } from "react";
import { C } from "../data/design";

export function Toast({ message, onHide }: { message: string; onHide: () => void }) {
  useEffect(() => {
    if (!message) return;
    const t = setTimeout(onHide, 2000);
    return () => clearTimeout(t);
  }, [message, onHide]);

  if (!message) return null;
  return (
    <div
      className="fixed bottom-6 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-sm font-medium shadow-lg z-50"
      style={{
        background: C.surfaceActive,
        color: C.text,
        border: `1px solid ${C.border}`,
      }}
    >
      {message}
    </div>
  );
}

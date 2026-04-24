import { TypeId } from "../types";
import { TYPES } from "../data/enneagram";
import { PixelAnimal } from "./PixelAnimal";

type Size = "xs" | "sm" | "md" | "lg";

const SIZE_CLASS: Record<Size, string> = {
  xs: "w-8 h-8",
  sm: "w-10 h-10",
  md: "w-14 h-14",
  lg: "w-20 h-20",
};

const SIZE_PX: Record<Size, number> = {
  xs: 28,
  sm: 36,
  md: 50,
  lg: 72,
};

export function TypeBadge({ type, size = "md" }: { type: TypeId; size?: Size }) {
  const T = TYPES[type];
  return (
    <div
      className={`${SIZE_CLASS[size]} rounded-xl flex items-center justify-center flex-shrink-0 overflow-hidden`}
      style={{ background: T.bg, border: `1px solid ${T.color}33` }}
      aria-label={`${type}번 ${T.name}`}
      title={`${type}번 ${T.name}`}
    >
      <PixelAnimal type={type} size={SIZE_PX[size]} hopping={false} />
    </div>
  );
}

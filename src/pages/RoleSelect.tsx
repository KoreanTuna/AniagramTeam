import { useNavigate } from "react-router-dom";
import { Card } from "../components/Card";
import { PixelIcon, IconName } from "../components/PixelIcon";
import { bgStyle, C } from "../data/design";
import { ROLE_LABELS } from "../data/enneagram";
import { Role } from "../types";

const ORDER: Role[] = ["engineer", "designer", "pm", "planner", "marketer", "data", "sales", "hr", "other"];

const ROLE_ICON: Record<Role, IconName> = {
  engineer: "laptop",
  designer: "palette",
  pm: "chart",
  planner: "clipboard",
  marketer: "megaphone",
  data: "chart-line",
  sales: "trophy",
  hr: "team",
  other: "sprout",
};

export function RoleSelect() {
  const nav = useNavigate();

  const pick = (role: Role) => {
    nav("/quiz", { state: { role } });
  };

  return (
    <div style={bgStyle} className="flex items-center justify-center p-4 sm:p-6">
      <Card className="p-6 sm:p-8">
        <button
          onClick={() => nav("/")}
          className="text-xs mb-3"
          style={{ color: C.textL }}
        >
          ← 홈으로
        </button>
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center mb-3">
            <PixelIcon name="target" size={40} color={C.primary} accent={C.peachA} />
          </div>
          <div
            className="text-[10px] tracking-[0.18em] font-bold mb-1"
            style={{ color: C.textL, fontFamily: "ui-monospace, Menlo, monospace" }}
          >
            SELECT YOUR ROLE
          </div>
          <h1 className="text-xl sm:text-2xl font-bold mb-2" style={{ color: C.text }}>
            내 직무는?
          </h1>
          <p className="text-sm" style={{ color: C.textL }}>
            직무에 맞는 상황 질문으로 더 정확하게 분석해요
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {ORDER.map((role) => {
            const { label } = ROLE_LABELS[role];
            return (
              <button
                key={role}
                onClick={() => pick(role)}
                className="flex flex-col items-center gap-2 py-5 rounded-xl transition-all active:scale-[0.97]"
                style={{
                  background: C.surfaceHi,
                  border: `1px solid ${C.border}`,
                  color: C.text,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = C.surfaceActive;
                  e.currentTarget.style.borderColor = C.primary;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = C.surfaceHi;
                  e.currentTarget.style.borderColor = C.border;
                }}
              >
                <PixelIcon name={ROLE_ICON[role]} size={32} color={C.text} accent={C.primary} />
                <span className="text-sm font-bold">{label}</span>
              </button>
            );
          })}
        </div>
      </Card>
    </div>
  );
}

import { useState } from "react";
import { useAuth } from "../lib/auth";
import { C } from "../data/design";
import { ConfirmModal } from "./ConfirmModal";

export function Header() {
  const { user, isGoogleAuthed, signOutGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (!isGoogleAuthed || !user) return null;

  const label = user.displayName?.trim() || user.email || "로그인됨";
  const photo = user.photoURL ?? "";

  const doLogout = async () => {
    setShowConfirm(false);
    setBusy(true);
    try {
      await signOutGoogle();
    } catch (e) {
      console.error("로그아웃 실패", e);
      setBusy(false);
    }
  };

  return (
    <header
      className="fixed top-0 right-0 z-20 p-3 sm:p-4 flex items-center gap-2"
      style={{
        fontFamily: "ui-monospace, Menlo, monospace",
        letterSpacing: "0.03em",
      }}
    >
      <div
        className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-full"
        style={{
          background: "rgba(28,36,49,0.75)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          border: `1px solid ${C.border}`,
        }}
      >
        {photo ? (
          <img
            src={photo}
            alt=""
            referrerPolicy="no-referrer"
            className="w-6 h-6 rounded-full"
            style={{ border: `1px solid ${C.border}` }}
          />
        ) : (
          <div
            className="w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold"
            style={{ background: C.primarySoft, color: C.primaryHi }}
          >
            {(label[0] ?? "?").toUpperCase()}
          </div>
        )}
        <span
          className="text-[11px] max-w-[120px] truncate"
          style={{ color: C.textL }}
          title={label}
        >
          {label}
        </span>
        <button
          onClick={() => !busy && setShowConfirm(true)}
          disabled={busy}
          className="text-[10px] font-semibold px-2 py-1 rounded-full transition-colors disabled:opacity-50"
          style={{
            background: "transparent",
            color: C.textL,
            border: `1px solid ${C.borderStrong}`,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = C.text;
            e.currentTarget.style.background = C.surfaceActive;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = C.textL;
            e.currentTarget.style.background = "transparent";
          }}
        >
          {busy ? "..." : "로그아웃"}
        </button>
      </div>
      <ConfirmModal
        open={showConfirm}
        title="로그아웃할까요?"
        description="로그아웃하면 새 익명 계정으로 전환돼요. 팀에 다시 접근하려면 같은 Google 계정으로 로그인해야 해요."
        confirmLabel="로그아웃"
        danger
        onCancel={() => setShowConfirm(false)}
        onConfirm={doLogout}
      />
    </header>
  );
}

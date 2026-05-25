import { useEffect } from "react";
import { createPortal } from "react-dom";
import { LogOut, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen, title, description, confirmLabel = "Confirmar", onConfirm, onCancel,
}: Props) {
  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") onCancel(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [isOpen, onCancel]);

  const dialog = (
    <>
      <div
        aria-hidden
        onClick={onCancel}
        style={{
          position: "fixed", inset: 0, zIndex: 60,
          background: "oklch(0.1 0.02 270 / 0.75)",
          backdropFilter: "blur(6px)",
          opacity: isOpen ? 1 : 0,
          pointerEvents: isOpen ? "auto" : "none",
          transition: "opacity 0.22s ease",
        }}
      />
      <div
        onClick={onCancel}
        style={{
          position: "fixed", inset: 0, zIndex: 70,
          display: "flex", alignItems: "center", justifyContent: "center",
          padding: "1rem",
          pointerEvents: isOpen ? "auto" : "none",
        }}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%", maxWidth: 360,
            opacity: isOpen ? 1 : 0,
            transform: isOpen ? "translateY(0) scale(1)" : "translateY(14px) scale(0.95)",
            transition: "opacity 0.24s ease, transform 0.24s cubic-bezier(0.34,1.3,0.64,1)",
          }}
        >
          <div className="glass rounded-2xl p-6 shadow-glow">
            <div className="flex items-start justify-between mb-4">
              <div className="w-10 h-10 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center justify-center">
                <LogOut className="w-4 h-4 text-destructive" />
              </div>
              <button
                onClick={onCancel}
                className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-card/80 transition-smooth"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="mb-5">
              <h3 className="text-base font-bold mb-1.5">{title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="flex-1 py-2.5 rounded-xl glass text-sm font-medium hover:bg-card transition-smooth"
              >
                Cancelar
              </button>
              <button
                onClick={onConfirm}
                className="flex-1 py-2.5 rounded-xl bg-destructive/90 text-destructive-foreground text-sm font-semibold hover:bg-destructive transition-smooth"
              >
                {confirmLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );

  return createPortal(dialog, document.body);
}

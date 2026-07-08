"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

export interface FormulaArg {
  ref: string;
  color: string;
}

const QUICK_FORMULAS = [
  { fn: "SUMA", label: "Suma" },
  { fn: "PROMEDIO", label: "Promedio" },
  { fn: "MIN", label: "Mínimo" },
  { fn: "MAX", label: "Máximo" },
  { fn: "CONTAR", label: "Contar" },
] as const;

interface FormulaPanelProps {
  open: boolean;
  targetRef: string | null;
  fn: string | null;
  args: FormulaArg[];
  onPickFn: (fn: string) => void;
  onRemoveArg: (index: number) => void;
  onAccept: () => void;
  onCancel: () => void;
}

export default function FormulaPanel({
  open, targetRef, fn, args, onPickFn, onRemoveArg, onAccept, onCancel,
}: FormulaPanelProps) {
  // Enter acepta / Escape cancela sin importar qué elemento tenga el foco
  // (igual que el Esc de PageSettingsPanel en Word).
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancel();
      } else if (e.key === "Enter" && fn) {
        e.preventDefault();
        onAccept();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, fn, onAccept, onCancel]);

  const formulaText = fn ? `=${fn}(${args.map((a) => a.ref).join(",")})` : "";

  return (
    <div
      className="fixed top-0 right-0 h-full w-72 z-50 overflow-y-auto"
      style={{
        backgroundColor: "#FFFFFF",
        borderLeft: "1px solid #D8E2FA",
        boxShadow: "-4px 0 32px rgba(89,101,242,0.14)",
        transform: open ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{ borderBottom: "1px solid #D8E2FA", backgroundColor: "#EEF2FF" }}
      >
        <span className="text-sm font-semibold" style={{ color: "#173B6C" }}>
          Insertar fórmula{targetRef ? ` — ${targetRef}` : ""}
        </span>
        <button
          onClick={onCancel}
          className="flex items-center justify-center w-6 h-6 rounded transition-colors"
          style={{ color: "#5B7093" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8E2FA")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-4">
        {/* ── Funciones ──────────────────────────────────────── */}
        <section>
          <p className="text-xs mb-1.5" style={{ color: "#5B7093" }}>
            Función
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {QUICK_FORMULAS.map(({ fn: f, label }) => {
              const active = fn === f;
              return (
                <button
                  key={f}
                  onClick={() => onPickFn(f)}
                  className="py-2 rounded border text-sm transition-colors"
                  style={{
                    backgroundColor: active ? "#EEF2FF" : "#FFFFFF",
                    borderColor: active ? "#3B82F6" : "#D8E2FA",
                    color: active ? "#3B82F6" : "#173B6C",
                    fontWeight: active ? 600 : 400,
                  }}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </section>

        {fn && (
          <>
            {/* ── Fórmula en construcción ──────────────────────── */}
            <section>
              <p className="text-xs mb-1.5" style={{ color: "#5B7093" }}>
                Fórmula
              </p>
              <div
                className="text-sm px-3 py-2 rounded border font-mono break-all"
                style={{ color: "#173B6C", backgroundColor: "#EEF2FF", borderColor: "#D8E2FA" }}
              >
                {formulaText || `=${fn}()`}
              </div>
            </section>

            {/* ── Celdas seleccionadas ──────────────────────────── */}
            <section>
              <p className="text-xs mb-1.5" style={{ color: "#5B7093" }}>
                Haz clic (o arrastra para un rango) en la hoja
              </p>
              {args.length === 0 ? (
                <p className="text-xs italic" style={{ color: "#B0BCDA" }}>
                  Ninguna celda seleccionada todavía.
                </p>
              ) : (
                <div className="flex flex-col gap-1">
                  {args.map((a, i) => (
                    <div
                      key={`${a.ref}-${i}`}
                      className="flex items-center justify-between px-2 py-1 rounded text-xs"
                      style={{ backgroundColor: "#EEF2FF", border: `1px solid ${a.color}` }}
                    >
                      <span style={{ color: a.color, fontWeight: 600 }}>{a.ref}</span>
                      <button
                        onClick={() => onRemoveArg(i)}
                        style={{ color: "#5B7093" }}
                        className="ml-2"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <button
              onClick={onAccept}
              className="w-full py-2 rounded text-sm font-semibold transition-colors"
              style={{ backgroundColor: "#3B82F6", color: "#FFFFFF" }}
            >
              Aceptar
            </button>
          </>
        )}

        <p className="text-xs text-center pb-2" style={{ color: "#5B7093" }}>
          Presiona{" "}
          <kbd className="px-1 rounded" style={{ backgroundColor: "#EEF2FF", border: "1px solid #D8E2FA" }}>Enter</kbd>
          {" "}para aceptar,{" "}
          <kbd className="px-1 rounded" style={{ backgroundColor: "#EEF2FF", border: "1px solid #D8E2FA" }}>Esc</kbd>
          {" "}para cancelar
        </p>
      </div>
    </div>
  );
}

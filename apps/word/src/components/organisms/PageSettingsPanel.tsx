"use client";

import { useEffect } from "react";
import { X, Minus, Plus, Clipboard, ClipboardX } from "lucide-react";
import { usePageSettings, PageSettings } from "@/context/PageSettingsContext";
import { useEditorContext } from "@/context/EditorContext";
import { pasteWithFormat, pasteWithoutFormat } from "@/components/molecules/PasteGroup";

// mm → px ratio for A4 preview (80×113px box represents 210×297mm)
const PX_H = 80 / 210;
const PX_V = 113 / 297;

const LINE_HEIGHTS: { value: string; label: string; sub: string }[] = [
  { value: "1.0",  label: "1.0",  sub: "Simple"  },
  { value: "1.15", label: "1.15", sub: "Normal"  },
  { value: "1.5",  label: "1.5",  sub: "1½ líneas" },
  { value: "2.0",  label: "2.0",  sub: "Doble"   },
  { value: "2.5",  label: "2.5",  sub: "2½"      },
  { value: "3.0",  label: "3.0",  sub: "Triple"  },
];

/* ── Sub-components ─────────────────────────────────────────────────────── */

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span
        className="text-xs font-semibold tracking-widest uppercase shrink-0"
        style={{ color: "#5B7093" }}
      >
        {children}
      </span>
      <div className="flex-1 h-px" style={{ backgroundColor: "#D8E2FA" }} />
    </div>
  );
}

function MarginInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <label className="text-xs" style={{ color: "#5B7093" }}>
        {label}
      </label>
      <div className="flex items-center gap-1">
        <input
          type="number"
          min={5}
          max={30}
          value={value}
          onChange={(e) =>
            onChange(Math.max(5, Math.min(30, Number(e.target.value))))
          }
          className="w-14 h-7 text-sm text-center rounded border focus:outline-none"
          style={{ color: "#173B6C", backgroundColor: "#EEF2FF", borderColor: "#D8E2FA" }}
          onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
          onBlur={(e) => (e.currentTarget.style.borderColor = "#D8E2FA")}
        />
        <span className="text-xs" style={{ color: "#5B7093" }}>mm</span>
      </div>
    </div>
  );
}

function MarginPreview({ s }: { s: PageSettings }) {
  return (
    <div
      className="mx-auto mt-3 rounded border relative overflow-hidden"
      style={{ width: 80, height: 113, borderColor: "#D8E2FA", backgroundColor: "#FAFBFF" }}
    >
      {/* content area */}
      <div
        style={{
          position: "absolute",
          top:    `${s.marginTop    * PX_V}px`,
          bottom: `${s.marginBottom * PX_V}px`,
          left:   `${s.marginLeft   * PX_H}px`,
          right:  `${s.marginRight  * PX_H}px`,
          border: "1px dashed #3B82F6",
          backgroundColor: "rgba(59,130,246,0.06)",
        }}
      />
      {/* guide labels */}
      <span style={{ position:"absolute", top: 2, left:"50%", transform:"translateX(-50%)", fontSize:8, color:"#3B82F6" }}>
        {s.marginTop}
      </span>
      <span style={{ position:"absolute", bottom: 2, left:"50%", transform:"translateX(-50%)", fontSize:8, color:"#3B82F6" }}>
        {s.marginBottom}
      </span>
      <span style={{ position:"absolute", top:"50%", left: 2, transform:"translateY(-50%)", fontSize:8, color:"#7C4DFF" }}>
        {s.marginLeft}
      </span>
      <span style={{ position:"absolute", top:"50%", right: 2, transform:"translateY(-50%)", fontSize:8, color:"#7C4DFF" }}>
        {s.marginRight}
      </span>
    </div>
  );
}

function StyledTextarea({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <textarea
      value={value}
      onChange={(e) => onChange(e.target.value)}
      rows={2}
      placeholder={placeholder}
      className="w-full text-sm px-3 py-2 rounded border resize-none focus:outline-none"
      style={{ color: "#173B6C", backgroundColor: "#EEF2FF", borderColor: "#D8E2FA" }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#D8E2FA")}
    />
  );
}

/* ── Main panel ─────────────────────────────────────────────────────────── */

export default function PageSettingsPanel() {
  const { settings, update, panelOpen, setPanelOpen } = usePageSettings();
  const editor = useEditorContext();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setPanelOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [setPanelOpen]);

  return (
    <div
      className="fixed top-0 right-0 h-full w-72 z-50 overflow-y-auto"
      style={{
        backgroundColor: "#FFFFFF",
        borderLeft: "1px solid #D8E2FA",
        boxShadow: "-4px 0 32px rgba(89,101,242,0.14)",
        transform: panelOpen ? "translateX(0)" : "translateX(100%)",
        transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-3 sticky top-0 z-10"
        style={{ borderBottom: "1px solid #D8E2FA", backgroundColor: "#EEF2FF" }}
      >
        <span className="text-sm font-semibold" style={{ color: "#173B6C" }}>
          Configuración de página
        </span>
        <button
          onClick={() => setPanelOpen(false)}
          className="flex items-center justify-center w-6 h-6 rounded transition-colors"
          style={{ color: "#5B7093" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8E2FA")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <X size={14} />
        </button>
      </div>

      <div className="p-4 flex flex-col gap-6">

        {/* ── Portapapeles ───────────────────────────────────── */}
        <section>
          <SectionTitle>Portapapeles</SectionTitle>
          <div className="flex gap-2">
            <button
              onClick={() => editor && pasteWithFormat(editor)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded border text-sm transition-colors"
              style={{ color: "#173B6C", borderColor: "#D8E2FA", backgroundColor: "#EEF2FF" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D8E2FA")}
            >
              <Clipboard size={13} /> Pegar
            </button>
            <button
              onClick={() => editor && pasteWithoutFormat(editor)}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded border text-sm transition-colors"
              style={{ color: "#173B6C", borderColor: "#D8E2FA", backgroundColor: "#EEF2FF" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7C4DFF")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D8E2FA")}
            >
              <ClipboardX size={13} /> Sin formato
            </button>
          </div>
        </section>

        {/* ── Márgenes ───────────────────────────────────────── */}
        <section>
          <SectionTitle>Márgenes</SectionTitle>
          <div className="flex flex-col items-center gap-2">
            <MarginInput
              label="Superior"
              value={settings.marginTop}
              onChange={(v) => update({ marginTop: v })}
            />
            <div className="flex gap-6">
              <MarginInput
                label="Izquierdo"
                value={settings.marginLeft}
                onChange={(v) => update({ marginLeft: v })}
              />
              <MarginInput
                label="Derecho"
                value={settings.marginRight}
                onChange={(v) => update({ marginRight: v })}
              />
            </div>
            <MarginInput
              label="Inferior"
              value={settings.marginBottom}
              onChange={(v) => update({ marginBottom: v })}
            />
          </div>
          <MarginPreview s={settings} />
        </section>

        {/* ── Encabezado ─────────────────────────────────────── */}
        <section>
          <SectionTitle>Encabezado</SectionTitle>
          <StyledTextarea
            value={settings.header}
            onChange={(v) => update({ header: v })}
            placeholder="Texto del encabezado..."
          />
        </section>

        {/* ── Pie de página ──────────────────────────────────── */}
        <section>
          <SectionTitle>Pie de página</SectionTitle>
          <StyledTextarea
            value={settings.footer}
            onChange={(v) => update({ footer: v })}
            placeholder="Texto del pie de página..."
          />
        </section>

        {/* ── Interlineado ───────────────────────────────────── */}
        <section>
          <SectionTitle>Interlineado</SectionTitle>
          <div className="grid grid-cols-3 gap-1.5">
            {LINE_HEIGHTS.map(({ value, label, sub }) => {
              const active = settings.lineHeight === value;
              return (
                <button
                  key={value}
                  onClick={() => update({ lineHeight: value })}
                  className="flex flex-col items-center py-2 px-1 rounded border text-xs transition-colors"
                  style={{
                    backgroundColor: active ? "#EEF2FF" : "#fff",
                    borderColor:     active ? "#3B82F6" : "#D8E2FA",
                    color:           active ? "#3B82F6" : "#5B7093",
                    fontWeight:      active ? 600 : 400,
                  }}
                >
                  <span className="text-sm">{label}</span>
                  <span style={{ fontSize: 9 }}>{sub}</span>
                </button>
              );
            })}
          </div>
        </section>

        {/* ── Sangría ────────────────────────────────────────── */}
        <section>
          <SectionTitle>Sangría</SectionTitle>
          <div className="flex gap-2">
            <button
              onClick={() => editor?.chain().focus().outdent().run()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded border text-sm transition-colors"
              style={{ color: "#173B6C", borderColor: "#D8E2FA", backgroundColor: "#EEF2FF" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D8E2FA")}
            >
              <Minus size={13} /> Reducir
            </button>
            <button
              onClick={() => editor?.chain().focus().indent().run()}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded border text-sm transition-colors"
              style={{ color: "#173B6C", borderColor: "#D8E2FA", backgroundColor: "#EEF2FF" }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = "#7C4DFF")}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D8E2FA")}
            >
              <Plus size={13} /> Aumentar
            </button>
          </div>
          <p className="text-xs mt-2" style={{ color: "#5B7093" }}>
            Atajo:{" "}
            <kbd className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: "#EEF2FF", border: "1px solid #D8E2FA" }}>Tab</kbd>
            {" / "}
            <kbd className="px-1 py-0.5 rounded text-xs" style={{ backgroundColor: "#EEF2FF", border: "1px solid #D8E2FA" }}>Shift+Tab</kbd>
          </p>
        </section>

        <p className="text-xs text-center pb-2" style={{ color: "#5B7093" }}>
          Presiona{" "}
          <kbd className="px-1 rounded" style={{ backgroundColor: "#EEF2FF", border: "1px solid #D8E2FA" }}>Esc</kbd>
          {" "}para cerrar
        </p>
      </div>
    </div>
  );
}

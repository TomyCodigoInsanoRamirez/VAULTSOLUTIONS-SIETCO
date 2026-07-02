"use client";

import { useEffect, useRef, useState } from "react";
import { X, ChevronUp, ChevronDown, Search } from "lucide-react";
import { useEditorContext } from "@/context/EditorContext";
import { useSearch } from "@/context/SearchContext";

const INPUT_STYLE = {
  color: "#173B6C",
  backgroundColor: "#EEF2FF",
  border: "1px solid #D8E2FA",
};

function SearchInput({
  value,
  onChange,
  placeholder,
  accentColor = "#3B82F6",
  inputRef,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  accentColor?: string;
  inputRef?: React.RefObject<HTMLInputElement | null>;
}) {
  return (
    <input
      ref={inputRef}
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="flex-1 h-8 px-3 text-sm rounded focus:outline-none"
      style={INPUT_STYLE}
      onFocus={(e) => (e.currentTarget.style.borderColor = accentColor)}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#D8E2FA")}
    />
  );
}

export default function SearchPanel() {
  const { mode, close } = useSearch();
  const editor = useEditorContext();

  const [searchTerm, setSearchTerm]   = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [, forceUpdate] = useState(0);

  const searchRef = useRef<HTMLInputElement>(null);

  /* Subscribe to editor transactions so result counts stay in sync */
  useEffect(() => {
    if (!editor) return;
    const update = () => forceUpdate((n) => n + 1);
    editor.on("transaction", update);
    return () => { editor.off("transaction", update); };
  }, [editor]);

  /* Focus input & clear search when panel opens/closes */
  useEffect(() => {
    if (mode) {
      setTimeout(() => searchRef.current?.focus(), 60);
    } else {
      editor?.commands.clearSearch();
      setSearchTerm("");
      setReplaceTerm("");
    }
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Re-run search whenever the term changes */
  useEffect(() => {
    if (!editor) return;
    if (searchTerm.trim()) {
      editor.commands.search(searchTerm);
    } else {
      editor.commands.clearSearch();
    }
  }, [searchTerm, editor]);

  /* Keyboard shortcuts */
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!mode) return;
      if (e.key === "Escape") { close(); return; }
      if (e.key === "Enter" && e.shiftKey) {
        e.preventDefault();
        editor?.commands.prevMatch();
      } else if (e.key === "Enter") {
        editor?.commands.nextMatch();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [mode, close, editor]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const searchStorage = (editor?.storage as any)?.search;
  const results = (searchStorage?.results ?? []) as { from: number; to: number }[];
  const current = (searchStorage?.current ?? -1) as number;
  const count   = results.length;
  const hasMatch = current >= 0 && count > 0;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-50 rounded-xl overflow-hidden"
      style={{
        transform: "translateX(-50%)",
        minWidth: 400,
        backgroundColor: "#FFFFFF",
        border: "1px solid #D8E2FA",
        boxShadow: "0 8px 36px rgba(89,101,242,0.18)",
        opacity: mode ? 1 : 0,
        pointerEvents: mode ? "auto" : "none",
        transition: "opacity 0.18s ease, transform 0.18s ease",
        translate: mode ? "0 0" : "0 12px",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 py-2"
        style={{
          background: "linear-gradient(90deg, #3B82F6 0%, #7C4DFF 100%)",
          borderBottom: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <div className="flex items-center gap-2">
          <Search size={12} color="white" />
          <span className="text-xs font-semibold text-white">
            {mode === "replace" ? "Buscar y reemplazar" : "Buscar"}
          </span>
        </div>
        <button
          onClick={close}
          className="flex items-center justify-center w-5 h-5 rounded transition-colors"
          style={{ color: "rgba(255,255,255,0.8)" }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
        >
          <X size={12} />
        </button>
      </div>

      <div className="p-3 flex flex-col gap-2">

        {/* Search row */}
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Buscar en el documento..."
              inputRef={searchRef}
            />
            {/* Match counter badge */}
            {searchTerm && (
              <span
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs font-medium"
                style={{ color: count > 0 ? "#3B82F6" : "#5B7093" }}
              >
                {count > 0 ? `${current + 1} / ${count}` : "Sin resultados"}
              </span>
            )}
          </div>

          <button
            onClick={() => editor?.commands.prevMatch()}
            disabled={!hasMatch}
            title="Anterior (Shift+Enter)"
            className="flex items-center justify-center w-8 h-8 rounded border transition-colors shrink-0"
            style={{
              borderColor: "#D8E2FA",
              backgroundColor: "#EEF2FF",
              color: hasMatch ? "#173B6C" : "#D8E2FA",
              cursor: hasMatch ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => { if (hasMatch) e.currentTarget.style.borderColor = "#3B82F6"; }}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D8E2FA")}
          >
            <ChevronUp size={14} />
          </button>

          <button
            onClick={() => editor?.commands.nextMatch()}
            disabled={!hasMatch}
            title="Siguiente (Enter)"
            className="flex items-center justify-center w-8 h-8 rounded border transition-colors shrink-0"
            style={{
              borderColor: "#D8E2FA",
              backgroundColor: "#EEF2FF",
              color: hasMatch ? "#173B6C" : "#D8E2FA",
              cursor: hasMatch ? "pointer" : "not-allowed",
            }}
            onMouseEnter={(e) => { if (hasMatch) e.currentTarget.style.borderColor = "#7C4DFF"; }}
            onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D8E2FA")}
          >
            <ChevronDown size={14} />
          </button>
        </div>

        {/* Replace row */}
        {mode === "replace" && (
          <div className="flex items-center gap-2">
            <SearchInput
              value={replaceTerm}
              onChange={setReplaceTerm}
              placeholder="Reemplazar con..."
              accentColor="#7C4DFF"
            />
            <button
              onClick={() => editor?.commands.replaceOne(replaceTerm)}
              disabled={!hasMatch}
              className="px-3 h-8 text-xs rounded border font-medium whitespace-nowrap shrink-0 transition-colors"
              style={{
                color: hasMatch ? "#5965F2" : "#5B7093",
                borderColor: "#D8E2FA",
                backgroundColor: "#EEF2FF",
                cursor: hasMatch ? "pointer" : "not-allowed",
              }}
              onMouseEnter={(e) => { if (hasMatch) e.currentTarget.style.borderColor = "#5965F2"; }}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = "#D8E2FA")}
            >
              Reemplazar
            </button>
            <button
              onClick={() => {
                editor?.commands.replaceAll(replaceTerm);
                setSearchTerm("");
              }}
              disabled={count === 0}
              className="px-3 h-8 text-xs rounded font-semibold whitespace-nowrap shrink-0 text-white transition-opacity"
              style={{
                background:
                  count > 0
                    ? "linear-gradient(90deg, #3B82F6, #7C4DFF)"
                    : "#D8E2FA",
                cursor: count > 0 ? "pointer" : "not-allowed",
                border: "none",
              }}
            >
              Todo
            </button>
          </div>
        )}

        {/* Summary line */}
        {searchTerm && (
          <p className="text-xs" style={{ color: "#5B7093" }}>
            {count > 0
              ? `${count} coincidencia${count !== 1 ? "s" : ""} — Enter para siguiente, Shift+Enter para anterior`
              : "No se encontraron coincidencias"}
          </p>
        )}
      </div>
    </div>
  );
}

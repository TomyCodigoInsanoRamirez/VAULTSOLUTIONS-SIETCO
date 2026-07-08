"use client";

import { useRef, useState } from "react";
import { Plus, X } from "lucide-react";
import { useSpreadsheet } from "@/context/SpreadsheetContext";

export default function SheetTabs() {
  const { sheets, activeSheetId, setActiveSheet, addSheet, removeSheet, renameSheet } = useSpreadsheet();
  const [editingId, setEditingId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = (id: string) => {
    setEditingId(id);
    requestAnimationFrame(() => {
      inputRef.current?.select();
      inputRef.current?.focus();
    });
  };

  return (
    <div
      className="flex items-center gap-1 px-2 py-1 shrink-0 overflow-x-auto border-t"
      style={{ backgroundColor: "#EEF2FF", borderColor: "#D8E2FA" }}
    >
      {sheets.map((sheet) => {
        const active = sheet.id === activeSheetId;
        return (
          <div
            key={sheet.id}
            onClick={() => setActiveSheet(sheet.id)}
            onDoubleClick={() => startRename(sheet.id)}
            className="flex items-center gap-1.5 px-3 py-1 rounded text-xs cursor-pointer select-none shrink-0"
            style={{
              backgroundColor: active ? "#FFFFFF" : "transparent",
              color: active ? "#3B82F6" : "#173B6C",
              border: `1px solid ${active ? "#D8E2FA" : "transparent"}`,
              fontWeight: active ? 600 : 400,
            }}
          >
            {editingId === sheet.id ? (
              <input
                ref={inputRef}
                defaultValue={sheet.name}
                onClick={(e) => e.stopPropagation()}
                onBlur={(e) => {
                  renameSheet(sheet.id, e.target.value.trim() || sheet.name);
                  setEditingId(null);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  if (e.key === "Escape") setEditingId(null);
                }}
                className="text-xs bg-transparent outline-none border-b"
                style={{ borderColor: "#3B82F6", width: 80 }}
              />
            ) : (
              <span>{sheet.name}</span>
            )}
            {sheets.length > 1 && (
              <button
                type="button"
                title="Eliminar hoja"
                onClick={(e) => { e.stopPropagation(); removeSheet(sheet.id); }}
                className="flex items-center justify-center rounded-full"
                style={{ width: 14, height: 14, color: "#5B7093" }}
              >
                <X size={11} />
              </button>
            )}
          </div>
        );
      })}
      <button
        type="button"
        title="Agregar hoja"
        onClick={addSheet}
        className="flex items-center justify-center w-6 h-6 rounded shrink-0"
        style={{ color: "#173B6C" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8E2FA")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

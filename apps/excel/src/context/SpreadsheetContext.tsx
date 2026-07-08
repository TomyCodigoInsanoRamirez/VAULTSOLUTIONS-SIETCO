"use client";

import { createContext, useContext, useMemo, useRef, useState, ReactNode } from "react";
import { computeSheet, ComputedValue } from "@/lib/spreadsheet/formulaEngine";
import { formatCellRef, parseCellRef } from "@/lib/spreadsheet/reference";

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strike?: boolean;
  align?: "left" | "center" | "right" | "justify";
  color?: string;
  bg?: string;
  fontFamily?: string;
  fontSize?: string;
}

export interface CellData {
  raw: string;
  style?: CellStyle;
}

export interface SheetData {
  id: string;
  name: string;
  rowCount: number;
  colCount: number;
  cells: Record<string, CellData>;
  colWidths: Record<number, number>;
}

const DEFAULT_ROWS = 30;
const DEFAULT_COLS = 12;
export const DEFAULT_COL_WIDTH = 96;

function createSheet(id: string, name: string): SheetData {
  return { id, name, rowCount: DEFAULT_ROWS, colCount: DEFAULT_COLS, cells: {}, colWidths: {} };
}

function nextSheetName(existing: SheetData[]): string {
  let n = existing.length + 1;
  let name = `Hoja${n}`;
  while (existing.some((s) => s.name === name)) {
    n++;
    name = `Hoja${n}`;
  }
  return name;
}

interface SpreadsheetCtxType {
  sheets: SheetData[];
  activeSheetId: string;
  activeSheet: SheetData;
  activeCell: string | null;
  computedValues: Record<string, ComputedValue>;

  addSheet: () => void;
  removeSheet: (id: string) => void;
  renameSheet: (id: string, name: string) => void;
  setActiveSheet: (id: string) => void;
  setActiveCell: (ref: string | null) => void;

  setCellRaw: (ref: string, raw: string) => void;
  setCellStyle: (ref: string, patch: Partial<CellStyle>) => void;

  insertRow: (beforeIndex: number) => void;
  deleteRow: (index: number) => void;
  insertColumn: (beforeIndex: number) => void;
  deleteColumn: (index: number) => void;
  resizeColumn: (index: number, width: number) => void;
  getColWidth: (index: number) => number;
}

const SpreadsheetCtx = createContext<SpreadsheetCtxType | null>(null);

export function SpreadsheetProvider({ children }: { children: ReactNode }) {
  const [sheets, setSheets] = useState<SheetData[]>(() => [createSheet("sheet-1", "Hoja1")]);
  const [activeSheetId, setActiveSheetId] = useState("sheet-1");
  const [activeCell, setActiveCellState] = useState<string | null>(null);
  const nextId = useRef(2);

  const activeSheet = sheets.find((s) => s.id === activeSheetId) ?? sheets[0];

  const updateActiveSheet = (fn: (sheet: SheetData) => SheetData) => {
    setSheets((prev) => prev.map((s) => (s.id === activeSheetId ? fn(s) : s)));
  };

  const addSheet = () => {
    const id = `sheet-${nextId.current++}`;
    const name = nextSheetName(sheets);
    setSheets((prev) => [...prev, createSheet(id, name)]);
    setActiveSheetId(id);
    setActiveCellState(null);
  };

  const removeSheet = (id: string) => {
    if (sheets.length <= 1) return;
    if (typeof window !== "undefined" && !window.confirm("¿Eliminar esta hoja? Esta acción no se puede deshacer.")) {
      return;
    }
    setSheets((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeSheetId === id) {
        setActiveSheetId(next[0].id);
        setActiveCellState(null);
      }
      return next;
    });
  };

  const renameSheet = (id: string, name: string) => {
    setSheets((prev) => prev.map((s) => (s.id === id ? { ...s, name } : s)));
  };

  const setActiveSheet = (id: string) => {
    setActiveSheetId(id);
    setActiveCellState(null);
  };

  const setActiveCell = (ref: string | null) => setActiveCellState(ref);

  const setCellRaw = (ref: string, raw: string) => {
    updateActiveSheet((sheet) => {
      const cells = { ...sheet.cells };
      if (raw === "") {
        const existing = cells[ref];
        if (existing?.style) cells[ref] = { raw: "", style: existing.style };
        else delete cells[ref];
      } else {
        cells[ref] = { ...cells[ref], raw };
      }
      return { ...sheet, cells };
    });
  };

  const setCellStyle = (ref: string, patch: Partial<CellStyle>) => {
    updateActiveSheet((sheet) => {
      const cells = { ...sheet.cells };
      const existing = cells[ref] ?? { raw: "" };
      cells[ref] = { ...existing, style: { ...existing.style, ...patch } };
      return { ...sheet, cells };
    });
  };

  // Las operaciones estructurales desplazan los DATOS de las celdas para que
  // los valores no salten de posición visual. NO reescriben el texto de
  // fórmulas en otras celdas — si una fórmula en otra celda apunta a una fila
  // o columna desplazada, seguirá apuntando ahí literalmente.
  const insertRow = (beforeIndex: number) => {
    updateActiveSheet((sheet) => {
      const cells: Record<string, CellData> = {};
      for (const [ref, data] of Object.entries(sheet.cells)) {
        const parsed = parseCellRef(ref);
        if (!parsed) continue;
        const newRow = parsed.row >= beforeIndex ? parsed.row + 1 : parsed.row;
        cells[formatCellRef(parsed.col, newRow)] = data;
      }
      return { ...sheet, cells, rowCount: sheet.rowCount + 1 };
    });
  };

  const deleteRow = (index: number) => {
    updateActiveSheet((sheet) => {
      if (sheet.rowCount <= 1) return sheet;
      const cells: Record<string, CellData> = {};
      for (const [ref, data] of Object.entries(sheet.cells)) {
        const parsed = parseCellRef(ref);
        if (!parsed || parsed.row === index) continue;
        const newRow = parsed.row > index ? parsed.row - 1 : parsed.row;
        cells[formatCellRef(parsed.col, newRow)] = data;
      }
      return { ...sheet, cells, rowCount: sheet.rowCount - 1 };
    });
  };

  const insertColumn = (beforeIndex: number) => {
    updateActiveSheet((sheet) => {
      const cells: Record<string, CellData> = {};
      for (const [ref, data] of Object.entries(sheet.cells)) {
        const parsed = parseCellRef(ref);
        if (!parsed) continue;
        const newCol = parsed.col >= beforeIndex ? parsed.col + 1 : parsed.col;
        cells[formatCellRef(newCol, parsed.row)] = data;
      }
      const colWidths: Record<number, number> = {};
      for (const [k, w] of Object.entries(sheet.colWidths)) {
        const col = Number(k);
        colWidths[col >= beforeIndex ? col + 1 : col] = w;
      }
      return { ...sheet, cells, colWidths, colCount: sheet.colCount + 1 };
    });
  };

  const deleteColumn = (index: number) => {
    updateActiveSheet((sheet) => {
      if (sheet.colCount <= 1) return sheet;
      const cells: Record<string, CellData> = {};
      for (const [ref, data] of Object.entries(sheet.cells)) {
        const parsed = parseCellRef(ref);
        if (!parsed || parsed.col === index) continue;
        const newCol = parsed.col > index ? parsed.col - 1 : parsed.col;
        cells[formatCellRef(newCol, parsed.row)] = data;
      }
      const colWidths: Record<number, number> = {};
      for (const [k, w] of Object.entries(sheet.colWidths)) {
        const col = Number(k);
        if (col === index) continue;
        colWidths[col > index ? col - 1 : col] = w;
      }
      return { ...sheet, cells, colWidths, colCount: sheet.colCount - 1 };
    });
  };

  const resizeColumn = (index: number, width: number) => {
    updateActiveSheet((sheet) => ({
      ...sheet,
      colWidths: { ...sheet.colWidths, [index]: Math.max(40, width) },
    }));
  };

  const getColWidth = (index: number) => activeSheet.colWidths[index] ?? DEFAULT_COL_WIDTH;

  const computedValues = useMemo(
    () => computeSheet(activeSheet),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [activeSheetId, activeSheet.cells],
  );

  return (
    <SpreadsheetCtx.Provider
      value={{
        sheets,
        activeSheetId,
        activeSheet,
        activeCell,
        computedValues,
        addSheet,
        removeSheet,
        renameSheet,
        setActiveSheet,
        setActiveCell,
        setCellRaw,
        setCellStyle,
        insertRow,
        deleteRow,
        insertColumn,
        deleteColumn,
        resizeColumn,
        getColWidth,
      }}
    >
      {children}
    </SpreadsheetCtx.Provider>
  );
}

export function useSpreadsheet() {
  const ctx = useContext(SpreadsheetCtx);
  if (!ctx) throw new Error("useSpreadsheet debe usarse dentro de SpreadsheetProvider");
  return ctx;
}

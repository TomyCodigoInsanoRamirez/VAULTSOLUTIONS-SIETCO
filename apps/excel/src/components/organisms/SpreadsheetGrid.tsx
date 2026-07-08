"use client";

import { memo, useEffect, useRef, useState, type CSSProperties, type ReactNode, type KeyboardEvent as ReactKeyboardEvent, type FocusEvent as ReactFocusEvent } from "react";
import { useSpreadsheet, CellStyle } from "@/context/SpreadsheetContext";
import { ComputedValue } from "@/lib/spreadsheet/formulaEngine";
import { colToLetters, formatCellRef, parseCellRef } from "@/lib/spreadsheet/reference";
import FormulaPanel, { type FormulaArg } from "./FormulaPanel";

const REF_COLORS = ["#3B82F6", "#F59E0B", "#10B981", "#7C4DFF", "#EC4899"];

const ROW_HEADER_W = 44;
const ROW_H = 26;
const HEADER_H = 24;

type Direction = "up" | "down" | "left" | "right";

/* ── Column header (con handle de resize) ──────────────────────────────── */

function ColumnHeader({
  index,
  width,
  onResize,
  onContextMenu,
}: {
  index: number;
  width: number;
  onResize: (index: number, width: number) => void;
  onContextMenu: (e: React.MouseEvent, index: number) => void;
}) {
  const startRef = useRef({ x: 0, w: 0 });
  const [dragging, setDragging] = useState(false);

  const onMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    startRef.current = { x: e.clientX, w: width };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      onResize(index, Math.max(40, startRef.current.w + (e.clientX - startRef.current.x)));
    };
    const onUp = () => setDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    };
  }, [dragging, index, onResize]);

  return (
    <div
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, index); }}
      className="shrink-0 flex items-center justify-center text-xs font-medium relative border-r border-b cursor-default"
      style={{ width, height: HEADER_H, backgroundColor: "#EEF2FF", color: "#5B7093", borderColor: "#D8E2FA" }}
    >
      {colToLetters(index)}
      <div
        onMouseDown={onMouseDown}
        style={{ position: "absolute", right: -2, top: 0, width: 4, height: "100%", cursor: "col-resize", zIndex: 5 }}
      />
    </div>
  );
}

/* ── Row header ─────────────────────────────────────────────────────────── */

function RowHeader({
  index,
  onContextMenu,
}: {
  index: number;
  onContextMenu: (e: React.MouseEvent, index: number) => void;
}) {
  return (
    <div
      onContextMenu={(e) => { e.preventDefault(); onContextMenu(e, index); }}
      className="shrink-0 flex items-center justify-center text-xs border-r border-b cursor-default"
      style={{ width: ROW_HEADER_W, height: ROW_H, backgroundColor: "#EEF2FF", color: "#5B7093", borderColor: "#D8E2FA" }}
    >
      {index + 1}
    </div>
  );
}

/* ── Menú contextual de encabezado (fila o columna) ─────────────────────── */

interface HeaderMenuState {
  kind: "row" | "col";
  index: number;
  x: number;
  y: number;
}

/* ── Menú contextual de celda (insertar referencia mientras se edita) ────── */

interface CellMenuState {
  ref: string;
  x: number;
  y: number;
}

/* ── Fórmula en construcción (panel + selección de celdas en la hoja) ───── */

interface FormulaBuilderState {
  targetRef: string;
  fn: string | null;
  args: FormulaArg[];
}

function HeaderMenuItem({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="w-full flex items-center px-4 py-2 text-sm text-left transition-colors whitespace-nowrap"
      style={{ color: "#173B6C" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#EEF2FF")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      {children}
    </button>
  );
}

/* ── Cell ───────────────────────────────────────────────────────────────── */

interface CellProps {
  cellRef: string;
  raw: string;
  computedValue: ComputedValue | undefined;
  style: CellStyle | undefined;
  isActive: boolean;
  isEditing: boolean;
  draftValue: string;
  width: number;
  highlightColor?: string;
  highlightTop?: boolean;
  highlightBottom?: boolean;
  highlightLeft?: boolean;
  highlightRight?: boolean;
  onDraftChange: (v: string) => void;
  onEditKeyDown: (e: ReactKeyboardEvent<HTMLInputElement>) => void;
  onEditBlur: (e: ReactFocusEvent<HTMLInputElement>) => void;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

const Cell = memo(
  function Cell({
    cellRef, computedValue, style, isActive, isEditing, draftValue, width,
    highlightColor, highlightTop, highlightBottom, highlightLeft, highlightRight,
    onDraftChange, onEditKeyDown, onEditBlur, inputRef,
  }: CellProps) {
    const display = computedValue === undefined ? "" : String(computedValue);
    const isError = typeof computedValue === "string" && computedValue.startsWith("#");

    const textStyle: CSSProperties = {
      fontWeight: style?.bold ? 700 : 400,
      fontStyle: style?.italic ? "italic" : "normal",
      textDecoration:
        [style?.underline && "underline", style?.strike && "line-through"].filter(Boolean).join(" ") || "none",
      textAlign: style?.align ?? "left",
      color: isError ? "#DC2626" : style?.color ?? "#173B6C",
      backgroundColor: style?.bg ?? "transparent",
      fontFamily: style?.fontFamily ?? "Arial, sans-serif",
      fontSize: style?.fontSize ? `${style.fontSize}px` : "13px",
    };

    return (
      <div
        data-ref={cellRef}
        className="shrink-0 border-r border-b overflow-hidden"
        style={{
          width, height: ROW_H, borderColor: "#E5EBFA",
          outline: isActive ? "2px solid #3B82F6" : "none",
          outlineOffset: -2,
          position: "relative",
          backgroundColor: highlightColor ? `${highlightColor}1A` : undefined,
          borderTop: highlightTop ? `2px solid ${highlightColor}` : undefined,
          borderBottom: highlightBottom ? `2px solid ${highlightColor}` : undefined,
          borderLeft: highlightLeft ? `2px solid ${highlightColor}` : undefined,
          borderRight: highlightRight ? `2px solid ${highlightColor}` : undefined,
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            value={draftValue}
            onChange={(e) => onDraftChange(e.target.value)}
            onKeyDown={onEditKeyDown}
            onBlur={onEditBlur}
            className="w-full h-full px-1 outline-none border-none"
            style={{ ...textStyle, backgroundColor: "#FFFFFF" }}
          />
        ) : (
          <div className="w-full h-full px-1 flex items-center overflow-hidden whitespace-nowrap" style={textStyle}>
            {display}
          </div>
        )}
      </div>
    );
  },
  (prev, next) =>
    prev.cellRef === next.cellRef &&
    prev.raw === next.raw &&
    prev.computedValue === next.computedValue &&
    prev.style === next.style &&
    prev.isActive === next.isActive &&
    prev.isEditing === next.isEditing &&
    prev.draftValue === next.draftValue &&
    prev.width === next.width &&
    prev.highlightColor === next.highlightColor &&
    prev.highlightTop === next.highlightTop &&
    prev.highlightBottom === next.highlightBottom &&
    prev.highlightLeft === next.highlightLeft &&
    prev.highlightRight === next.highlightRight,
);

/* ── Grid principal ─────────────────────────────────────────────────────── */

export default function SpreadsheetGrid() {
  const {
    activeSheet, activeCell, computedValues, setActiveCell, setCellRaw, getColWidth, resizeColumn,
    insertRow, deleteRow, insertColumn, deleteColumn,
  } = useSpreadsheet();

  const [draft, setDraft] = useState<string | null>(null);
  const [headerMenu, setHeaderMenu] = useState<HeaderMenuState | null>(null);
  const [cellMenu, setCellMenu] = useState<CellMenuState | null>(null);
  const [builder, setBuilder] = useState<FormulaBuilderState | null>(null);
  const [dragPreview, setDragPreview] = useState<{ anchor: string; current: string } | null>(null);

  const gridRef = useRef<HTMLDivElement>(null);
  const cellInputRef = useRef<HTMLInputElement>(null);
  const formulaInputRef = useRef<HTMLInputElement>(null);
  const headerMenuRef = useRef<HTMLDivElement>(null);
  const cellMenuRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{ anchor: string; current: string } | null>(null);

  // Cierra el menú de encabezado al hacer clic fuera de él.
  useEffect(() => {
    if (!headerMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!headerMenuRef.current?.contains(e.target as Node)) setHeaderMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [headerMenu]);

  // Cierra el menú de celda al hacer clic fuera de él.
  useEffect(() => {
    if (!cellMenu) return;
    const onDown = (e: MouseEvent) => {
      if (!cellMenuRef.current?.contains(e.target as Node)) setCellMenu(null);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [cellMenu]);

  // Selecciona A1 al montar para que la navegación por teclado funcione de inmediato.
  useEffect(() => {
    if (!activeCell) setActiveCell(formatCellRef(0, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Foco + cursor al final cuando se entra en modo edición.
  useEffect(() => {
    if (draft === null) return;
    const el = cellInputRef.current;
    if (el) {
      el.focus();
      el.setSelectionRange(el.value.length, el.value.length);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft !== null]);

  function beginEdit(ref: string, initial?: string) {
    const current = activeSheet.cells[ref]?.raw ?? "";
    setActiveCell(ref);
    setDraft(initial !== undefined ? initial : current);
  }

  function commitEdit() {
    if (draft !== null && activeCell) {
      setCellRaw(activeCell, draft);
    }
    setDraft(null);
  }

  function cancelEdit() {
    setDraft(null);
  }

  function moveActive(dir: Direction) {
    if (!activeCell) {
      setActiveCell(formatCellRef(0, 0));
      return;
    }
    const parsed = parseCellRef(activeCell);
    if (!parsed) return;
    let { col, row } = parsed;
    if (dir === "up") row = Math.max(0, row - 1);
    if (dir === "down") row = Math.min(activeSheet.rowCount - 1, row + 1);
    if (dir === "left") col = Math.max(0, col - 1);
    if (dir === "right") col = Math.min(activeSheet.colCount - 1, col + 1);
    setActiveCell(formatCellRef(col, row));
  }

  function handleEditKeyDown(e: ReactKeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      commitEdit();
      moveActive(e.shiftKey ? "up" : "down");
      gridRef.current?.focus();
    } else if (e.key === "Tab") {
      e.preventDefault();
      commitEdit();
      moveActive(e.shiftKey ? "left" : "right");
      gridRef.current?.focus();
    } else if (e.key === "Escape") {
      e.preventDefault();
      cancelEdit();
      gridRef.current?.focus();
    }
  }

  function handleEditBlur(e: ReactFocusEvent<HTMLInputElement>) {
    const related = e.relatedTarget;
    if (related === cellInputRef.current || related === formulaInputRef.current) return;
    commitEdit();
  }

  function handleContainerKeyDown(e: ReactKeyboardEvent) {
    if (builder) return; // FormulaPanel maneja Enter/Escape a nivel documento
    if (draft !== null) return; // el input de edición maneja sus propias teclas
    if (!activeCell) {
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key)) {
        e.preventDefault();
        setActiveCell(formatCellRef(0, 0));
      }
      return;
    }
    switch (e.key) {
      case "ArrowUp": e.preventDefault(); moveActive("up"); break;
      case "ArrowDown": e.preventDefault(); moveActive("down"); break;
      case "ArrowLeft": e.preventDefault(); moveActive("left"); break;
      case "ArrowRight": e.preventDefault(); moveActive("right"); break;
      case "Tab": e.preventDefault(); moveActive(e.shiftKey ? "left" : "right"); break;
      case "Enter":
      case "F2":
        e.preventDefault();
        beginEdit(activeCell);
        break;
      case "Delete":
      case "Backspace":
        e.preventDefault();
        setCellRaw(activeCell, "");
        break;
      default:
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
          // preventDefault evita que el navegador dispare además un evento nativo
          // de tecleo sobre el <input> recién enfocado, que duplicaría el carácter.
          e.preventDefault();
          beginEdit(activeCell, e.key);
        }
    }
  }

  function handleGridMouseDown(e: React.MouseEvent) {
    if (e.button !== 0) return; // ignora clic derecho — lo maneja handleGridContextMenu
    const el = (e.target as HTMLElement).closest("[data-ref]") as HTMLElement | null;
    if (!el) return;
    const ref = el.dataset.ref!;

    if (builder) {
      // Mientras el panel de fórmula está abierto, el clic/arrastre en la hoja
      // selecciona celdas para la fórmula en vez de editar/navegar normalmente.
      if (builder.fn) startArgDrag(ref);
      return;
    }

    if (draft !== null) {
      if (ref === activeCell) return; // click dentro de la celda que ya se edita
      commitEdit();
    }
    setActiveCell(ref);
  }

  function handleGridDoubleClick(e: React.MouseEvent) {
    if (builder) return;
    const el = (e.target as HTMLElement).closest("[data-ref]") as HTMLElement | null;
    if (!el) return;
    const ref = el.dataset.ref!;
    if (draft !== null && ref === activeCell) return;
    beginEdit(ref);
  }

  // Arma el rango top-left:bottom-right entre dos referencias de celda.
  function normalizeRange(a: string, b: string): string {
    const pa = parseCellRef(a);
    const pb = parseCellRef(b);
    if (!pa || !pb) return a === b ? a : `${a}:${b}`;
    const colMin = Math.min(pa.col, pb.col);
    const colMax = Math.max(pa.col, pb.col);
    const rowMin = Math.min(pa.row, pb.row);
    const rowMax = Math.max(pa.row, pb.row);
    const start = formatCellRef(colMin, rowMin);
    const end = formatCellRef(colMax, rowMax);
    return start === end ? start : `${start}:${end}`;
  }

  // Clic simple agrega una celda; clic + arrastre agrega un rango — como en Excel.
  function startArgDrag(startRef: string) {
    dragStateRef.current = { anchor: startRef, current: startRef };
    setDragPreview({ anchor: startRef, current: startRef });

    const onMove = (ev: MouseEvent) => {
      const el = document.elementFromPoint(ev.clientX, ev.clientY) as HTMLElement | null;
      const cellEl = el?.closest("[data-ref]") as HTMLElement | null;
      const ref = cellEl?.dataset.ref;
      if (ref && dragStateRef.current) {
        dragStateRef.current = { ...dragStateRef.current, current: ref };
        setDragPreview({ ...dragStateRef.current });
      }
    };

    const onUp = () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      const finalDrag = dragStateRef.current;
      dragStateRef.current = null;
      setDragPreview(null);
      if (!finalDrag) return;
      const range = normalizeRange(finalDrag.anchor, finalDrag.current);
      setBuilder((b) => {
        if (!b) return b;
        const color = REF_COLORS[b.args.length % REF_COLORS.length];
        return { ...b, args: [...b.args, { ref: range, color }] };
      });
    };

    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  function pickBuilderFn(fn: string) {
    setBuilder((b) => (b ? { ...b, fn } : b));
  }

  function removeBuilderArg(index: number) {
    setBuilder((b) => (b ? { ...b, args: b.args.filter((_, i) => i !== index) } : b));
  }

  function acceptBuilder() {
    if (!builder || !builder.fn) return;
    setCellRaw(builder.targetRef, `=${builder.fn}(${builder.args.map((a) => a.ref).join(",")})`);
    setActiveCell(builder.targetRef);
    setBuilder(null);
  }

  function cancelBuilder() {
    setBuilder(null);
  }

  // Determina si `ref` cae dentro de una referencia o rango tipo "A1" / "A1:B5".
  function refInRange(ref: string, rangeOrRef: string): boolean {
    const pr = parseCellRef(ref);
    if (!pr) return false;
    const [a, b] = rangeOrRef.includes(":") ? rangeOrRef.split(":") : [rangeOrRef, rangeOrRef];
    const pa = parseCellRef(a);
    const pb = parseCellRef(b);
    if (!pa || !pb) return false;
    const colMin = Math.min(pa.col, pb.col), colMax = Math.max(pa.col, pb.col);
    const rowMin = Math.min(pa.row, pb.row), rowMax = Math.max(pa.row, pb.row);
    return pr.col >= colMin && pr.col <= colMax && pr.row >= rowMin && pr.row <= rowMax;
  }

  // Resalta la celda si pertenece al arrastre en curso o a un argumento ya agregado.
  function getHighlight(ref: string): { color: string; edges: { top: boolean; bottom: boolean; left: boolean; right: boolean } } | undefined {
    const candidates: { range: string; color: string }[] = [];
    if (builder && dragPreview) {
      candidates.push({
        range: normalizeRange(dragPreview.anchor, dragPreview.current),
        color: REF_COLORS[builder.args.length % REF_COLORS.length],
      });
    }
    if (builder) {
      for (const a of builder.args) candidates.push({ range: a.ref, color: a.color });
    }

    for (const { range, color } of candidates) {
      if (!refInRange(ref, range)) continue;
      const pr = parseCellRef(ref)!;
      const [a, b] = range.includes(":") ? range.split(":") : [range, range];
      const pa = parseCellRef(a)!, pb = parseCellRef(b)!;
      const colMin = Math.min(pa.col, pb.col), colMax = Math.max(pa.col, pb.col);
      const rowMin = Math.min(pa.row, pb.row), rowMax = Math.max(pa.row, pb.row);
      return {
        color,
        edges: {
          top: pr.row === rowMin,
          bottom: pr.row === rowMax,
          left: pr.col === colMin,
          right: pr.col === colMax,
        },
      };
    }
    return undefined;
  }

  function handleColumnContextMenu(e: React.MouseEvent, index: number) {
    setHeaderMenu({ kind: "col", index, x: e.clientX, y: e.clientY });
  }

  function handleRowContextMenu(e: React.MouseEvent, index: number) {
    setHeaderMenu({ kind: "row", index, x: e.clientX, y: e.clientY });
  }

  // Inserta la referencia de una celda en el punto donde iba el cursor del
  // input que se está editando (celda o barra de fórmulas), como en Excel.
  function insertReferenceAtCursor(ref: string) {
    const el = cellInputRef.current ?? formulaInputRef.current;
    const current = draft ?? "";
    const start = el?.selectionStart ?? current.length;
    const end = el?.selectionEnd ?? current.length;
    const next = current.slice(0, start) + ref + current.slice(end);
    setDraft(next);
    setCellMenu(null);
    requestAnimationFrame(() => {
      const target = cellInputRef.current ?? formulaInputRef.current;
      if (target) {
        target.focus();
        const pos = start + ref.length;
        target.setSelectionRange(pos, pos);
      }
    });
  }

  function handleGridContextMenu(e: React.MouseEvent) {
    const el = (e.target as HTMLElement).closest("[data-ref]") as HTMLElement | null;
    if (!el) return;
    e.preventDefault();
    if (builder) return; // ya hay una fórmula en construcción
    const ref = el.dataset.ref!;

    if (draft !== null) {
      if (ref === activeCell) return; // clic derecho en la celda que ya se edita — nada útil
      setCellMenu({ ref, x: e.clientX, y: e.clientY });
      return;
    }

    const isEmpty = !activeSheet.cells[ref]?.raw;
    if (!isEmpty) return;
    setBuilder({ targetRef: ref, fn: null, args: [] });
  }

  const cols = Array.from({ length: activeSheet.colCount }, (_, i) => i);
  const rows = Array.from({ length: activeSheet.rowCount }, (_, i) => i);

  const formulaBarValue =
    draft !== null ? draft : activeCell ? activeSheet.cells[activeCell]?.raw ?? "" : "";

  return (
    <div className="flex-1 flex flex-col overflow-hidden">
      {/* Barra de fórmulas */}
      <div
        className="flex items-center gap-2 px-2 py-1 border-b shrink-0"
        style={{ backgroundColor: "#FFFFFF", borderColor: "#D8E2FA" }}
      >
        <span
          className="text-xs font-medium shrink-0 text-center"
          style={{ color: "#5B7093", minWidth: 40 }}
        >
          {activeCell ?? ""}
        </span>
        <span className="text-xs shrink-0" style={{ color: "#D8E2FA" }}>fx</span>
        <input
          ref={formulaInputRef}
          value={formulaBarValue}
          disabled={!activeCell}
          onFocus={() => { if (draft === null && activeCell) beginEdit(activeCell); }}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={handleEditKeyDown}
          onBlur={handleEditBlur}
          placeholder={activeCell ? "" : "Selecciona una celda"}
          className="flex-1 text-sm outline-none px-1 bg-transparent"
          style={{ color: "#173B6C" }}
        />
      </div>

      {/* Grid */}
      <div
        ref={gridRef}
        tabIndex={0}
        onKeyDown={handleContainerKeyDown}
        onMouseDown={handleGridMouseDown}
        onDoubleClick={handleGridDoubleClick}
        onContextMenu={handleGridContextMenu}
        className="flex-1 overflow-auto outline-none"
      >
        <div style={{ display: "inline-block" }}>
          {/* Fila de encabezados de columna */}
          <div className="flex" style={{ backgroundColor: "#EEF2FF" }}>
            <div
              className="shrink-0 border-r border-b"
              style={{ width: ROW_HEADER_W, height: HEADER_H, borderColor: "#D8E2FA" }}
            />
            {cols.map((c) => (
              <ColumnHeader
                key={c}
                index={c}
                width={getColWidth(c)}
                onResize={resizeColumn}
                onContextMenu={handleColumnContextMenu}
              />
            ))}
          </div>

          {/* Filas */}
          {rows.map((r) => (
            <div className="flex" key={r}>
              <RowHeader index={r} onContextMenu={handleRowContextMenu} />
              {cols.map((c) => {
                const ref = formatCellRef(c, r);
                const cellData = activeSheet.cells[ref];
                const isActive = activeCell === ref;
                const isEditing = isActive && draft !== null;
                const highlight = getHighlight(ref);
                return (
                  <Cell
                    key={ref}
                    cellRef={ref}
                    raw={cellData?.raw ?? ""}
                    computedValue={computedValues[ref]}
                    style={cellData?.style}
                    isActive={isActive}
                    isEditing={isEditing}
                    draftValue={isEditing ? draft ?? "" : ""}
                    width={getColWidth(c)}
                    highlightColor={highlight?.color}
                    highlightTop={highlight?.edges.top}
                    highlightBottom={highlight?.edges.bottom}
                    highlightLeft={highlight?.edges.left}
                    highlightRight={highlight?.edges.right}
                    onDraftChange={setDraft}
                    onEditKeyDown={handleEditKeyDown}
                    onEditBlur={handleEditBlur}
                    inputRef={cellInputRef}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Menú contextual de fila/columna */}
      {headerMenu && (
        <div
          ref={headerMenuRef}
          style={{
            position: "fixed",
            top: headerMenu.y,
            left: headerMenu.x,
            zIndex: 9999,
            backgroundColor: "#FFFFFF",
            border: "1px solid #D8E2FA",
            borderRadius: 6,
            padding: "4px 0",
            minWidth: 200,
            boxShadow: "0 6px 24px rgba(89,101,242,0.16)",
          }}
        >
          {headerMenu.kind === "col" ? (
            <>
              <HeaderMenuItem onClick={() => { insertColumn(headerMenu.index); setHeaderMenu(null); }}>
                Insertar columna antes
              </HeaderMenuItem>
              <HeaderMenuItem onClick={() => { insertColumn(headerMenu.index + 1); setHeaderMenu(null); }}>
                Insertar columna después
              </HeaderMenuItem>
              <HeaderMenuItem onClick={() => { deleteColumn(headerMenu.index); setHeaderMenu(null); }}>
                Eliminar columna
              </HeaderMenuItem>
            </>
          ) : (
            <>
              <HeaderMenuItem onClick={() => { insertRow(headerMenu.index); setHeaderMenu(null); }}>
                Insertar fila arriba
              </HeaderMenuItem>
              <HeaderMenuItem onClick={() => { insertRow(headerMenu.index + 1); setHeaderMenu(null); }}>
                Insertar fila abajo
              </HeaderMenuItem>
              <HeaderMenuItem onClick={() => { deleteRow(headerMenu.index); setHeaderMenu(null); }}>
                Eliminar fila
              </HeaderMenuItem>
            </>
          )}
        </div>
      )}

      {/* Menú contextual de celda: insertar referencia mientras se edita a mano */}
      {cellMenu && (
        <div
          ref={cellMenuRef}
          style={{
            position: "fixed",
            top: cellMenu.y,
            left: cellMenu.x,
            zIndex: 9999,
            backgroundColor: "#FFFFFF",
            border: "1px solid #D8E2FA",
            borderRadius: 6,
            padding: "4px 0",
            minWidth: 200,
            boxShadow: "0 6px 24px rgba(89,101,242,0.16)",
          }}
        >
          <HeaderMenuItem onClick={() => insertReferenceAtCursor(cellMenu.ref)}>
            Insertar referencia {cellMenu.ref} aquí
          </HeaderMenuItem>
        </div>
      )}

      {/* Panel de fórmula: elegir función e ir seleccionando celdas en la hoja */}
      <FormulaPanel
        open={builder !== null}
        targetRef={builder?.targetRef ?? null}
        fn={builder?.fn ?? null}
        args={builder?.args ?? []}
        onPickFn={pickBuilderFn}
        onRemoveArg={removeBuilderArg}
        onAccept={acceptBuilder}
        onCancel={cancelBuilder}
      />
    </div>
  );
}

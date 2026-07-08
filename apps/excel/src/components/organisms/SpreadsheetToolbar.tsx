"use client";

import { FormatGroup, FontSelector, AlignGroup, Divider } from "@sietco/ui";
import CellColorGroup from "@/components/molecules/CellColorGroup";
import RowColGroup from "@/components/molecules/RowColGroup";
import { useSpreadsheet } from "@/context/SpreadsheetContext";
import { parseCellRef } from "@/lib/spreadsheet/reference";

const DEFAULT_TEXT_COLOR = "#173B6C";
const DEFAULT_BG_COLOR = "#FFFFFF";

export default function SpreadsheetToolbar() {
  const {
    activeCell, activeSheet, setCellStyle,
    insertRow, deleteRow, insertColumn, deleteColumn,
  } = useSpreadsheet();

  const cell = activeCell ? activeSheet.cells[activeCell] : undefined;
  const style = cell?.style ?? {};

  const activeFormats = new Set<string>(
    [
      style.bold ? "bold" : null,
      style.italic ? "italic" : null,
      style.underline ? "underline" : null,
      style.strike ? "strikeThrough" : null,
    ].filter(Boolean) as string[],
  );

  const activeAlign = style.align ?? "left";
  const currentFont = style.fontFamily ?? "Arial";
  const currentSize = style.fontSize ?? "12";
  const textColor = style.color ?? DEFAULT_TEXT_COLOR;
  const bgColor = style.bg ?? DEFAULT_BG_COLOR;

  const handleFormat = (format: string) => {
    if (!activeCell) return;
    if (format === "bold") setCellStyle(activeCell, { bold: !style.bold });
    else if (format === "italic") setCellStyle(activeCell, { italic: !style.italic });
    else if (format === "underline") setCellStyle(activeCell, { underline: !style.underline });
    else if (format === "strikeThrough") setCellStyle(activeCell, { strike: !style.strike });
  };

  const handleAlign = (align: "left" | "center" | "right" | "justify") => {
    if (!activeCell) return;
    setCellStyle(activeCell, { align });
  };

  const handleFont = (font: string) => {
    if (!activeCell) return;
    setCellStyle(activeCell, { fontFamily: font });
  };

  const handleSize = (size: string) => {
    if (!activeCell) return;
    setCellStyle(activeCell, { fontSize: size });
  };

  const handleTextColor = (color: string) => {
    if (!activeCell) return;
    setCellStyle(activeCell, { color });
  };

  const handleBgColor = (color: string) => {
    if (!activeCell) return;
    setCellStyle(activeCell, { bg: color });
  };

  const rowIndex = activeCell ? parseCellRef(activeCell)?.row ?? 0 : 0;
  const colIndex = activeCell ? parseCellRef(activeCell)?.col ?? 0 : 0;

  return (
    <div
      className="px-3 py-1.5 flex items-center flex-wrap gap-1 overflow-x-auto border-b"
      style={{ backgroundColor: "#EEF2FF", borderColor: "#D8E2FA" }}
    >
      <FontSelector font={currentFont} size={currentSize} onFontChange={handleFont} onSizeChange={handleSize} />
      <Divider />
      <FormatGroup activeFormats={activeFormats} onFormat={handleFormat} />
      <Divider />
      <AlignGroup activeAlign={activeAlign} onAlign={handleAlign} />
      <Divider />
      <CellColorGroup
        textColor={textColor}
        bgColor={bgColor}
        onTextColor={handleTextColor}
        onBgColor={handleBgColor}
      />
      <Divider />
      <RowColGroup
        disabled={!activeCell}
        onInsertRow={() => insertRow(rowIndex)}
        onDeleteRow={() => deleteRow(rowIndex)}
        onInsertColumn={() => insertColumn(colIndex)}
        onDeleteColumn={() => deleteColumn(colIndex)}
      />
    </div>
  );
}

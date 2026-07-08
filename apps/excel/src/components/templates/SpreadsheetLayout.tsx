"use client";

import { useRef, useState } from "react";
import { NavDropdown, AppSwitcher } from "@sietco/ui";
import { SpreadsheetProvider, useSpreadsheet } from "@/context/SpreadsheetContext";
import { parseCellRef } from "@/lib/spreadsheet/reference";
import SpreadsheetToolbar from "@/components/organisms/SpreadsheetToolbar";
import SpreadsheetGrid from "@/components/organisms/SpreadsheetGrid";
import SheetTabs from "@/components/organisms/SheetTabs";

function NavBar({ onRename }: { onRename: () => void }) {
  const { activeCell, insertRow, insertColumn } = useSpreadsheet();

  const handleInsertRow = () => {
    const row = activeCell ? parseCellRef(activeCell)?.row ?? 0 : 0;
    insertRow(row);
  };

  const handleInsertColumn = () => {
    const col = activeCell ? parseCellRef(activeCell)?.col ?? 0 : 0;
    insertColumn(col);
  };

  return (
    <nav
      className="px-3 flex items-center gap-1 shrink-0 overflow-x-auto border-b"
      style={{ backgroundColor: "#EEF2FF", borderColor: "#D8E2FA" }}
    >
      <NavDropdown
        label="Archivo"
        items={[
          { label: "Cambiar nombre", onClick: onRename },
        ]}
      />
      <NavDropdown
        label="Insertar"
        items={[
          { label: "Insertar fila", onClick: handleInsertRow },
          { label: "Insertar columna", onClick: handleInsertColumn },
        ]}
      />
    </nav>
  );
}

export default function SpreadsheetLayout() {
  const [docName, setDocName] = useState("Hoja de cálculo sin título");
  const titleRef = useRef<HTMLInputElement>(null);

  const handleRename = () => {
    titleRef.current?.select();
    titleRef.current?.focus();
  };

  return (
    <SpreadsheetProvider>
      <div className="flex flex-col h-screen overflow-hidden bg-white">
        {/* Title bar */}
        <header
          className="text-white px-4 py-1.5 flex items-center justify-between shrink-0"
          style={{ background: "linear-gradient(90deg, #3B82F6 0%, #5965F2 50%, #7C4DFF 100%)" }}
        >
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold tracking-wide">SIETCO</span>
            <AppSwitcher current="excel" />
          </div>
          <input
            ref={titleRef}
            value={docName}
            onChange={(e) => setDocName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") titleRef.current?.blur(); }}
            className="text-xs text-right bg-transparent border-b border-transparent focus:border-white/50 focus:outline-none transition-colors"
            style={{ color: "#D8E2FA", minWidth: 160, maxWidth: 300 }}
          />
        </header>

        <NavBar onRename={handleRename} />
        <SpreadsheetToolbar />
        <SpreadsheetGrid />
        <SheetTabs />
      </div>
    </SpreadsheetProvider>
  );
}

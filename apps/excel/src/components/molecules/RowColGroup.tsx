"use client";

import type { ReactNode } from "react";
import { Plus, Minus } from "lucide-react";

interface RowColGroupProps {
  disabled: boolean;
  onInsertRow: () => void;
  onDeleteRow: () => void;
  onInsertColumn: () => void;
  onDeleteColumn: () => void;
}

const NOTE = "No actualiza fórmulas que referencien celdas desplazadas.";

function ActionButton({
  tooltip,
  disabled,
  onClick,
  children,
}: {
  tooltip: string;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      title={tooltip}
      disabled={disabled}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className="flex items-center gap-1 h-7 px-2 rounded text-xs transition-colors duration-100 cursor-pointer select-none disabled:cursor-not-allowed disabled:opacity-40"
      style={{ color: "#173B6C" }}
      onMouseEnter={(e) => { if (!disabled) e.currentTarget.style.backgroundColor = "#D8E2FA"; }}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      {children}
    </button>
  );
}

export default function RowColGroup({
  disabled,
  onInsertRow,
  onDeleteRow,
  onInsertColumn,
  onDeleteColumn,
}: RowColGroupProps) {
  return (
    <div className="flex items-center gap-0.5">
      <ActionButton tooltip={`Insertar fila. ${NOTE}`} disabled={disabled} onClick={onInsertRow}>
        <Plus size={13} /> Fila
      </ActionButton>
      <ActionButton tooltip={`Eliminar fila. ${NOTE}`} disabled={disabled} onClick={onDeleteRow}>
        <Minus size={13} /> Fila
      </ActionButton>
      <ActionButton tooltip={`Insertar columna. ${NOTE}`} disabled={disabled} onClick={onInsertColumn}>
        <Plus size={13} /> Columna
      </ActionButton>
      <ActionButton tooltip={`Eliminar columna. ${NOTE}`} disabled={disabled} onClick={onDeleteColumn}>
        <Minus size={13} /> Columna
      </ActionButton>
    </div>
  );
}

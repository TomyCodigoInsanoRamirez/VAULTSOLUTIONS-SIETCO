"use client";

import { List, ListOrdered, Undo2, Redo2 } from "lucide-react";
import { ToolbarButton } from "@sietco/ui";

interface ListGroupProps {
  onCommand: (command: string) => void;
}

export default function ListGroup({ onCommand }: ListGroupProps) {
  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton
        tooltip="Lista con viñetas"
        onMouseDown={(e) => { e.preventDefault(); onCommand("insertUnorderedList"); }}
      >
        <List size={15} />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Lista numerada"
        onMouseDown={(e) => { e.preventDefault(); onCommand("insertOrderedList"); }}
      >
        <ListOrdered size={15} />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Deshacer (Ctrl+Z)"
        onMouseDown={(e) => { e.preventDefault(); onCommand("undo"); }}
      >
        <Undo2 size={15} />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Rehacer (Ctrl+Y)"
        onMouseDown={(e) => { e.preventDefault(); onCommand("redo"); }}
      >
        <Redo2 size={15} />
      </ToolbarButton>
    </div>
  );
}

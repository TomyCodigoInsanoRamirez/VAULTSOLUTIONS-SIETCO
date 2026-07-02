"use client";

import { Bold, Italic, Underline, Strikethrough } from "lucide-react";
import ToolbarButton from "@/components/atoms/ToolbarButton";

interface FormatGroupProps {
  activeFormats: Set<string>;
  onFormat: (command: string) => void;
}

export default function FormatGroup({ activeFormats, onFormat }: FormatGroupProps) {
  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton
        tooltip="Negrita (Ctrl+B)"
        active={activeFormats.has("bold")}
        onMouseDown={(e) => { e.preventDefault(); onFormat("bold"); }}
      >
        <Bold size={15} />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Cursiva (Ctrl+I)"
        active={activeFormats.has("italic")}
        onMouseDown={(e) => { e.preventDefault(); onFormat("italic"); }}
      >
        <Italic size={15} />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Subrayado (Ctrl+U)"
        active={activeFormats.has("underline")}
        onMouseDown={(e) => { e.preventDefault(); onFormat("underline"); }}
      >
        <Underline size={15} />
      </ToolbarButton>

      <ToolbarButton
        tooltip="Tachado"
        active={activeFormats.has("strikeThrough")}
        onMouseDown={(e) => { e.preventDefault(); onFormat("strikeThrough"); }}
      >
        <Strikethrough size={15} />
      </ToolbarButton>
    </div>
  );
}

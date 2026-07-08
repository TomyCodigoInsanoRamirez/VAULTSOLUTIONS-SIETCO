"use client";

import React from "react";
import { AlignLeft, AlignCenter, AlignRight, AlignJustify } from "lucide-react";
import ToolbarButton from "../atoms/ToolbarButton";

type Align = "left" | "center" | "right" | "justify";

interface AlignGroupProps {
  activeAlign: Align;
  onAlign: (align: Align) => void;
}

const alignments: { align: Align; icon: React.ReactNode; tooltip: string }[] = [
  { align: "left",    icon: <AlignLeft size={15} />,    tooltip: "Alinear a la izquierda" },
  { align: "center",  icon: <AlignCenter size={15} />,  tooltip: "Centrar" },
  { align: "right",   icon: <AlignRight size={15} />,   tooltip: "Alinear a la derecha" },
  { align: "justify", icon: <AlignJustify size={15} />, tooltip: "Justificar" },
];

export default function AlignGroup({ activeAlign, onAlign }: AlignGroupProps) {
  return (
    <div className="flex items-center gap-0.5">
      {alignments.map(({ align, icon, tooltip }) => (
        <ToolbarButton
          key={align}
          tooltip={tooltip}
          active={activeAlign === align}
          onMouseDown={(e) => { e.preventDefault(); onAlign(align); }}
        >
          {icon}
        </ToolbarButton>
      ))}
    </div>
  );
}

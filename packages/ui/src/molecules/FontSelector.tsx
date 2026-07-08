"use client";

import ToolbarSelect from "../atoms/ToolbarSelect";

const FONTS = [
  { label: "Arial", value: "Arial" },
  { label: "Times New Roman", value: "Times New Roman" },
  { label: "Calibri", value: "Calibri" },
  { label: "Georgia", value: "Georgia" },
  { label: "Verdana", value: "Verdana" },
  { label: "Courier New", value: "Courier New" },
];

const SIZES = [
  "8","9","10","11","12","14","16","18","20","24","28","32","36","48","72",
].map((s) => ({ label: s, value: s }));

interface FontSelectorProps {
  font: string;
  size: string;
  onFontChange: (font: string) => void;
  onSizeChange: (size: string) => void;
}

export default function FontSelector({
  font,
  size,
  onFontChange,
  onSizeChange,
}: FontSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <ToolbarSelect
        options={FONTS}
        value={font}
        width="w-24 sm:w-36"
        onChange={(e) => onFontChange(e.target.value)}
      />
      <ToolbarSelect
        options={SIZES}
        value={size}
        width="w-12 sm:w-14"
        onChange={(e) => onSizeChange(e.target.value)}
      />
    </div>
  );
}

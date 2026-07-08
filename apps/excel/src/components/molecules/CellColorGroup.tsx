"use client";

interface CellColorGroupProps {
  textColor: string;
  bgColor: string;
  onTextColor: (color: string) => void;
  onBgColor: (color: string) => void;
}

export default function CellColorGroup({
  textColor,
  bgColor,
  onTextColor,
  onBgColor,
}: CellColorGroupProps) {
  return (
    <div className="flex items-center gap-1">
      <label
        title="Color de texto"
        className="flex items-center justify-center w-7 h-7 rounded cursor-pointer"
        style={{ color: "#173B6C" }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8E2FA")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <span style={{ fontSize: 13, fontWeight: 700, borderBottom: `3px solid ${textColor}`, lineHeight: "14px" }}>
          A
        </span>
        <input
          type="color"
          value={textColor}
          onChange={(e) => onTextColor(e.target.value)}
          className="sr-only"
        />
      </label>

      <label
        title="Color de relleno"
        className="flex items-center justify-center w-7 h-7 rounded cursor-pointer"
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8E2FA")}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
      >
        <span
          style={{
            width: 14, height: 14, borderRadius: 3,
            border: "1px solid #D8E2FA", backgroundColor: bgColor, display: "inline-block",
          }}
        />
        <input
          type="color"
          value={bgColor}
          onChange={(e) => onBgColor(e.target.value)}
          className="sr-only"
        />
      </label>
    </div>
  );
}

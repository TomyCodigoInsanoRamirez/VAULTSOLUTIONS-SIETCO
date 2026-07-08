"use client";

const WORD_URL  = process.env.NEXT_PUBLIC_WORD_URL  ?? "http://localhost:3000";
const EXCEL_URL = process.env.NEXT_PUBLIC_EXCEL_URL ?? "http://localhost:3001";

interface AppSwitcherProps {
  current: "word" | "excel";
}

export default function AppSwitcher({ current }: AppSwitcherProps) {
  return (
    <div className="flex items-center gap-2 text-xs">
      <a
        href={WORD_URL}
        className="px-2 py-0.5 rounded transition-colors"
        style={{
          color: "white",
          opacity: current === "word" ? 1 : 0.6,
          backgroundColor: current === "word" ? "rgba(255,255,255,0.18)" : "transparent",
          fontWeight: current === "word" ? 600 : 400,
        }}
      >
        Documento
      </a>
      <a
        href={EXCEL_URL}
        className="px-2 py-0.5 rounded transition-colors"
        style={{
          color: "white",
          opacity: current === "excel" ? 1 : 0.6,
          backgroundColor: current === "excel" ? "rgba(255,255,255,0.18)" : "transparent",
          fontWeight: current === "excel" ? 600 : 400,
        }}
      >
        Hoja de cálculo
      </a>
    </div>
  );
}

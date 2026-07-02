"use client";

import { ButtonHTMLAttributes } from "react";

interface ToolbarButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean;
  tooltip?: string;
}

export default function ToolbarButton({
  active = false,
  tooltip,
  children,
  className = "",
  ...props
}: ToolbarButtonProps) {
  return (
    <button
      title={tooltip}
      className={`flex items-center justify-center w-7 h-7 rounded text-sm transition-colors duration-100 cursor-pointer select-none ${className}`}
      style={
        active
          ? { backgroundColor: "#EEF2FF", color: "#3B82F6" }
          : { color: "#173B6C" }
      }
      onMouseEnter={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "#D8E2FA";
      }}
      onMouseLeave={(e) => {
        if (!active) e.currentTarget.style.backgroundColor = "transparent";
      }}
      {...props}
    >
      {children}
    </button>
  );
}

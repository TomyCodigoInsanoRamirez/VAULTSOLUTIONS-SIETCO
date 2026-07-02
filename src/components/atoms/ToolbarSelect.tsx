"use client";

import { SelectHTMLAttributes } from "react";

interface ToolbarSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  options: { label: string; value: string }[];
  width?: string;
}

export default function ToolbarSelect({
  options,
  width = "w-32",
  className = "",
  ...props
}: ToolbarSelectProps) {
  return (
    <select
      className={`${width} h-7 px-1 text-sm rounded cursor-pointer focus:outline-none ${className}`}
      style={{
        color: "#173B6C",
        backgroundColor: "#EEF2FF",
        border: "1px solid #D8E2FA",
      }}
      onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
      onBlur={(e) => (e.currentTarget.style.borderColor = "#D8E2FA")}
      {...props}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  );
}

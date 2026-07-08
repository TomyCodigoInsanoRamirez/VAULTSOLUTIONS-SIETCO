"use client";

import { useState, useRef, useEffect } from "react";

export interface NavDropdownItem {
  label: string;
  shortcut?: string;
  onClick: () => void;
  disabled?: boolean;
}

interface NavDropdownProps {
  label: string;
  items: NavDropdownItem[];
}

export default function NavDropdown({ label, items }: NavDropdownProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const btnRef  = useRef<HTMLButtonElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);
  const timer   = useRef<ReturnType<typeof setTimeout> | null>(null);

  const cancelClose = () => {
    if (timer.current) clearTimeout(timer.current);
  };

  const scheduleClose = () => {
    timer.current = setTimeout(() => setOpen(false), 150);
  };

  const openMenu = () => {
    cancelClose();
    if (btnRef.current) {
      const r = btnRef.current.getBoundingClientRect();
      setPos({ top: r.bottom + 2, left: r.left });
    }
    setOpen(true);
  };

  // Close on click outside both button and dropdown
  useEffect(() => {
    const onDown = (e: MouseEvent) => {
      const target = e.target as Node;
      const inBtn  = btnRef.current?.contains(target);
      const inDrop = dropRef.current?.contains(target);
      if (!inBtn && !inDrop) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => (open ? setOpen(false) : openMenu())}
        onMouseEnter={openMenu}
        onMouseLeave={scheduleClose}
        className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors whitespace-nowrap"
        style={{
          color: "#173B6C",
          backgroundColor: open ? "#D8E2FA" : "transparent",
        }}
      >
        {label}
      </button>

      {open && (
        <div
          ref={dropRef}
          onMouseEnter={cancelClose}
          onMouseLeave={scheduleClose}
          style={{
            position: "fixed",
            top:  pos.top,
            left: pos.left,
            zIndex: 9999,
            backgroundColor: "#FFFFFF",
            border: "1px solid #D8E2FA",
            borderRadius: 6,
            padding: "4px 0",
            minWidth: 220,
            boxShadow: "0 6px 24px rgba(89,101,242,0.16)",
          }}
        >
          {items.map((item) => (
            <button
              key={item.label}
              onClick={() => { if (!item.disabled) { item.onClick(); setOpen(false); } }}
              className="w-full flex items-center justify-between px-4 py-2 text-sm text-left transition-colors"
              style={{
                color: item.disabled ? "#B0BCDA" : "#173B6C",
                cursor: item.disabled ? "default" : "pointer",
              }}
              onMouseEnter={(e) => {
                if (!item.disabled) e.currentTarget.style.backgroundColor = "#EEF2FF";
              }}
              onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
            >
              <span>{item.label}</span>
              {item.shortcut && (
                <kbd
                  className="text-xs px-1.5 py-0.5 rounded"
                  style={{
                    color: "#5B7093",
                    backgroundColor: "#EEF2FF",
                    border: "1px solid #D8E2FA",
                    fontFamily: "inherit",
                  }}
                >
                  {item.shortcut}
                </kbd>
              )}
            </button>
          ))}
        </div>
      )}
    </>
  );
}

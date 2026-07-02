"use client";

import { useEffect, useRef, useState } from "react";
import { EditorProvider } from "@/context/EditorContext";
import { PageSettingsProvider } from "@/context/PageSettingsContext";
import { SearchProvider, useSearch } from "@/context/SearchContext";
import { ImagesProvider, useImages } from "@/context/ImagesContext";
import Toolbar from "@/components/organisms/Toolbar";
import DocumentCanvas from "@/components/organisms/DocumentCanvas";
import PageSettingsPanel from "@/components/organisms/PageSettingsPanel";
import SearchPanel from "@/components/organisms/SearchPanel";
import ImageUploadModal from "@/components/organisms/ImageUploadModal";
import NavDropdown from "@/components/molecules/NavDropdown";

/* ── NavBar — needs SearchContext + ImagesContext so lives inside providers ─ */

const STATIC_ITEMS_RIGHT = ["Formato", "Ayuda"];

function NavButton({ label }: { label: string }) {
  return (
    <button
      className="px-2 sm:px-3 py-1 text-xs sm:text-sm rounded transition-colors whitespace-nowrap"
      style={{ color: "#173B6C" }}
      onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#D8E2FA")}
      onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
    >
      {label}
    </button>
  );
}

function NavBar({ onRename }: { onRename: () => void }) {
  const { openFind, openReplace } = useSearch();
  const { openModal } = useImages();

  /* Global keyboard shortcuts */
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        openFind();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === "h") {
        e.preventDefault();
        openReplace();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [openFind, openReplace]);

  return (
    <nav
      className="px-3 flex items-center gap-1 shrink-0 overflow-x-auto border-b"
      style={{ backgroundColor: "#EEF2FF", borderColor: "#D8E2FA" }}
    >
      <NavDropdown
        label="Archivo"
        items={[
          { label: "Guardar como (.docx)", onClick: () => {}, disabled: true },
          { label: "Guardar como (PDF)",   onClick: () => {}, disabled: true },
          { label: "Compartir",            onClick: () => {}, disabled: true },
          { label: "Cambiar nombre",       onClick: onRename },
        ]}
      />

      <NavDropdown
        label="Editar"
        items={[
          { label: "Buscar",              shortcut: "Ctrl+F", onClick: openFind    },
          { label: "Buscar y reemplazar", shortcut: "Ctrl+H", onClick: openReplace },
        ]}
      />

      <NavDropdown
        label="Insertar"
        items={[
          { label: "Insertar imagen", onClick: openModal },
          { label: "Insertar tabla",  onClick: () => {}  },
        ]}
      />

      {STATIC_ITEMS_RIGHT.map((item) => (
        <NavButton key={item} label={item} />
      ))}
    </nav>
  );
}

/* ── Root layout ────────────────────────────────────────────────────────── */

export default function EditorLayout() {
  const [docName, setDocName] = useState("Documento sin título");
  const titleRef = useRef<HTMLInputElement>(null);

  const handleRename = () => {
    titleRef.current?.select();
    titleRef.current?.focus();
  };

  return (
    <EditorProvider>
      <PageSettingsProvider>
        <SearchProvider>
          <ImagesProvider>

            <div className="flex flex-col h-screen overflow-hidden bg-white">
              {/* Title bar */}
              <header
                className="text-white px-4 py-1.5 flex items-center justify-between shrink-0"
                style={{ background: "linear-gradient(90deg, #3B82F6 0%, #5965F2 50%, #7C4DFF 100%)" }}
              >
                <span className="text-sm font-semibold tracking-wide">SIETCO</span>
                <input
                  ref={titleRef}
                  value={docName}
                  onChange={(e) => setDocName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") titleRef.current?.blur(); }}
                  className="text-xs text-right bg-transparent border-b border-transparent focus:border-white/50 focus:outline-none transition-colors"
                  style={{ color: "#D8E2FA", minWidth: 160, maxWidth: 300 }}
                />
              </header>

              <NavBar onRename={handleRename} />
              <Toolbar />
              <DocumentCanvas />
            </div>

            {/* Overlays — fixed positioning */}
            <PageSettingsPanel />
            <SearchPanel />
            <ImageUploadModal />

          </ImagesProvider>
        </SearchProvider>
      </PageSettingsProvider>
    </EditorProvider>
  );
}

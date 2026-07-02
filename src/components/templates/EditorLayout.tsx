"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { EditorProvider } from "@/context/EditorContext";
import { PageSettingsProvider, usePageSettings } from "@/context/PageSettingsContext";
import { SearchProvider, useSearch } from "@/context/SearchContext";
import { ImagesProvider, useImages } from "@/context/ImagesContext";
import Toolbar from "@/components/organisms/Toolbar";
import DocumentCanvas from "@/components/organisms/DocumentCanvas";
import PageSettingsPanel from "@/components/organisms/PageSettingsPanel";
import SearchPanel from "@/components/organisms/SearchPanel";
import ImageUploadModal from "@/components/organisms/ImageUploadModal";
import NavDropdown from "@/components/molecules/NavDropdown";
import { useEditorContext } from "@/context/EditorContext";

/* ── Export helpers ─────────────────────────────────────────────────────── */

// Devuelve el HTML del editor sin los nodos spacer de paginación
function getCleanHtml(editorHtml: string): string {
  const tmp = document.createElement("div");
  tmp.innerHTML = editorHtml;
  tmp.querySelectorAll("[data-page-spacer]").forEach((el) => el.remove());
  return tmp.innerHTML;
}

// Renderiza el HTML en un div oculto, lo captura con html2canvas y genera
// un PDF de varias páginas A4 que se descarga directamente sin diálogo.
async function triggerPdfDownload(
  html: string,
  title: string,
  marginTopMm: number,
  marginBottomMm: number,
  marginLeftMm: number,
  marginRightMm: number,
) {
  const MM = 3.7795; // px por mm a 96 dpi

  // Contenedor oculto con el ancho y padding exactos de una hoja A4
  const container = document.createElement("div");
  Object.assign(container.style, {
    position:   "fixed",
    top:        "-99999px",
    left:       "-99999px",
    width:      "794px",
    background: "#ffffff",
    fontFamily: "Arial, sans-serif",
    fontSize:   "12pt",
    color:      "#000",
    lineHeight: "1.5",
    paddingTop:    `${marginTopMm    * MM}px`,
    paddingBottom: `${marginBottomMm * MM}px`,
    paddingLeft:   `${marginLeftMm   * MM}px`,
    paddingRight:  `${marginRightMm  * MM}px`,
  });
  container.innerHTML = `
    <style>
      p  { margin: 0 0 3px; }
      h1 { font-size: 2em;    font-weight: bold; margin: 8px 0; }
      h2 { font-size: 1.5em;  font-weight: bold; margin: 6px 0; }
      h3 { font-size: 1.17em; font-weight: bold; margin: 5px 0; }
      ul { list-style-type: disc;    padding-left: 1.5rem; margin: 4px 0; }
      ol { list-style-type: decimal; padding-left: 1.5rem; margin: 4px 0; }
      li { margin: 2px 0; }
      img    { max-width: 100%; height: auto; }
      strong { font-weight: bold; }
      em     { font-style: italic; }
      u      { text-decoration: underline; }
    </style>
    ${html}`;
  document.body.appendChild(container);

  try {
    const { default: html2canvas } = await import("html2canvas");
    const { jsPDF }                = await import("jspdf");

    const canvas = await html2canvas(container, {
      scale:           2,
      useCORS:         true,
      backgroundColor: "#ffffff",
    });

    const imgData  = canvas.toDataURL("image/jpeg", 0.92);
    const pdf      = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const pageW    = 210; // mm
    const pageH    = 297; // mm
    const imgH     = (canvas.height / canvas.width) * pageW;

    let posY       = 0;
    let remaining  = imgH;

    // Primera página
    pdf.addImage(imgData, "JPEG", 0, posY, pageW, imgH);
    remaining -= pageH;

    // Páginas adicionales si el contenido supera una hoja
    while (remaining > 0) {
      posY -= pageH;
      pdf.addPage();
      pdf.addImage(imgData, "JPEG", 0, posY, pageW, imgH);
      remaining -= pageH;
    }

    pdf.save(`${title}.pdf`);
  } finally {
    document.body.removeChild(container);
  }
}

// Crea un blob con cabeceras Office XML y lo descarga como .doc
// Word y LibreOffice pueden abrir este formato directamente
function triggerWordDownload(html: string, title: string) {
  const content = `<html
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:w="urn:schemas-microsoft-com:office:word"
  xmlns="http://www.w3.org/TR/REC-html40">
<head>
  <meta charset="utf-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; font-size: 12pt; }
    p  { margin: 0 0 3px; }
    h1 { font-size: 2em;    font-weight: bold; }
    h2 { font-size: 1.5em;  font-weight: bold; }
    h3 { font-size: 1.17em; font-weight: bold; }
    ul { list-style-type: disc;    padding-left: 1.5rem; }
    ol { list-style-type: decimal; padding-left: 1.5rem; }
    li { margin: 2px 0; }
    img    { max-width: 100%; }
    strong { font-weight: bold; }
    em     { font-style: italic; }
    u      { text-decoration: underline; }
  </style>
</head>
<body>${html}</body>
</html>`;

  const blob = new Blob(["﻿", content], { type: "application/msword" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `${title}.doc`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/* ── NavBar ─────────────────────────────────────────────────────────────── */

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

function NavBar({ onRename, docName }: { onRename: () => void; docName: string }) {
  const editor = useEditorContext();
  const { openFind, openReplace } = useSearch();
  const { openModal } = useImages();
  const { settings } = usePageSettings();

  const handleDownloadPdf = useCallback(async () => {
    if (!editor) return;
    await triggerPdfDownload(
      getCleanHtml(editor.getHTML()),
      docName,
      settings.marginTop,
      settings.marginBottom,
      settings.marginLeft,
      settings.marginRight,
    );
  }, [editor, docName, settings]);

  const handleDownloadWord = useCallback(() => {
    if (!editor) return;
    triggerWordDownload(getCleanHtml(editor.getHTML()), docName);
  }, [editor, docName]);

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
          { label: "Guardar como (.docx)", onClick: () => {}, disabled: true  },
          { label: "Guardar como (PDF)",   onClick: () => {}, disabled: true  },
          { label: "Descargar como PDF",             onClick: handleDownloadPdf  },
          { label: "Descargar como archivo de Word", onClick: handleDownloadWord },
          { label: "Compartir",            onClick: () => {}, disabled: true  },
          { label: "Cambiar nombre",       onClick: onRename                  },
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

              <NavBar onRename={handleRename} docName={docName} />
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

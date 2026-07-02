"use client";

import { useState, useRef } from "react";
import { X, Upload, Link2, Image as ImageIcon } from "lucide-react";
import { useImages } from "@/context/ImagesContext";
import { useEditorContext } from "@/context/EditorContext";

type SourceTab  = "upload" | "url";
type LayoutMode = "dynamic" | "fixed" | "front" | "back";

/* ── Layout visual icons (pure CSS divs) ──────────────────────────────────── */

function LayoutPreview({ mode, active }: { mode: LayoutMode; active: boolean }) {
  const c = active ? "#3B82F6" : "#C8D6F5";
  const t = active ? "#5B7093" : "#D8E2FA";

  const line = (extra?: React.CSSProperties): React.CSSProperties => ({
    height: 3,
    borderRadius: 2,
    backgroundColor: t,
    ...extra,
  });

  const box = (extra?: React.CSSProperties): React.CSSProperties => ({
    borderRadius: 2,
    backgroundColor: c,
    ...extra,
  });

  if (mode === "dynamic") {
    return (
      <div style={{ display:"flex", flexDirection:"column", gap:3, alignItems:"center", width:40, height:38, justifyContent:"center" }}>
        <div style={line({ width:"100%" })} />
        <div style={box({ width:22, height:18 })} />
        <div style={line({ width:"100%" })} />
      </div>
    );
  }

  if (mode === "fixed") {
    return (
      <div style={{ display:"flex", gap:3, width:40, height:38, alignItems:"center" }}>
        <div style={box({ width:14, height:26, flexShrink:0 })} />
        <div style={{ display:"flex", flexDirection:"column", gap:3, flex:1 }}>
          <div style={line({ width:"100%" })} />
          <div style={line({ width:"80%" })} />
          <div style={line({ width:"90%" })} />
        </div>
      </div>
    );
  }

  if (mode === "front") {
    return (
      <div style={{ position:"relative", width:40, height:38 }}>
        <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", gap:4, justifyContent:"center" }}>
          <div style={line({ width:"100%" })} />
          <div style={line({ width:"100%" })} />
          <div style={line({ width:"100%" })} />
        </div>
        <div style={box({ position:"absolute", top:5, left:4, right:4, bottom:5 })} />
      </div>
    );
  }

  /* back */
  return (
    <div style={{ position:"relative", width:40, height:38 }}>
      <div style={box({ position:"absolute", top:5, left:4, right:4, bottom:5, opacity:0.45 })} />
      <div style={{ position:"absolute", inset:0, display:"flex", flexDirection:"column", gap:4, justifyContent:"center" }}>
        <div style={line({ width:"100%", backgroundColor: active ? "#3B5280" : "#D8E2FA" })} />
        <div style={line({ width:"100%", backgroundColor: active ? "#3B5280" : "#D8E2FA" })} />
        <div style={line({ width:"100%", backgroundColor: active ? "#3B5280" : "#D8E2FA" })} />
      </div>
    </div>
  );
}

const LAYOUTS: { mode: LayoutMode; label: string; desc: string }[] = [
  { mode: "dynamic", label: "Dinámica",  desc: "Texto empuja la imagen"  },
  { mode: "fixed",   label: "Fija",      desc: "Texto rodea la imagen"   },
  { mode: "front",   label: "Delante",   desc: "Encima del texto"        },
  { mode: "back",    label: "Detrás",    desc: "Debajo del texto"        },
];

/* ── Modal ────────────────────────────────────────────────────────────────── */

export default function ImageUploadModal() {
  const { modalOpen, closeModal, addImage } = useImages();
  const editor = useEditorContext();
  const fileRef = useRef<HTMLInputElement>(null);

  const [tab,     setTab]     = useState<SourceTab>("upload");
  const [fileSrc, setFileSrc] = useState("");
  const [urlSrc,  setUrlSrc]  = useState("");
  const [layout,  setLayout]  = useState<LayoutMode>("dynamic");
  const [dragOver, setDragOver] = useState(false);

  if (!modalOpen) return null;

  const preview = tab === "upload" ? fileSrc : urlSrc;

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => setFileSrc(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const reset = () => {
    setFileSrc("");
    setUrlSrc("");
    setLayout("dynamic");
    setTab("upload");
    setDragOver(false);
  };

  const handleInsert = () => {
    if (!preview) return;

    if (layout === "front" || layout === "back") {
      addImage({ src: preview, x: 60, y: 100, width: 280, mode: layout });
    } else {
      editor?.commands.insertContent({
        type: "image",
        attrs: { src: preview, "data-layout": layout, "data-width": "280" },
      });
    }

    closeModal();
    reset();
  };

  const handleClose = () => { closeModal(); reset(); };

  /* ── Render ─────────────────────────────────────────────────────────────── */

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ backgroundColor: "rgba(23,59,108,0.42)" }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <div
        className="w-full max-w-[480px] rounded-2xl overflow-hidden"
        style={{
          backgroundColor: "#FFFFFF",
          border: "1px solid #D8E2FA",
          boxShadow: "0 20px 60px rgba(89,101,242,0.28)",
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{ background: "linear-gradient(90deg,#3B82F6,#7C4DFF)" }}
        >
          <div className="flex items-center gap-2">
            <ImageIcon size={14} color="white" />
            <span className="text-sm font-semibold text-white">Insertar imagen</span>
          </div>
          <button
            onClick={handleClose}
            className="w-6 h-6 flex items-center justify-center rounded transition-colors"
            style={{ color: "rgba(255,255,255,0.8)" }}
            onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "rgba(255,255,255,0.2)")}
            onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "transparent")}
          >
            <X size={13} />
          </button>
        </div>

        <div className="p-5 flex flex-col gap-4">

          {/* Source tabs */}
          <div
            className="flex p-0.5 rounded-lg gap-1"
            style={{ backgroundColor: "#EEF2FF" }}
          >
            {(["upload", "url"] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className="flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-medium rounded-md"
                style={{
                  backgroundColor: tab === t ? "#FFFFFF" : "transparent",
                  color: tab === t ? "#173B6C" : "#5B7093",
                  boxShadow: tab === t ? "0 1px 4px rgba(89,101,242,0.12)" : "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                }}
              >
                {t === "upload" ? <Upload size={11} /> : <Link2 size={11} />}
                {t === "upload" ? "Subir archivo" : "Desde URL"}
              </button>
            ))}
          </div>

          {/* Upload drop zone */}
          {tab === "upload" && (
            <div
              onClick={() => fileRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setDragOver(false);
                if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
              }}
              className="rounded-xl flex items-center justify-center overflow-hidden cursor-pointer"
              style={{
                border: `2px dashed ${dragOver ? "#3B82F6" : "#D8E2FA"}`,
                backgroundColor: dragOver ? "rgba(59,130,246,0.06)" : "#F5F8FF",
                minHeight: 130,
                transition: "all 0.15s ease",
              }}
            >
              {fileSrc ? (
                <img
                  src={fileSrc}
                  alt="preview"
                  style={{ maxHeight: 170, maxWidth: "100%", objectFit: "contain", display: "block" }}
                />
              ) : (
                <div
                  className="flex flex-col items-center gap-2"
                  style={{ color: "#5B7093", padding: "24px 0" }}
                >
                  <Upload size={26} color="#3B82F6" />
                  <span className="text-sm font-medium" style={{ color: "#173B6C" }}>
                    Arrastra una imagen aquí
                  </span>
                  <span className="text-xs" style={{ color: "#5B7093" }}>
                    o haz clic para seleccionar · PNG, JPG, GIF, WEBP
                  </span>
                </div>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => { if (e.target.files?.[0]) handleFile(e.target.files[0]); }}
              />
            </div>
          )}

          {/* URL input */}
          {tab === "url" && (
            <div className="flex flex-col gap-2">
              <input
                type="url"
                value={urlSrc}
                onChange={(e) => setUrlSrc(e.target.value)}
                placeholder="https://ejemplo.com/imagen.jpg"
                className="w-full h-9 px-3 text-sm rounded-lg border focus:outline-none"
                style={{
                  color: "#173B6C",
                  backgroundColor: "#F5F8FF",
                  borderColor: "#D8E2FA",
                }}
                onFocus={(e) => (e.currentTarget.style.borderColor = "#3B82F6")}
                onBlur={(e) => (e.currentTarget.style.borderColor = "#D8E2FA")}
              />
              {urlSrc && (
                <div
                  className="rounded-xl overflow-hidden flex items-center justify-center"
                  style={{ backgroundColor: "#F5F8FF", minHeight: 80, border: "1px solid #D8E2FA" }}
                >
                  <img
                    src={urlSrc}
                    alt="preview"
                    style={{ maxHeight: 150, maxWidth: "100%", objectFit: "contain", display: "block" }}
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Layout picker */}
          <div>
            <p className="text-xs font-semibold mb-2" style={{ color: "#5B7093", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Posición en el documento
            </p>
            <div className="grid grid-cols-4 gap-2">
              {LAYOUTS.map(({ mode, label, desc }) => {
                const active = layout === mode;
                return (
                  <button
                    key={mode}
                    onClick={() => setLayout(mode)}
                    className="flex flex-col items-center gap-1.5 py-2.5 px-1 rounded-xl border transition-all"
                    style={{
                      borderColor: active ? "#3B82F6" : "#D8E2FA",
                      backgroundColor: active ? "#EEF2FF" : "#FAFBFF",
                      boxShadow: active ? "0 0 0 2px rgba(59,130,246,0.18)" : "none",
                      cursor: "pointer",
                    }}
                  >
                    <LayoutPreview mode={mode} active={active} />
                    <span
                      className="text-xs font-semibold"
                      style={{ color: active ? "#3B82F6" : "#173B6C" }}
                    >
                      {label}
                    </span>
                    <span
                      style={{
                        fontSize: 9,
                        color: "#5B7093",
                        lineHeight: 1.3,
                        textAlign: "center",
                      }}
                    >
                      {desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Insert button */}
          <button
            onClick={handleInsert}
            disabled={!preview}
            className="w-full py-2.5 rounded-xl text-sm font-semibold text-white"
            style={{
              background: preview
                ? "linear-gradient(90deg,#3B82F6,#7C4DFF)"
                : "#D8E2FA",
              cursor: preview ? "pointer" : "not-allowed",
              border: "none",
              transition: "opacity 0.15s ease",
              opacity: preview ? 1 : 0.65,
            }}
          >
            Insertar imagen
          </button>

        </div>
      </div>
    </div>
  );
}

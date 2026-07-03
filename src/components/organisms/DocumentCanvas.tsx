"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { EditorContent } from "@tiptap/react";
import { Editor } from "@tiptap/core";
import { X } from "lucide-react";
import { useEditorContext } from "@/context/EditorContext";
import { usePageSettings, PageSettings } from "@/context/PageSettingsContext";
import { useImages, OverlayImage } from "@/context/ImagesContext";

/* ── A4 constants ───────────────────────────────────────────────────────── */

const MM       = 3.7795;
const A4_W     = 794;
const A4_H     = 1123;
const PAGE_GAP = 24;

/* ─────────────────────────────────────────────────────────────────────────
   syncSpacers — the correct page-break engine
   ─────────────────────────────────────────────────────────────────────────
   Instead of setting style.marginTop on DOM nodes (which ProseMirror wipes
   on every re-render), we insert real PageSpacer nodes into the ProseMirror
   document at page boundaries.  ProseMirror owns those nodes and won't
   destroy them. A `spacerSyncing` flag breaks the update → dispatch → update
   loop that would otherwise be infinite.

   Algorithm:
     1. Walk state.doc + DOM children in parallel.
        - Accumulate existing spacer doc-sizes and visual heights so we can
          derive each content block's "natural" position (where it would be
          without any spacers).
     2. With natural positions known, replay the page-break logic to compute
        which blocks need a spacer before them and how tall each spacer must be.
     3. Compare needed spacers vs current spacers. Skip dispatch if equal.
     4. Build one transaction: delete old spacers (back-to-front) then insert
        new ones (back-to-front, using tr.mapping.map for correct positions).
        Mark with addToHistory:false so it never lands on the undo stack.
   ───────────────────────────────────────────────────────────────────────── */

let spacerSyncing = false;

function syncSpacers(
  editor: Editor,
  pageWrapper: HTMLElement,
  marginTopMm: number,
  marginBottomMm: number,
): void {
  if (spacerSyncing) return;

  const { state } = editor;
  const pmEl      = editor.view.dom as HTMLElement;
  const wrapRect  = pageWrapper.getBoundingClientRect();

  // ── Walk document + DOM children in parallel ──────────────────────────
  const currentSpacers: Array<{
    from:          number;
    nodeSize:      number;
    height:        number;
    naturalDocPos: number; // position if no spacers existed
  }> = [];

  const contentBlocks: Array<{
    originalDocPos: number; // real offset in state.doc (for tr.mapping.map)
    naturalDocPos:  number; // same minus all prior spacer node-sizes
    naturalTop:     number; // visual top minus all prior spacer pixel heights
    h:              number;
  }> = [];

  let spacerDocSize  = 0; // cumulative nodeSize of spacers before this node
  let spacerPixelH   = 0; // cumulative visual height of spacers before this node
  let domIdx         = 0;
  const domKids      = Array.from(pmEl.children) as HTMLElement[];

  state.doc.forEach((node, offset) => {
    const el = domKids[domIdx++];

    if (node.type.name === "pageSpacer") {
      currentSpacers.push({
        from:          offset,
        nodeSize:      node.nodeSize,
        height:        node.attrs.height as number,
        naturalDocPos: offset - spacerDocSize,
      });
      spacerDocSize += node.nodeSize;
      spacerPixelH  += node.attrs.height as number;
      return;
    }

    if (!el) return;
    const r = el.getBoundingClientRect();
    contentBlocks.push({
      originalDocPos: offset,
      naturalDocPos:  offset - spacerDocSize,
      naturalTop:     r.top - wrapRect.top - spacerPixelH,
      h:              r.height,
    });
  });

  // ── Calculate needed spacers ──────────────────────────────────────────
  const mTop = marginTopMm    * MM; // px
  const mBot = marginBottomMm * MM; // px

  const neededSpacers: Array<{
    originalDocPos: number;
    naturalDocPos:  number;
    height:         number;
  }> = [];
  let addedH = 0;

  for (const { originalDocPos, naturalDocPos, naturalTop, h } of contentBlocks) {
    const y  = naturalTop + addedH;
    const pi = Math.floor(y / (A4_H + PAGE_GAP));

    // Bottom of the writable area of page pi (before bottom margin)
    const pageEnd   = pi       * (A4_H + PAGE_GAP) + A4_H - mBot;
    // Top of the writable area of page pi+1 (after top margin)
    const nextStart = (pi + 1) * (A4_H + PAGE_GAP) + mTop;
    // Top of the writable area of the current page (only relevant for pi > 0,
    // because page 0's offset is already baked in by the header + padding)
    const pageWritableTop = pi > 0 ? pi * (A4_H + PAGE_GAP) + mTop : 0;

    let push = 0;
    if (pi > 0 && y < pageWritableTop) {
      // block landed in the top-margin zone of this page → push to writable area
      push = pageWritableTop - y;
    } else if (y >= pageEnd) {
      // block starts in the bottom margin, gray gap, or top margin → next page
      push = nextStart - y;
    } else if (y + h > pageEnd && h < A4_H) {
      // block crosses the bottom margin (fits on one page) → push whole block
      push = nextStart - y;
    }

    if (push > 0) {
      neededSpacers.push({
        originalDocPos,
        naturalDocPos,
        height: Math.ceil(push),
      });
      addedH += push;
    }
  }

  // ── Equality check — avoid unnecessary dispatch ───────────────────────
  const same =
    currentSpacers.length === neededSpacers.length &&
    neededSpacers.every(
      (ns, i) =>
        ns.naturalDocPos === currentSpacers[i].naturalDocPos &&
        ns.height        === currentSpacers[i].height
    );
  if (same) return;

  // ── Build transaction ─────────────────────────────────────────────────
  const tr = state.tr;

  // 1. Delete existing spacers back-to-front (preserves unprocessed positions)
  for (let i = currentSpacers.length - 1; i >= 0; i--) {
    const s = currentSpacers[i];
    tr.delete(s.from, s.from + s.nodeSize);
  }

  // 2. Insert new spacers back-to-front.
  //    tr.mapping.map(originalDocPos) accounts for ALL prior steps in tr
  //    (the deletions above), so the insertion lands exactly before the
  //    target block even though document positions have shifted.
  const spacerType = state.schema.nodes.pageSpacer;
  if (!spacerType) return; // extension not registered — should not happen

  for (let i = neededSpacers.length - 1; i >= 0; i--) {
    const ns   = neededSpacers[i];
    const node = spacerType.create({ height: ns.height });
    tr.insert(tr.mapping.map(ns.originalDocPos), node);
  }

  tr.setMeta("addToHistory", false); // spacer adjustments don't pollute undo

  spacerSyncing = true;
  try {
    editor.view.dispatch(tr);
  } finally {
    spacerSyncing = false;
  }
}

/* ── Margin guide lines (one set per page) ──────────────────────────────── */
//
// Each page card gets its own set of 4 guides positioned with absolute `top`
// and explicit `height` so they never bleed into adjacent pages or the gap.
// Labels are shown only on the first page to avoid visual clutter.

function MarginGuides({
  s,
  pageTop,
  showLabels,
}: {
  s:          PageSettings;
  pageTop:    number;  // px from wrapper top where this page card starts
  showLabels: boolean;
}) {
  const t = s.marginTop    * MM;
  const b = s.marginBottom * MM;
  const l = s.marginLeft   * MM;
  const r = s.marginRight  * MM;

  const base: React.CSSProperties = {
    position: "absolute",
    pointerEvents: "none",
    zIndex: 41,
  };

  const chip = (extra: React.CSSProperties): React.CSSProperties => ({
    position: "absolute", fontSize: 10, backgroundColor: "white",
    padding: "1px 5px", borderRadius: 3, pointerEvents: "none", ...extra,
  });

  return (
    <>
      {/* ── Top margin line ── */}
      <div style={{
        ...base,
        top: pageTop + t, left: 0, right: 0, height: 1,
        background: "rgba(59,130,246,0.55)",
        borderTop: "1px dashed rgba(59,130,246,0.8)",
      }}>
        {showLabels && (
          <span style={chip({ top: 3, left: "50%", transform: "translateX(-50%)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.3)" })}>
            {s.marginTop} mm
          </span>
        )}
      </div>

      {/* ── Bottom margin line ── */}
      <div style={{
        ...base,
        top: pageTop + A4_H - b, left: 0, right: 0, height: 1,
        background: "rgba(59,130,246,0.55)",
        borderTop: "1px dashed rgba(59,130,246,0.8)",
      }}>
        {showLabels && (
          <span style={chip({ bottom: 3, left: "50%", transform: "translateX(-50%)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.3)" })}>
            {s.marginBottom} mm
          </span>
        )}
      </div>

      {/* ── Left margin line ── */}
      <div style={{
        ...base,
        top: pageTop, height: A4_H, left: l, width: 1,
        background: "rgba(124,77,255,0.55)",
        borderLeft: "1px dashed rgba(124,77,255,0.8)",
      }}>
        {showLabels && (
          <span style={chip({ top: "50%", left: 4, transform: "translateY(-50%)", color: "#7C4DFF", border: "1px solid rgba(124,77,255,0.3)", writingMode: "vertical-rl", rotate: "180deg" })}>
            {s.marginLeft} mm
          </span>
        )}
      </div>

      {/* ── Right margin line ── */}
      <div style={{
        ...base,
        top: pageTop, height: A4_H, right: r, width: 1,
        background: "rgba(124,77,255,0.55)",
        borderRight: "1px dashed rgba(124,77,255,0.8)",
      }}>
        {showLabels && (
          <span style={chip({ top: "50%", right: 4, transform: "translateY(-50%)", color: "#7C4DFF", border: "1px solid rgba(124,77,255,0.3)", writingMode: "vertical-rl" })}>
            {s.marginRight} mm
          </span>
        )}
      </div>
    </>
  );
}

/* ── Draggable overlay image ────────────────────────────────────────────── */

function DraggableOverlay({
  img, pageRef,
}: {
  img: OverlayImage;
  pageRef: React.RefObject<HTMLDivElement | null>;
}) {
  const { updateImage, removeImage } = useImages();
  const [dragging, setDragging] = useState(false);
  const [selected, setSelected] = useState(false);
  const startRef = useRef({ mouseX: 0, mouseY: 0, imgX: 0, imgY: 0 });

  const onMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).dataset.action === "delete") return;
    e.preventDefault();
    e.stopPropagation();
    setSelected(true);
    startRef.current = { mouseX: e.clientX, mouseY: e.clientY, imgX: img.x, imgY: img.y };
    setDragging(true);
  };

  useEffect(() => {
    if (!dragging) return;
    const onMove = (e: MouseEvent) => {
      const r = pageRef.current?.getBoundingClientRect();
      if (!r) return;
      updateImage(img.id, {
        x: Math.max(0, Math.min(startRef.current.imgX + e.clientX - startRef.current.mouseX, r.width - img.width)),
        y: Math.max(0, startRef.current.imgY + e.clientY - startRef.current.mouseY),
      });
    };
    const onUp = () => setDragging(false);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup",  onUp);
    return () => {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup",  onUp);
    };
  }, [dragging, img.id, img.width, updateImage, pageRef]);

  useEffect(() => {
    if (!selected) return;
    const onDown = () => setSelected(false);
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [selected]);

  /* ── "Detrás": visual behind content + interactive handle strip above it ── */
  if (img.mode === "back") {
    return (
      <>
        {/* Image: z-2 (behind content). Rises to z-15 while dragging so the
            user can see where it's landing. pointer-events:none always so the
            handle strip (z-30) is the only interactive surface. */}
        <div style={{
          position: "absolute", top: img.y, left: img.x, width: img.width,
          zIndex: dragging ? 15 : 2,
          pointerEvents: "none",
          opacity: dragging ? 0.75 : 1,
          outline: selected ? "2px solid #7C4DFF" : "none",
          outlineOffset: 2, borderRadius: 2,
        }}>
          <img src={img.src} alt="" draggable={false}
            style={{ width: "100%", display: "block", borderRadius: 2 }} />
        </div>

        {/* Handle strip: always above content (z-30). Dragging from here moves
            the image. The strip is narrow so it doesn't block much text. */}
        <div
          onMouseDown={onMouseDown}
          style={{
            position: "absolute",
            top: img.y, left: img.x, width: img.width,
            height: 22,
            zIndex: 30,
            cursor: dragging ? "grabbing" : "grab",
            userSelect: "none",
            background: selected
              ? "rgba(124,77,255,0.28)"
              : "rgba(124,77,255,0.13)",
            borderRadius: "2px 2px 0 0",
            display: "flex", alignItems: "center",
            justifyContent: "space-between",
            padding: "0 6px",
          }}
        >
          <span style={{ fontSize: 9, color: "#7C4DFF", fontWeight: 600,
            letterSpacing: "0.04em", pointerEvents: "none" }}>
            ⠿ Detrás del texto
          </span>
          {selected && (
            <button
              data-action="delete"
              onMouseDown={(e) => e.stopPropagation()}
              onClick={() => removeImage(img.id)}
              style={{
                width: 16, height: 16, borderRadius: "50%",
                border: "1.5px solid white", backgroundColor: "#7C4DFF",
                color: "white", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 11, lineHeight: 1, padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>
      </>
    );
  }

  /* ── "Delante": full interactive div above content ── */
  return (
    <div
      onMouseDown={onMouseDown}
      style={{
        position: "absolute", top: img.y, left: img.x, width: img.width,
        zIndex: 20,
        cursor: dragging ? "grabbing" : "grab",
        userSelect: "none",
        outline: selected ? "2px solid #3B82F6" : "2px solid transparent",
        outlineOffset: 2, borderRadius: 2,
      }}
    >
      <img
        src={img.src} alt="" draggable={false}
        style={{ width: "100%", display: "block", pointerEvents: "none", borderRadius: 2 }}
      />
      {selected && (
        <>
          <button
            data-action="delete"
            onMouseDown={(e) => e.stopPropagation()}
            onClick={() => removeImage(img.id)}
            style={{
              position: "absolute", top: -10, right: -10,
              width: 20, height: 20, borderRadius: "50%",
              border: "2px solid white", backgroundColor: "#7C4DFF",
              color: "white", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 6px rgba(0,0,0,0.25)", zIndex: 1,
            }}
          >
            <X size={10} />
          </button>
          <div style={{
            position: "absolute", bottom: -20, left: "50%",
            transform: "translateX(-50%)", fontSize: 9,
            color: "#3B82F6", backgroundColor: "white",
            border: "1px solid #D8E2FA", borderRadius: 3,
            padding: "1px 5px", whiteSpace: "nowrap", pointerEvents: "none",
          }}>
            Delante del texto
          </div>
        </>
      )}
    </div>
  );
}

/* ── Main component ─────────────────────────────────────────────────────── */

export default function DocumentCanvas() {
  const editor    = useEditorContext();
  const { settings, panelOpen, setPanelOpen } = usePageSettings();
  const { images } = useImages();

  const pageWrapRef = useRef<HTMLDivElement>(null);
  const contentRef  = useRef<HTMLDivElement>(null);

  const [contentH, setContentH] = useState(A4_H);

  // Ref so event handlers (registered once) always read the latest margins
  const settingsRef = useRef(settings);
  useEffect(() => { settingsRef.current = settings; }, [settings]);

  // Convenience: call syncSpacers with the current margins from the ref
  const sync = () => {
    if (!editor || !pageWrapRef.current) return;
    syncSpacers(
      editor,
      pageWrapRef.current,
      settingsRef.current.marginTop,
      settingsRef.current.marginBottom,
    );
  };

  /* ── Track content height for dynamic page count ── */
  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) =>
      setContentH(Math.max(A4_H, entry.contentRect.height))
    );
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  /* ── Sync spacers after every TipTap DOM update ──
        editor.on('update') fires synchronously AFTER ProseMirror has written
        the new content to the DOM but BEFORE the browser paints. ── */
  useEffect(() => {
    if (!editor) return;
    const handle = () => sync();
    editor.on("update", handle);
    editor.on("create", handle);
    return () => {
      editor.off("update", handle);
      editor.off("create", handle);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  /* ── Re-sync when margins/settings change ── */
  useLayoutEffect(() => {
    sync();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings]);

  /* ── Re-sync on window resize (different line-wrapping → different heights) ── */
  useEffect(() => {
    const handle = () => sync();
    window.addEventListener("resize", handle);
    return () => window.removeEventListener("resize", handle);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor]);

  /* ── Initial run after hydration (editor takes a frame to mount) ── */
  useEffect(() => {
    const id = setTimeout(() => sync(), 150);
    return () => clearTimeout(id);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageCount = Math.max(1, Math.ceil(contentH / A4_H));
  const docMinH   = pageCount * A4_H + (pageCount - 1) * PAGE_GAP;

  return (
    <div
      className="flex-1 overflow-auto"
      style={{ backgroundColor: "#B8C8E8", padding: "32px 24px" }}
      onClick={() => editor?.commands.focus()}
    >
      {/* ── Page wrapper ── */}
      <div
        ref={pageWrapRef}
        style={{
          position: "relative",
          width: A4_W,
          minHeight: docMinH,
          margin: "0 auto",
          isolation: "isolate",
        }}
        onContextMenu={(e) => { e.preventDefault(); setPanelOpen(true); }}
      >

        {/* ── Page background cards (z 0) ── */}
        {Array.from({ length: pageCount }, (_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              top: i * (A4_H + PAGE_GAP),
              left: 0, right: 0,
              height: A4_H,
              backgroundColor: "white",
              boxShadow:
                "0 1px 3px rgba(0,0,0,0.12), 0 4px 16px rgba(89,101,242,0.14), 0 0 0 1px rgba(89,101,242,0.06)",
              borderRadius: 2,
              zIndex: 0,
            }}
          >
            <span style={{
              position: "absolute", bottom: 6, right: 10,
              fontSize: 9, color: "#C8D6F5",
              pointerEvents: "none", userSelect: "none",
            }}>
              {i + 1} / {pageCount}
            </span>
          </div>
        ))}

        {/* ── Margin guides: one set per page (z 41) ── */}
        {panelOpen && Array.from({ length: pageCount }, (_, i) => (
          <MarginGuides
            key={i}
            s={settings}
            pageTop={i * (A4_H + PAGE_GAP)}
            showLabels={i === 0}
          />
        ))}

        {/* ── Back overlay images (z 2) ── */}
        {images.filter((img) => img.mode === "back").map((img) => (
          <DraggableOverlay key={img.id} img={img} pageRef={pageWrapRef} />
        ))}

        {/* ── Content layer (z 10) ── */}
        <div ref={contentRef} style={{ position: "relative", zIndex: 10 }}>

          {/* Header */}
          <div style={{
            borderBottom: "1px solid #D8E2FA",
            paddingLeft:  `${settings.marginLeft  * MM}px`,
            paddingRight: `${settings.marginRight * MM}px`,
            minHeight: 34,
            display: "flex",
            alignItems: "center",
          }}>
            {settings.header ? (
              <span style={{ color: "#5B7093", fontSize: 11 }}>{settings.header}</span>
            ) : (
              <span style={{ color: "#C8D6F5", fontSize: 11, fontStyle: "italic" }}>
                Encabezado — clic derecho para editar
              </span>
            )}
          </div>

          {/* Editable content */}
          <div style={{
            paddingTop:    `${settings.marginTop    * MM}px`,
            paddingBottom: `${settings.marginBottom * MM}px`,
            paddingLeft:   `${settings.marginLeft   * MM}px`,
            paddingRight:  `${settings.marginRight  * MM}px`,
            color: "#173B6C",
            fontFamily: "Arial, sans-serif",
            fontSize: "12pt",
            lineHeight: settings.lineHeight,
          }}>
            <EditorContent editor={editor} />
          </div>

          {/* Footer */}
          <div style={{
            borderTop: "1px solid #D8E2FA",
            paddingLeft:  `${settings.marginLeft  * MM}px`,
            paddingRight: `${settings.marginRight * MM}px`,
            minHeight: 34,
            display: "flex",
            alignItems: "center",
          }}>
            {settings.footer ? (
              <span style={{ color: "#5B7093", fontSize: 11 }}>{settings.footer}</span>
            ) : (
              <span style={{ color: "#C8D6F5", fontSize: 11, fontStyle: "italic" }}>
                Pie de página — clic derecho para editar
              </span>
            )}
          </div>
        </div>

        {/* ── Front overlay images (z 20) ── */}
        {images.filter((img) => img.mode === "front").map((img) => (
          <DraggableOverlay key={img.id} img={img} pageRef={pageWrapRef} />
        ))}

      </div>
    </div>
  );
}

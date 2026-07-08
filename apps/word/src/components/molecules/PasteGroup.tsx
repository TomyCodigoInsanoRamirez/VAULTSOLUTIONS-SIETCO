"use client";

import { Clipboard, ClipboardX } from "lucide-react";
import { Editor } from "@tiptap/react";
import { ToolbarButton } from "@sietco/ui";

interface PasteGroupProps {
  editor: Editor | null;
}

export async function pasteWithFormat(editor: Editor) {
  try {
    const items = await navigator.clipboard.read();
    for (const item of items) {
      if (item.types.includes("text/html")) {
        const blob = await item.getType("text/html");
        const html = await blob.text();
        editor.chain().focus().insertContent(html).run();
        return;
      }
      if (item.types.includes("text/plain")) {
        const blob = await item.getType("text/plain");
        const text = await blob.text();
        editor.chain().focus().insertContent(text).run();
        return;
      }
    }
  } catch {
    // fallback para navegadores sin soporte de clipboard.read()
    editor.view.dom.focus();
    document.execCommand("paste");
  }
}

export async function pasteWithoutFormat(editor: Editor) {
  try {
    const text = await navigator.clipboard.readText();
    editor.chain().focus().insertContent(text).run();
  } catch {
    // permisos de portapapeles denegados
  }
}

export default function PasteGroup({ editor }: PasteGroupProps) {
  return (
    <div className="flex items-center gap-0.5">
      <ToolbarButton
        tooltip="Pegar (con formato)"
        onMouseDown={(e) => { e.preventDefault(); if (editor) void pasteWithFormat(editor); }}
      >
        <Clipboard size={15} />
      </ToolbarButton>
      <ToolbarButton
        tooltip="Pegar sin formato"
        onMouseDown={(e) => { e.preventDefault(); if (editor) pasteWithoutFormat(editor); }}
      >
        <ClipboardX size={15} />
      </ToolbarButton>
    </div>
  );
}

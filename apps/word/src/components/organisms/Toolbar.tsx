"use client";

import { useEffect, useState } from "react";
import { useEditorContext } from "@/context/EditorContext";
import { FormatGroup, FontSelector, AlignGroup, Divider } from "@sietco/ui";
import ListGroup from "@/components/molecules/ListGroup";
import PasteGroup from "@/components/molecules/PasteGroup";

export default function Toolbar() {
  const editor = useEditorContext();
  const [, tick] = useState(0);

  // Re-renderiza el toolbar en cada transacción del editor
  useEffect(() => {
    if (!editor) return;
    const update = () => tick((n) => n + 1);
    editor.on("transaction", update);
    return () => { editor.off("transaction", update); };
  }, [editor]);

  const activeFormats = new Set<string>([
    editor?.isActive("bold")      ? "bold"          : null,
    editor?.isActive("italic")    ? "italic"        : null,
    editor?.isActive("underline") ? "underline"     : null,
    editor?.isActive("strike")    ? "strikeThrough" : null,
  ].filter(Boolean) as string[]);

  const activeAlign =
    (["left", "center", "right", "justify"] as const).find(
      (a) => editor?.isActive({ textAlign: a })
    ) ?? "left";

  const currentFont =
    editor?.getAttributes("textStyle").fontFamily ?? "Arial";
  const currentSize =
    editor?.getAttributes("textStyle").fontSize?.replace("pt", "") ?? "12";

  const handleFormat = (format: string) => {
    if (!editor) return;
    const c = editor.chain().focus();
    if (format === "bold")          c.toggleBold().run();
    else if (format === "italic")   c.toggleItalic().run();
    else if (format === "underline") c.toggleUnderline().run();
    else if (format === "strikeThrough") c.toggleStrike().run();
  };

  const handleAlign = (align: "left" | "center" | "right" | "justify") => {
    editor?.chain().focus().setTextAlign(align).run();
  };

  const handleFont = (font: string) => {
    editor?.chain().focus().setFontFamily(font).run();
  };

  const handleSize = (size: string) => {
    editor?.chain().focus().setFontSize(`${size}pt`).run();
  };

  const handleList = (command: string) => {
    if (!editor) return;
    const c = editor.chain().focus();
    if (command === "insertUnorderedList") c.toggleBulletList().run();
    else if (command === "insertOrderedList") c.toggleOrderedList().run();
    else if (command === "undo") c.undo().run();
    else if (command === "redo") c.redo().run();
  };

  return (
    <div
      className="px-3 py-1.5 flex items-center flex-wrap gap-1 overflow-x-auto border-b"
      style={{ backgroundColor: "#EEF2FF", borderColor: "#D8E2FA" }}
    >
      <ListGroup onCommand={handleList} />
      <Divider />
      <FontSelector
        font={currentFont}
        size={currentSize}
        onFontChange={handleFont}
        onSizeChange={handleSize}
      />
      <Divider />
      <FormatGroup activeFormats={activeFormats} onFormat={handleFormat} />
      <Divider />
      <AlignGroup activeAlign={activeAlign} onAlign={handleAlign} />
      <Divider />
      <PasteGroup editor={editor} />
    </div>
  );
}

"use client";

import { createContext, useContext, ReactNode } from "react";
import { useEditor, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { TextStyle } from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import TextAlign from "@tiptap/extension-text-align";
import Placeholder from "@tiptap/extension-placeholder";
import { FontSize } from "@/extensions/FontSize";
import { Indent } from "@/extensions/Indent";
import { SearchExtension } from "@/extensions/SearchExtension";
import { CustomImage } from "@/extensions/Image";
import { PageSpacer } from "@/extensions/PageSpacer";

const LOREM = `<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.</p><p>Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas semper.</p><p>Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci.</p>`;

const EditorCtx = createContext<Editor | null>(null);

export function EditorProvider({ children }: { children: ReactNode }) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      FontFamily,
      FontSize,
      Indent,
      SearchExtension,
      CustomImage,
      PageSpacer,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      Placeholder.configure({ placeholder: "Comienza a escribir aquí..." }),
    ],
    content: LOREM,
    editorProps: {
      attributes: {
        class: "outline-none min-h-full focus:outline-none",
      },
    },
  });

  return <EditorCtx.Provider value={editor}>{children}</EditorCtx.Provider>;
}

export function useEditorContext() {
  return useContext(EditorCtx);
}

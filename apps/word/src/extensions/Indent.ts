import { Extension } from "@tiptap/core";

const INDENT_SIZE = 24;

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    indent: {
      indent: () => ReturnType;
      outdent: () => ReturnType;
    };
  }
}

export const Indent = Extension.create({
  name: "indent",

  addOptions() {
    return { types: ["paragraph", "heading"], min: 0, max: 10 };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          indent: {
            default: 0,
            parseHTML: (el) => {
              const ml = el.style.marginLeft;
              return ml ? Math.round(parseInt(ml) / INDENT_SIZE) : 0;
            },
            renderHTML: (attrs) =>
              attrs.indent > 0
                ? { style: `margin-left: ${attrs.indent * INDENT_SIZE}px` }
                : {},
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      indent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const next = Math.min((node.attrs.indent ?? 0) + 1, this.options.max);
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
            }
          });
          dispatch?.(tr);
          return true;
        },

      outdent:
        () =>
        ({ tr, state, dispatch }) => {
          const { from, to } = state.selection;
          state.doc.nodesBetween(from, to, (node, pos) => {
            if (this.options.types.includes(node.type.name)) {
              const next = Math.max((node.attrs.indent ?? 0) - 1, this.options.min);
              tr.setNodeMarkup(pos, undefined, { ...node.attrs, indent: next });
            }
          });
          dispatch?.(tr);
          return true;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.editor.isActive("listItem"))
          return this.editor.commands.sinkListItem("listItem");
        return this.editor.commands.indent();
      },
      "Shift-Tab": () => {
        if (this.editor.isActive("listItem"))
          return this.editor.commands.liftListItem("listItem");
        return this.editor.commands.outdent();
      },
    };
  },
});

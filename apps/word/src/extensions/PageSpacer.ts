import { Node } from "@tiptap/core";

/**
 * PageSpacer — invisible block node injected at page boundaries.
 * ProseMirror owns this node, so it survives re-renders.
 * DocumentCanvas measures content positions and syncs spacers automatically.
 */
export const PageSpacer = Node.create({
  name: "pageSpacer",
  group: "block",
  atom: true,        // not splittable, cursor never enters it
  selectable: false, // user can't select it
  draggable: false,

  addAttributes() {
    return {
      height: { default: 0 },
    };
  },

  parseHTML() {
    return [{
      tag: "div[data-page-spacer]",
      getAttrs: (el) => ({
        height: parseInt((el as HTMLElement).style.height) || 0,
      }),
    }];
  },

  renderHTML({ node }) {
    return [
      "div",
      {
        "data-page-spacer": "true",
        style: `height:${node.attrs.height as number}px;pointer-events:none;user-select:none;`,
        contenteditable: "false",
        tabindex: "-1",
      },
    ];
  },

  // Prevent keyboard commands from entering the spacer
  addKeyboardShortcuts() {
    return {};
  },
});

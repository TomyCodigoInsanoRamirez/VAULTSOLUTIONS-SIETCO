import BaseImage from "@tiptap/extension-image";

export type TipTapImageLayout = "dynamic" | "fixed";

export const CustomImage = BaseImage.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      layout: {
        default: "dynamic" as TipTapImageLayout,
        parseHTML: (el) => (el.getAttribute("data-layout") as TipTapImageLayout) || "dynamic",
        renderHTML: (attrs) => ({ "data-layout": attrs.layout }),
      },
      width: {
        default: 280,
        parseHTML: (el) => Number(el.getAttribute("data-width")) || 280,
        renderHTML: (attrs) => ({ "data-width": String(attrs.width) }),
      },
    };
  },

  renderHTML({ HTMLAttributes }) {
    const layout = (HTMLAttributes["data-layout"] as TipTapImageLayout) || "dynamic";
    const width = Number(HTMLAttributes["data-width"]) || 280;

    const style =
      layout === "fixed"
        ? `width:${width}px;max-width:100%;float:left;margin:0 14px 10px 0;display:block`
        : `width:${width}px;max-width:100%;display:block;margin:8px auto`;

    const { "data-layout": _l, "data-width": _w, ...rest } = HTMLAttributes;

    return ["img", { ...rest, style, class: `editor-image editor-image--${layout}` }];
  },
});

import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";
import type { Node as PMNode } from "@tiptap/pm/model";

export const searchPluginKey = new PluginKey<DecorationSet>("search");

type Match = { from: number; to: number };

function findMatches(doc: PMNode, term: string): Match[] {
  if (!term.trim()) return [];
  const results: Match[] = [];
  const re = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "gi");

  doc.descendants((node, pos) => {
    if (!node.isText || !node.text) return;
    re.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = re.exec(node.text)) !== null) {
      results.push({ from: pos + m.index, to: pos + m.index + m[0].length });
    }
  });

  return results;
}

function buildDecs(doc: PMNode, results: Match[], current: number): DecorationSet {
  return DecorationSet.create(
    doc,
    results.map((r, i) =>
      Decoration.inline(r.from, r.to, {
        class: i === current ? "search-current" : "search-match",
      })
    )
  );
}

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    search: {
      search: (term: string) => ReturnType;
      nextMatch: () => ReturnType;
      prevMatch: () => ReturnType;
      replaceOne: (replacement: string) => ReturnType;
      replaceAll: (replacement: string) => ReturnType;
      clearSearch: () => ReturnType;
    };
  }
}

export const SearchExtension = Extension.create({
  name: "search",

  addStorage() {
    return {
      term: "",
      results: [] as Match[],
      current: -1,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: searchPluginKey,
        state: {
          init: () => DecorationSet.empty,
          apply: (tr, set) => {
            const meta = tr.getMeta(searchPluginKey);
            if (meta !== undefined) return meta;
            return set.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations: (state) => searchPluginKey.getState(state),
        },
      }),
    ];
  },

  addCommands() {
    return {
      search:
        (term: string) =>
        ({ editor, tr, dispatch }) => {
          const results = findMatches(editor.state.doc, term);
          const current = results.length > 0 ? 0 : -1;
          this.storage.term = term;
          this.storage.results = results;
          this.storage.current = current;
          tr.setMeta(searchPluginKey, buildDecs(editor.state.doc, results, current));
          dispatch?.(tr);
          if (current >= 0) {
            setTimeout(() => {
              editor.commands.setTextSelection(results[current].from);
              editor.commands.scrollIntoView();
            }, 0);
          }
          return true;
        },

      nextMatch:
        () =>
        ({ editor, tr, dispatch }) => {
          const { results } = this.storage;
          if (!results.length) return false;
          const current = (this.storage.current + 1) % results.length;
          this.storage.current = current;
          tr.setMeta(searchPluginKey, buildDecs(editor.state.doc, results, current));
          dispatch?.(tr);
          setTimeout(() => {
            editor.commands.setTextSelection(results[current].from);
            editor.commands.scrollIntoView();
          }, 0);
          return true;
        },

      prevMatch:
        () =>
        ({ editor, tr, dispatch }) => {
          const { results } = this.storage;
          if (!results.length) return false;
          const current = (this.storage.current - 1 + results.length) % results.length;
          this.storage.current = current;
          tr.setMeta(searchPluginKey, buildDecs(editor.state.doc, results, current));
          dispatch?.(tr);
          setTimeout(() => {
            editor.commands.setTextSelection(results[current].from);
            editor.commands.scrollIntoView();
          }, 0);
          return true;
        },

      replaceOne:
        (replacement: string) =>
        ({ editor, tr, dispatch }) => {
          const { results, current, term } = this.storage;
          if (current < 0 || !results[current]) return false;
          const { from, to } = results[current];
          if (replacement) {
            tr.replaceWith(from, to, editor.schema.text(replacement));
          } else {
            tr.delete(from, to);
          }
          tr.setMeta(searchPluginKey, DecorationSet.empty);
          this.storage.results = [];
          this.storage.current = -1;
          dispatch?.(tr);
          setTimeout(() => { if (term) editor.commands.search(term); }, 0);
          return true;
        },

      replaceAll:
        (replacement: string) =>
        ({ editor, tr, dispatch }) => {
          const { results } = this.storage;
          if (!results.length) return false;
          [...results]
            .sort((a, b) => b.from - a.from)
            .forEach(({ from, to }) => {
              if (replacement) {
                tr.replaceWith(from, to, editor.schema.text(replacement));
              } else {
                tr.delete(from, to);
              }
            });
          tr.setMeta(searchPluginKey, DecorationSet.empty);
          this.storage.results = [];
          this.storage.current = -1;
          this.storage.term = "";
          dispatch?.(tr);
          return true;
        },

      clearSearch:
        () =>
        ({ tr, dispatch }) => {
          this.storage.term = "";
          this.storage.results = [];
          this.storage.current = -1;
          tr.setMeta(searchPluginKey, DecorationSet.empty);
          dispatch?.(tr);
          return true;
        },
    };
  },
});

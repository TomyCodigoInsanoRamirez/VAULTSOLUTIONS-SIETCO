"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type SearchMode = "find" | "replace" | null;

interface SearchCtxType {
  mode: SearchMode;
  openFind: () => void;
  openReplace: () => void;
  close: () => void;
}

const SearchCtx = createContext<SearchCtxType>({
  mode: null,
  openFind: () => {},
  openReplace: () => {},
  close: () => {},
});

export function SearchProvider({ children }: { children: ReactNode }) {
  const [mode, setMode] = useState<SearchMode>(null);

  return (
    <SearchCtx.Provider
      value={{
        mode,
        openFind:    () => setMode("find"),
        openReplace: () => setMode("replace"),
        close:       () => setMode(null),
      }}
    >
      {children}
    </SearchCtx.Provider>
  );
}

export function useSearch() {
  return useContext(SearchCtx);
}

"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export interface PageSettings {
  marginTop: number;    // mm
  marginBottom: number; // mm
  marginLeft: number;   // mm
  marginRight: number;  // mm
  header: string;
  footer: string;
  lineHeight: string;
}

interface PageSettingsCtxType {
  settings: PageSettings;
  update: (patch: Partial<PageSettings>) => void;
  panelOpen: boolean;
  setPanelOpen: (v: boolean) => void;
}

const DEFAULTS: PageSettings = {
  marginTop: 25,
  marginBottom: 25,
  marginLeft: 30,
  marginRight: 30,
  header: "",
  footer: "",
  lineHeight: "1.5",
};

const PageSettingsCtx = createContext<PageSettingsCtxType>({
  settings: DEFAULTS,
  update: () => {},
  panelOpen: false,
  setPanelOpen: () => {},
});

export function PageSettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<PageSettings>(DEFAULTS);
  const [panelOpen, setPanelOpen] = useState(false);

  const update = (patch: Partial<PageSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  return (
    <PageSettingsCtx.Provider value={{ settings, update, panelOpen, setPanelOpen }}>
      {children}
    </PageSettingsCtx.Provider>
  );
}

export function usePageSettings() {
  return useContext(PageSettingsCtx);
}

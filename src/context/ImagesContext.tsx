"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";

export type OverlayMode = "front" | "back";

export interface OverlayImage {
  id: string;
  src: string;
  x: number;
  y: number;
  width: number;
  mode: OverlayMode;
}

interface ImagesCtxType {
  images: OverlayImage[];
  addImage: (img: Omit<OverlayImage, "id">) => void;
  updateImage: (id: string, patch: Partial<OverlayImage>) => void;
  removeImage: (id: string) => void;
  modalOpen: boolean;
  openModal: () => void;
  closeModal: () => void;
}

const ImagesCtx = createContext<ImagesCtxType>({
  images: [],
  addImage: () => {},
  updateImage: () => {},
  removeImage: () => {},
  modalOpen: false,
  openModal: () => {},
  closeModal: () => {},
});

export function ImagesProvider({ children }: { children: ReactNode }) {
  const [images, setImages] = useState<OverlayImage[]>([]);
  const [modalOpen, setModalOpen] = useState(false);

  const addImage = useCallback((img: Omit<OverlayImage, "id">) => {
    setImages((prev) => [...prev, { ...img, id: crypto.randomUUID() }]);
  }, []);

  const updateImage = useCallback((id: string, patch: Partial<OverlayImage>) => {
    setImages((prev) =>
      prev.map((img) => (img.id === id ? { ...img, ...patch } : img))
    );
  }, []);

  const removeImage = useCallback((id: string) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
  }, []);

  return (
    <ImagesCtx.Provider
      value={{
        images,
        addImage,
        updateImage,
        removeImage,
        modalOpen,
        openModal: () => setModalOpen(true),
        closeModal: () => setModalOpen(false),
      }}
    >
      {children}
    </ImagesCtx.Provider>
  );
}

export function useImages() {
  return useContext(ImagesCtx);
}

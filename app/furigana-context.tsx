"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type FuriganaContextValue = {
  show: boolean;
  toggle: () => void;
};

const FuriganaContext = createContext<FuriganaContextValue | null>(null);

export function FuriganaProvider({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(false);
  return (
    <FuriganaContext.Provider
      value={{ show, toggle: () => setShow((v) => !v) }}
    >
      {children}
    </FuriganaContext.Provider>
  );
}

export function useFurigana() {
  const ctx = useContext(FuriganaContext);
  if (!ctx) {
    throw new Error("useFurigana must be used within FuriganaProvider");
  }
  return ctx;
}

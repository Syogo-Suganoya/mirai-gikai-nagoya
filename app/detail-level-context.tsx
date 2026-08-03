"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

type DetailLevelContextValue = {
  detailed: boolean;
  toggle: () => void;
};

const DetailLevelContext = createContext<DetailLevelContextValue | null>(null);

export function DetailLevelProvider({ children }: { children: ReactNode }) {
  const [detailed, setDetailed] = useState(false);
  return (
    <DetailLevelContext.Provider
      value={{ detailed, toggle: () => setDetailed((v) => !v) }}
    >
      {children}
    </DetailLevelContext.Provider>
  );
}

export function useDetailLevel() {
  const ctx = useContext(DetailLevelContext);
  if (!ctx) {
    throw new Error("useDetailLevel must be used within DetailLevelProvider");
  }
  return ctx;
}

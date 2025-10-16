"use client";

import React, { createContext, useContext, useState, useCallback } from "react";

interface ImageRefreshContextType {
  refreshKey: number;
  triggerRefresh: () => void;
}

const ImageRefreshContext = createContext<ImageRefreshContextType | undefined>(undefined);

export function ImageRefreshProvider({ children }: { children: React.ReactNode }) {
  const [refreshKey, setRefreshKey] = useState(0);

  const triggerRefresh = useCallback(() => {
    setRefreshKey(prev => prev + 1);
  }, []);

  return (
    <ImageRefreshContext.Provider value={{ refreshKey, triggerRefresh }}>
      {children}
    </ImageRefreshContext.Provider>
  );
}

export function useImageRefresh() {
  const context = useContext(ImageRefreshContext);
  if (!context) {
    throw new Error("useImageRefresh must be used within ImageRefreshProvider");
  }
  return context;
}
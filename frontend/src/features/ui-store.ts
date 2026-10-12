import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { DEFAULT_REGION } from "@/config/constants";
import type { RegionCode } from "@/domain/models/region";

export type ThemeMode = "light" | "dark" | "system";

interface UiState {
  selectedRegion: RegionCode;
  theme: ThemeMode;
  sidebarCollapsed: boolean;
  setRegion: (c: RegionCode) => void;
  setTheme: (t: ThemeMode) => void;
  toggleSidebar: () => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      selectedRegion: DEFAULT_REGION,
      theme: "system",
      sidebarCollapsed: false,
      setRegion: (selectedRegion) => set({ selectedRegion }),
      setTheme: (theme) => set({ theme }),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
    }),
    { name: "sapdt-ui", storage: createJSONStorage(() => localStorage), skipHydration: true },
  ),
);

import { createContext, useContext, useState, type ReactNode } from "react";
import { createServices } from "@/services/createServices";
import type { Services } from "@/services/ports";

const ServicesContext = createContext<Services | null>(null);

export function ServicesProvider({ children }: { children: ReactNode }) {
  const [services] = useState(createServices);
  return <ServicesContext.Provider value={services}>{children}</ServicesContext.Provider>;
}

export function useServices(): Services {
  const s = useContext(ServicesContext);
  if (!s) throw new Error("useServices debe usarse dentro de ServicesProvider");
  return s;
}

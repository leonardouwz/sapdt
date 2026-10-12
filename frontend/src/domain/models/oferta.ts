import type { Region } from "./region";

export interface OfertaActual {
  region: Region;
  oferta_actual: {
    fecha_corte: string; // YYYY-MM-DD
    establecimientos: number;
    habitaciones: number | null;
    camas: number | null;
    pct_sin_dato_capacidad: number;
  };
}

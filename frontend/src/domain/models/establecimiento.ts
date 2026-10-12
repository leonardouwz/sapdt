import type { RegionCode } from "./region";

export type ClaseDir = "Hotel" | "Hostal" | "Albergue" | "Apart Hotel" | "Resort";
export type CategoriaDir =
  | "1 Estrella"
  | "2 Estrellas"
  | "3 Estrellas"
  | "4 Estrellas"
  | "5 Estrellas"
  | "Sin categoría";

export const CLASES: readonly ClaseDir[] = ["Hotel", "Hostal", "Albergue", "Apart Hotel", "Resort"];
export const CATEGORIAS: readonly CategoriaDir[] = [
  "1 Estrella",
  "2 Estrellas",
  "3 Estrellas",
  "4 Estrellas",
  "5 Estrellas",
  "Sin categoría",
];

export interface Establecimiento {
  id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial: string;
  ubigeo: string;
  departamento_codigo: RegionCode;
  departamento: string;
  provincia: string;
  distrito: string;
  clase: ClaseDir;
  categoria: CategoriaDir;
  habitaciones: number | null;
  camas: number | null;
  direccion: string | null;
  telefono: string | null;
  email: string | null;
  web: string | null;
  fecha_expedicion: string | null;
  nro_certificado: string | null;
  fecha_corte: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface DirectoryQuery {
  departamento?: RegionCode;
  provincia?: string;
  clase?: ClaseDir;
  categoria?: CategoriaDir;
  q?: string;
  page: number;
  pageSize: number;
}

export interface CapacityAggregates {
  establecimientos: number;
  habitaciones: number | null;
  camas: number | null;
  pct_sin_dato_capacidad: number;
}

export interface DirectoryResult extends Paginated<Establecimiento> {
  agregados: CapacityAggregates;
}

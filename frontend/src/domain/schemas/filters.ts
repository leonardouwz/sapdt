import { z } from "zod";
import {
  COMPARE_MAX_REGIONS,
  COMPARE_MIN_REGIONS,
  MSG_MAX_REGIONS,
  MSG_MIN_REGIONS,
  MSG_RANGE_ORDER,
} from "@/config/constants";
import { CATEGORIAS, CLASES } from "../models/establecimiento";
import { comparePeriods, isValidPeriod } from "../periods";
import { isRegionCode } from "../regions";

export const periodSchema = z.string().refine(isValidPeriod, "Periodo inválido");
export const regionCodeSchema = z.string().refine(isRegionCode, "Región inválida");

export const monthRangeSchema = z
  .object({ desde: periodSchema, hasta: periodSchema })
  .refine((r) => comparePeriods(r.desde, r.hasta) <= 0, { message: MSG_RANGE_ORDER, path: ["hasta"] });

export const trendsFilterSchema = z.object({
  region: regionCodeSchema,
  metrica: z.enum(["arribos", "pernoct"]),
  range: monthRangeSchema,
  excluirPandemia: z.boolean(),
});

export const compareFormSchema = z.object({
  regiones: z
    .array(regionCodeSchema)
    .min(COMPARE_MIN_REGIONS, MSG_MIN_REGIONS)
    .max(COMPARE_MAX_REGIONS, MSG_MAX_REGIONS),
  base: monthRangeSchema,
  comparacion: monthRangeSchema,
});
export type CompareFormValues = z.infer<typeof compareFormSchema>;

export const directoryFilterSchema = z.object({
  region: regionCodeSchema.optional(),
  clase: z.enum(CLASES as unknown as [string, ...string[]]).optional(),
  categoria: z.enum(CATEGORIAS as unknown as [string, ...string[]]).optional(),
  q: z.string().max(80).optional(),
  page: z.number().int().min(1),
});

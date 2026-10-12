import { CONFIDENCE_HIGH_BELOW, CONFIDENCE_MID_MAX } from "@/config/constants";

export type ConfidenceLevel = "alta" | "moderada" | "volatil";

/** Fuente única: mape < 10 ⇒ alta · 10 ≤ mape ≤ 20 ⇒ moderada · mape > 20 ⇒ volátil. */
export function classifyConfidence(mapeValue: number): ConfidenceLevel {
  if (mapeValue < CONFIDENCE_HIGH_BELOW) return "alta";
  if (mapeValue <= CONFIDENCE_MID_MAX) return "moderada";
  return "volatil";
}

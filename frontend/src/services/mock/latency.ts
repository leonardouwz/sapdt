import { env } from "@/config/env";
import { ApiError } from "@/domain/models/ApiError";

/** Simula latencia (±30 %) y fallos de red opcionales, igual que el backend. */
export async function simulate<T>(fn: () => T): Promise<T> {
  const ms = env.mockLatencyMs * (0.7 + Math.random() * 0.6);
  await new Promise((r) => setTimeout(r, ms));
  if (env.mockFailRate > 0 && Math.random() < env.mockFailRate) {
    throw new ApiError({ status: 0, code: "NETWORK_ERROR", message: "No pudimos conectar con el servicio.", retryable: true });
  }
  return fn();
}

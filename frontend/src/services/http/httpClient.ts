import { ApiError } from "@/domain/models/ApiError";

export type QueryValue = string | number | boolean | undefined | null | string[];

export function buildUrl(base: string, path: string, params: Record<string, QueryValue> = {}): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === "") continue;
    qs.set(k, Array.isArray(v) ? v.join(",") : String(v));
  }
  const s = qs.toString();
  return `${base.replace(/\/$/, "")}${path}${s ? `?${s}` : ""}`;
}

async function request(url: string): Promise<Response> {
  let res: Response;
  try {
    res = await fetch(url, { headers: { Accept: "application/json" } });
  } catch {
    throw new ApiError({ status: 0, code: "NETWORK_ERROR", message: "No pudimos conectar con el servicio.", retryable: true });
  }
  if (!res.ok) {
    let message = "Ocurrió un error inesperado.";
    try { const b = (await res.json()) as { error?: string }; if (b.error) message = b.error; } catch { /* sin cuerpo */ }
    const code = res.status === 404 ? "NOT_FOUND" : res.status === 400 ? (/rango|fecha/i.test(message) ? "RANGE_OUT_OF_DATA" : "VALIDATION_ERROR") : "UNKNOWN";
    throw new ApiError({ status: res.status, code, message });
  }
  return res;
}

export const createHttpClient = (base: string) => ({
  async getJson<T>(path: string, params?: Record<string, QueryValue>): Promise<T> {
    return (await (await request(buildUrl(base, path, params))).json()) as T;
  },
  async getBlob(path: string, params?: Record<string, QueryValue>): Promise<{ blob: Blob; filename: string | null }> {
    const res = await request(buildUrl(base, path, params));
    const cd = res.headers.get("content-disposition") ?? "";
    const m = /filename="?([^";]+)"?/.exec(cd);
    return { blob: await res.blob(), filename: m ? m[1] : null };
  },
});

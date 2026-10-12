export type CsvCell = string | number | boolean | null | undefined;

const esc = (v: CsvCell): string => {
  if (v === null || v === undefined) return ""; // nulo = celda vacía, nunca 0
  const s = typeof v === "number" ? String(v) : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

/** CSV UTF-8 con BOM, separador coma, punto decimal, sin separador de miles. */
export function toCsv(headers: string[], rows: CsvCell[][]): Blob {
  const body = [headers.join(","), ...rows.map((r) => r.map(esc).join(","))].join("\r\n");
  return new Blob(["\uFEFF" + body], { type: "text/csv;charset=utf-8" });
}

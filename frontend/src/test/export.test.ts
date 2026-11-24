import { describe, expect, it } from "vitest";
import { exportReport } from "@/services/mock/export/exportReport";
import { searchDirectory } from "@/services/mock/queries";

const text = (b: Blob) => new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsText(b); });

describe("RF-08 exportación", () => {
  it("exporta la proyección a CSV con los meses proyectados", async () => {
    const { blob, filename } = await exportReport({ reporte: "proyecciones", formato: "csv", filtros: { region: "08", horizonte: 3, modelo: "media_movil" } });
    const lines = (await text(blob)).replace(/^﻿/, "").trim().split(/\r?\n/);
    expect(lines[0]).toBe("periodo,tipo,arribos,region,modelo,mae,mape_pct,confiable");
    expect(lines.slice(-3).map((l) => l.split(",")[1])).toEqual(["proyeccion", "proyeccion", "proyeccion"]);
    expect(filename).toMatch(/^sapdt_proyecciones_.*\.csv$/);
  });
});

describe("RF-06 filtro por provincia", () => {
  it("lista las provincias del departamento y filtra por una", () => {
    const all = searchDirectory({ departamento: "04", page: 1, pageSize: 12 });
    expect(all.provincias?.length).toBeGreaterThan(0);
    const prov = all.provincias![0]!;
    const one = searchDirectory({ departamento: "04", provincia: prov, page: 1, pageSize: 500 });
    expect(one.total).toBeGreaterThan(0);
    expect(one.total).toBeLessThanOrEqual(all.total);
    expect(one.items.every((e) => e.provincia === prov)).toBe(true);
  });
});

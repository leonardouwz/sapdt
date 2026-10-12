import { describe, expect, it } from "vitest";
import { classifyConfidence } from "@/domain/confidence";
import { fmtCompact, fmtDate, fmtDays, fmtInt, fmtMonth, fmtPct, fmtVar } from "@/domain/format";
import { percentile } from "@/domain/stats";
import { toTitleCase } from "@/domain/titleCase";
import { periodsBetween, rangeLength } from "@/domain/periods";
import { computeSeasonality } from "@/domain/seasonality";
import { variationPct } from "@/domain/compare";
import { getDb } from "@/services/mock/db";
import { getOffer } from "@/services/mock/queries";

describe("format", () => {
  it("formats es-PE", () => {
    expect(fmtInt(123630)).toBe("123,630");
    expect(fmtPct(19.57)).toBe("19.57 %");
    expect(fmtDays(1.45)).toBe("1.45 días");
    expect(fmtVar(9.29)).toBe("+9.3 %");
    expect(fmtVar(-4.1)).toBe("−4.1 %");
    expect(fmtCompact(1_200_000)).toBe("1.2 M");
    expect(fmtCompact(450_000)).toBe("450 mil");
    expect(fmtMonth("2025-06")).toBe("Jun 2025");
    expect(fmtDate("2026-10-05")).toBe("05-Oct-2026");
  });
});

describe("titleCase", () => {
  it("normalizes government text", () => {
    expect(toTitleCase("COLCA LODGE SOCIEDAD ANONIMA")).toBe("Colca Lodge Sociedad Anonima");
    expect(toTitleCase("VIA PUYE SN FND.")).toBe("Via Puye S/N Fnd.");
    expect(toTitleCase("HOSTAL  EL DORADO S.A.C.")).toBe("Hostal el Dorado S.A.C.");
    expect(toTitleCase("AV. EJERCITO 123 MZ A LT 5")).toBe("Av. Ejercito 123 Mz. a Lt. 5");
    expect(toTitleCase("CASA HOSPEDAJE ÑUÑOA")).toBe("Casa Hospedaje Ñuñoa");
  });
});

describe("stats & rules", () => {
  it("percentile linear", () => expect(percentile([1, 2, 3, 4], 25)).toBeCloseTo(1.75));
  it("confidence bounds", () => {
    expect(classifyConfidence(9.99)).toBe("alta");
    expect(classifyConfidence(10)).toBe("moderada");
    expect(classifyConfidence(20)).toBe("moderada");
    expect(classifyConfidence(20.01)).toBe("volatil");
  });
  it("periods", () => {
    expect(rangeLength("2015-01", "2025-06")).toBe(126);
    expect(periodsBetween("2024-11", "2025-02")).toEqual(["2024-11", "2024-12", "2025-01", "2025-02"]);
  });
  it("variation null on base 0", () => expect(variationPct(0, 5)).toBeNull());
  it("season s/d for missing months", () => {
    const r = computeSeasonality([{ mes: 1, valor: 10, atipico: false }, { mes: 2, valor: 20, atipico: false }], { excluirPandemia: true });
    expect(r.meses[5].nivel).toBeNull();
    expect(r.meses[5].valor_promedio).toBeNull();
  });
});

describe("mock acceptance (§9.3)", () => {
  const db = getDb();
  const sumNac = (anio: number) => {
    let s = 0;
    db.seriesByRegion.forEach((pts) => pts.forEach((p) => { if (p.anio === anio) s += p.arribos_nac ?? 0; }));
    return s;
  };
  it("2019 ≈ 63.2 M (TT/TT only)", () => expect(Math.abs(sumNac(2019) / 63.2e6 - 1)).toBeLessThan(0.005));
  it("2024 ≈ 57.6 M", () => expect(Math.abs(sumNac(2024) / 57.6e6 - 1)).toBeLessThan(0.005));
  it("Arequipa 2024-01 anchor", () => {
    const p = db.seriesByRegion.get("04")!.find((x) => x.periodo === "2024-01")!;
    expect(p.arribos).toBe(123630);
    expect(p.tnoh).toBe(19.57);
  });
  it("directory totals", () => {
    expect(db.directory.length).toBe(5076);
    const o = getOffer("04").oferta_actual;
    expect(o.establecimientos).toBe(403);
    expect(o.pct_sin_dato_capacidad).toBe(11.4);
    expect(o.habitaciones).toBe(7498);
    expect(o.camas).toBe(13609);
  });
  it("invariants", () => {
    db.seriesByRegion.forEach((pts) => pts.forEach((p) => {
      expect((p.pernoct ?? 0) >= (p.arribos ?? 0)).toBe(true);
      expect(p.atipico).toBe(p.anio === 2020 || p.anio === 2021);
      expect(p.parcial).toBe(p.anio === 2025);
    }));
  });
});

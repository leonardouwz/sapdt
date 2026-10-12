import { DATA_SOURCE_LABEL } from "@/config/constants";
import { fmtDate } from "@/domain/format";
import { todayIso } from "@/domain/periods";

export interface PdfSection {
  heading?: string;
  lines?: string[];
  table?: { head: string[]; body: string[][] };
  chartElementId?: string;
}

/** Helvetica (WinAnsi) no tiene "−" ni flechas: se reemplazan por ASCII. */
const safe = (s: string) => s.replace(/−/g, "-").replace(/▲/g, "+").replace(/▼/g, "-").replace(/★/g, "*");

async function captureChart(id: string): Promise<{ data: string; w: number; h: number } | null> {
  try {
    const el = document.getElementById(id);
    if (!el) return null;
    const { toPng } = await import("html-to-image");
    const bg = getComputedStyle(document.body).backgroundColor;
    const data = await toPng(el, { backgroundColor: bg, pixelRatio: 2 });
    return { data, w: el.clientWidth, h: el.clientHeight };
  } catch {
    return null; // best-effort
  }
}

export async function buildPdf(p: { title: string; filtros: string; coverage: string; sections: PdfSection[] }): Promise<Blob> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const W = doc.internal.pageSize.getWidth();
  const M = 40;
  let y = M;

  doc.setFont("helvetica", "bold").setFontSize(18).setTextColor(150, 60, 30).text("SAPDT", M, y);
  doc.setFontSize(13).setTextColor(30, 40, 60).text(safe(p.title), M + 70, y);
  y += 18;
  doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(90, 90, 90);
  doc.splitTextToSize(safe(`Filtros: ${p.filtros}`), W - 2 * M).forEach((l: string) => { doc.text(l, M, y); y += 12; });
  doc.text(`Generado el ${fmtDate(todayIso())}`, M, y);
  y += 20;

  for (const s of p.sections) {
    if (y > 760) { doc.addPage(); y = M; }
    if (s.heading) { doc.setFont("helvetica", "bold").setFontSize(12).setTextColor(30, 40, 60).text(safe(s.heading), M, y); y += 16; }
    doc.setFont("helvetica", "normal").setFontSize(10).setTextColor(40, 40, 40);
    for (const l of s.lines ?? []) {
      doc.splitTextToSize(safe(l), W - 2 * M).forEach((t: string) => { doc.text(t, M, y); y += 13; });
    }
    if (s.chartElementId) {
      const img = await captureChart(s.chartElementId);
      if (img) {
        const w = W - 2 * M;
        const h = Math.min(260, (img.h / img.w) * w);
        if (y + h > 800) { doc.addPage(); y = M; }
        doc.addImage(img.data, "PNG", M, y, w, h);
        y += h + 10;
      }
    }
    if (s.table) {
      autoTable(doc, {
        startY: y, head: [s.table.head.map(safe)], body: s.table.body.map((r) => r.map(safe)),
        margin: { left: M, right: M }, styles: { fontSize: 8, cellPadding: 3 },
        headStyles: { fillColor: [45, 60, 80] },
      });
      y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 16;
    }
    y += 6;
  }

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(8).setTextColor(120, 120, 120);
    doc.text(safe(`Fuente: ${DATA_SOURCE_LABEL} · ${p.coverage}`), M, 822);
    doc.text(`Página ${i} de ${pages}`, W - M, 822, { align: "right" });
  }
  return doc.output("blob");
}

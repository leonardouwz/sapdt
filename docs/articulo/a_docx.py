"""Genera articulo_sapdt.docx (dos columnas, estilo IEEE) desde articulo_sapdt.tex.

Uso (desde docs/articulo): python a_docx.py   -> requiere pandoc y python-docx.
ponytail: conversión pensada solo para este .tex; los ajustes finos van en Word.
"""
import re, subprocess, tempfile, os
from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement
from docx.shared import Pt, Cm

AQUI = os.path.dirname(os.path.abspath(__file__))
tex = open(os.path.join(AQUI, "articulo_sapdt.tex"), encoding="utf-8").read()

# 1. Citas numeradas en orden de la bibliografía.
claves = re.findall(r"\\bibitem\{([^}]+)\}", tex)
num = {k: i + 1 for i, k in enumerate(claves)}
tex = re.sub(r"~?\\cite\{([^}]+)\}",
             lambda m: " [" + "], [".join(str(num[k.strip()]) for k in m.group(1).split(",")) + "]", tex)
tex = re.sub(r"\\bibitem\{([^}]+)\}", lambda m: f"\n\nREF[{num[m.group(1)]}] ", tex)
tex = tex.replace("\\begin{thebibliography}{99}", "\\section*{Referencias}").replace("\\end{thebibliography}", "")

# 2. Cabecera: título, autores y resúmenes como texto plano que pandoc no descarta.
titulo = re.search(r"\\title\{(.+?)\}\n", tex).group(1)
autores = re.search(r"\\IEEEauthorblockN\{(.+?)\}\n\\IEEEauthorblockA\{(.+?)\}\n\}", tex, re.S)
cuerpo = tex[tex.index("\\maketitle") + len("\\maketitle"):tex.index("\\end{document}")]
cuerpo = cuerpo.replace("\\renewcommand{\\abstractname}{Abstract}", "")
resumenes = re.findall(r"\\begin\{abstract\}(.+?)\\end\{abstract\}", cuerpo, re.S)
clave = re.search(r"\\begin\{IEEEkeywords\}(.+?)\\end\{IEEEkeywords\}", cuerpo, re.S).group(1).strip()
cuerpo = re.sub(r"\\begin\{abstract\}.+?\\end\{abstract\}|\\begin\{IEEEkeywords\}.+?\\end\{IEEEkeywords\}", "", cuerpo, flags=re.S)
cab = ("TITULO " + titulo + "\n\nAUTORES " + autores.group(1).replace("\\\\", " ") +
       "\n\nAFIL " + ", ".join(x.strip() for x in autores.group(2).split("\\\\") if "@" not in x) +
       "".join("\n\nCORREO " + x.strip() for x in autores.group(2).split("\\\\") if "@" in x) +
       "\n\nRESUMEN " + resumenes[0].strip() + "\n\nABSTRACT " + resumenes[1].strip() +
       "\n\nCLAVES " + clave + "\n\nFINCABECERA\n\n")
pre = tex[:tex.index("\\begin{document}") + len("\\begin{document}")]
tex = pre + "\n" + cab + cuerpo + "\\end{document}\n"

tmp = tempfile.mkdtemp()
src, raw = os.path.join(tmp, "a.tex"), os.path.join(tmp, "a.docx")
open(src, "w", encoding="utf-8").write(tex)
subprocess.run(["pandoc", src, "-f", "latex", "-o", raw,
                "--resource-path", os.pathsep.join([os.path.join(AQUI, "..", d) for d in ("capturas", "diagramas")])],
               check=True)

# 3. Formato IEEE: Times 10 pt, cabecera a una columna, cuerpo a dos.
d = Document(raw)
for st in d.styles:
    if st.type == 1 and st.font is not None:
        st.font.name = "Times New Roman"
        st.element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:eastAsia"), "Times New Roman")
        st.font.color.rgb = None
d.styles["Normal"].font.size = Pt(10)
for n, size in (("Heading 1", 10), ("Heading 2", 10), ("Heading 3", 10)):
    if n in d.styles:
        d.styles[n].font.size = Pt(size)
        d.styles[n].font.bold = n != "Heading 2"
        d.styles[n].font.italic = n == "Heading 2"
ROM = "I II III IV V VI VII VIII IX X".split()
h1 = h2 = tab = fig = 0
def prefijo(p, txt):
    p.runs[0].text = txt + p.runs[0].text
for p in d.paragraphs:
    for r in p.runs:  # fuerza Times también donde el tema de Word pone otra fuente
        r.font.name = "Times New Roman"
    st = p.style.name
    if st.startswith("Heading"):
        p.paragraph_format.space_before = Pt(8)
        for r in p.runs:
            r.font.size = Pt(10); r.font.color.rgb = None
            r.bold = st == "Heading 1"; r.italic = st == "Heading 2"
    if st == "Heading 1":
        p.alignment = WD_ALIGN_PARAGRAPH.CENTER
        for r in p.runs:
            r.text = r.text.upper()
        if p.text != "REFERENCIAS":
            prefijo(p, ROM[h1] + ". "); h1 += 1; h2 = 0
    elif st == "Heading 2":
        prefijo(p, "ABCDEFGH"[h2] + ". "); h2 += 1
    elif st == "Table Caption":
        tab += 1; prefijo(p, f"Tabla {tab}. "); p.alignment = WD_ALIGN_PARAGRAPH.CENTER
    elif st == "Image Caption":
        fig += 1; prefijo(p, f"Fig. {fig}. ")
    elif p.text.startswith("REF["):
        p.runs[0].text = p.runs[0].text.replace("REF", "", 1)
        for r in p.runs: r.font.size = Pt(8)
        p.alignment = WD_ALIGN_PARAGRAPH.LEFT
        continue
    elif p.style.name in ("Body Text", "First Paragraph", "Normal", "Compact"):
        p.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p.paragraph_format.space_after = Pt(3)

def resaltar(p, etiqueta, tam, negrita=False, cursiva=False, centro=True, prefijo=""):
    texto = p.text[len(etiqueta):].strip()
    for r in p.runs[1:]:
        r._r.getparent().remove(r._r)
    p.runs[0].text = ""
    if prefijo:
        b = p.add_run(prefijo)
        b.bold = b.italic = True
        b.font.size = Pt(tam)
    r = p.add_run(texto)
    r.font.size, r.bold, r.italic = Pt(tam), negrita, cursiva
    p.alignment = WD_ALIGN_PARAGRAPH.CENTER if centro else WD_ALIGN_PARAGRAPH.JUSTIFY

for p in d.paragraphs:
    t = p.text
    if t.startswith("TITULO "): resaltar(p, "TITULO ", 22)
    elif t.startswith("AUTORES "): resaltar(p, "AUTORES ", 11)
    elif t.startswith("AFIL "): resaltar(p, "AFIL ", 10, cursiva=True)
    elif t.startswith("CORREO "): resaltar(p, "CORREO ", 9)
    elif t.startswith("RESUMEN "): resaltar(p, "RESUMEN ", 9, negrita=True, centro=False, prefijo="Resumen—")
    elif t.startswith("ABSTRACT "): resaltar(p, "ABSTRACT ", 9, negrita=True, centro=False, prefijo="Abstract—")
    elif t.startswith("CLAVES "): resaltar(p, "CLAVES ", 9, negrita=True, centro=False, prefijo="Palabras clave—")
    elif t.strip() == "FINCABECERA":
        p.text = ""
        corte = p

# Márgenes de la plantilla IEEE (A4) y salto de sección continuo con dos columnas.
def columnas(sect, n):
    cols = sect._sectPr.find(qn("w:cols"))
    if cols is None:
        cols = OxmlElement("w:cols"); sect._sectPr.append(cols)
    cols.set(qn("w:num"), str(n)); cols.set(qn("w:space"), "425")

sectPr = d.sections[-1]._sectPr
nuevo = OxmlElement("w:sectPr")
for hijo in sectPr:
    if hijo.tag in (qn("w:pgSz"), qn("w:pgMar")):
        from copy import deepcopy
        nuevo.append(deepcopy(hijo))
corte._p.get_or_add_pPr().append(nuevo)
for s in d.sections:
    s.page_width, s.page_height = Cm(21), Cm(29.7)
    s.top_margin = s.bottom_margin = Cm(1.9)
    s.left_margin = s.right_margin = Cm(1.6)
columnas(d.sections[0], 1)
columnas(d.sections[-1], 2)
d.sections[-1].start_type = WD_SECTION.CONTINUOUS

# Imágenes al ancho de columna y tablas a 8 pt.
for sh in d.inline_shapes:
    ratio = sh.height / sh.width
    sh.width = Cm(8.6); sh.height = int(Cm(8.6) * ratio)
for tb in d.tables:
    tb.autofit = True
    tblPr = tb._tbl.tblPr
    for w in tblPr.findall(qn("w:tblW")): tblPr.remove(w)
    tw = OxmlElement("w:tblW"); tw.set(qn("w:w"), "5000"); tw.set(qn("w:type"), "pct"); tblPr.append(tw)
    lay = OxmlElement("w:tblLayout"); lay.set(qn("w:type"), "autofit"); tblPr.append(lay)
    for g in tb._tbl.findall(qn("w:tblGrid")): 
        for gc in g: gc.attrib.pop(qn("w:w"), None)
    for c in tb._cells:
        for w in c._tc.tcPr.findall(qn("w:tcW")) if c._tc.tcPr is not None else []: c._tc.tcPr.remove(w)
    for c in tb._cells:
        for p in c.paragraphs:
            for r in p.runs:
                r.font.size = Pt(8)

d.save(os.path.join(AQUI, "articulo_sapdt.docx"))
print("ok", os.path.join(AQUI, "articulo_sapdt.docx"))

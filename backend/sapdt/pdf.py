"""PDF mínimo (solo biblioteca estándar): título + tabla en texto, A4 horizontal, con paginación.
ponytail: sin gráficos ni columnas con ancho propio; si se piden, usar una librería (reportlab)."""

ANCHO, ALTO, MARGEN, LINEA, POR_PAGINA = 842, 595, 40, 14, 31


def _esc(t):
    t = "" if t is None else str(t)
    t = t.encode("cp1252", "replace").decode("cp1252")  # tildes y ñ
    return t.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def tabla_pdf(titulo, encabezado, filas, max_filas=500):
    """Devuelve los bytes de un PDF. Corta en max_filas y lo avisa al final."""
    cortado = len(filas) > max_filas
    filas = filas[:max_filas]
    n = len(encabezado)
    col = (ANCHO - 2 * MARGEN) // n
    chars = max(col // 5, 4)  # Helvetica 8 pt ~ 4,5 pt por letra

    def fila(vals, y):
        return "".join(f"BT /F1 8 Tf {MARGEN + i * col} {y} Td ({_esc(str(v if v is not None else '')[:chars])}) Tj ET\n" for i, v in enumerate(vals))

    trozos = [filas[i:i + POR_PAGINA] for i in range(0, len(filas), POR_PAGINA)] or [[]]
    paginas = []
    for k, trozo in enumerate(trozos):
        y = ALTO - MARGEN
        s = f"BT /F2 14 Tf {MARGEN} {y} Td ({_esc(titulo)}) Tj ET\n"
        y -= 28
        s += fila(encabezado, y).replace("/F1", "/F2")
        for f in trozo:
            y -= LINEA
            s += fila(f, y)
        pie = f"Página {k + 1} de {len(trozos)}" + (f" · se muestran las primeras {max_filas} filas; descarga el CSV para ver todo" if cortado else "")
        s += f"BT /F1 8 Tf {MARGEN} 20 Td ({_esc(pie)}) Tj ET\n"
        paginas.append(s)

    objs = [b"<< /Type /Catalog /Pages 2 0 R >>", None,
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>",
            b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"]
    kids = []
    for s in paginas:
        c = s.encode("cp1252")
        objs.append(b"<< /Length %d >>\nstream\n" % len(c) + c + b"endstream")
        objs.append(b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 %d %d] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents %d 0 R >>" % (ANCHO, ALTO, len(objs)))
        kids.append(b"%d 0 R" % len(objs))
    objs[1] = b"<< /Type /Pages /Kids [" + b" ".join(kids) + b"] /Count %d >>" % len(kids)

    out, pos = bytearray(b"%PDF-1.4\n"), []
    for i, o in enumerate(objs, 1):
        pos.append(len(out))
        out += b"%d 0 obj\n" % i + o + b"\nendobj\n"
    x = len(out)
    out += b"xref\n0 %d\n0000000000 65535 f \n" % (len(objs) + 1)
    for p in pos:
        out += b"%010d 00000 n \n" % p
    out += b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n" % (len(objs) + 1, x)
    return bytes(out)

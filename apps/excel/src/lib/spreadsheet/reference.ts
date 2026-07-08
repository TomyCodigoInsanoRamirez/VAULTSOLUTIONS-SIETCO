export function colToLetters(col: number): string {
  let n = col + 1;
  let s = "";
  while (n > 0) {
    const rem = (n - 1) % 26;
    s = String.fromCharCode(65 + rem) + s;
    n = Math.floor((n - 1) / 26);
  }
  return s;
}

export function lettersToCol(letters: string): number {
  let n = 0;
  for (let i = 0; i < letters.length; i++) {
    n = n * 26 + (letters.charCodeAt(i) - 64);
  }
  return n - 1;
}

export function parseCellRef(ref: string): { col: number; row: number } | null {
  const m = /^([A-Za-z]+)(\d+)$/.exec(ref.trim());
  if (!m) return null;
  return { col: lettersToCol(m[1].toUpperCase()), row: parseInt(m[2], 10) - 1 };
}

export function formatCellRef(col: number, row: number): string {
  return `${colToLetters(col)}${row + 1}`;
}

export function isValidRef(
  col: number,
  row: number,
  sheet: { colCount: number; rowCount: number },
): boolean {
  return col >= 0 && row >= 0 && col < sheet.colCount && row < sheet.rowCount;
}

// Expande "A1:B5" (o una sola celda "A1") a la lista de referencias que cubre.
// Normaliza fila y columna de forma independiente para soportar rangos
// invertidos por eje, p.ej. "B5:A1" o "A1:B1".
export function expandRange(rangeOrRef: string): string[] {
  const parts = rangeOrRef.split(":");
  if (parts.length === 1) {
    const ref = parts[0].toUpperCase();
    return parseCellRef(ref) ? [ref] : [];
  }
  const a = parseCellRef(parts[0]);
  const b = parseCellRef(parts[1]);
  if (!a || !b) return [];

  const colMin = Math.min(a.col, b.col);
  const colMax = Math.max(a.col, b.col);
  const rowMin = Math.min(a.row, b.row);
  const rowMax = Math.max(a.row, b.row);

  const refs: string[] = [];
  for (let r = rowMin; r <= rowMax; r++) {
    for (let c = colMin; c <= colMax; c++) {
      refs.push(formatCellRef(c, r));
    }
  }
  return refs;
}

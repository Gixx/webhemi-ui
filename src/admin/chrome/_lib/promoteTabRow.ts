/** Move `rowIndex` to the end; `selectedIndex` is the column within that row. */
export function promoteTabRow(
  rows: string[][],
  rowIndex: number,
  columnIndex: number,
): { rows: string[][]; selectedIndex: number } {
  if (rows.length === 0) {
    return { rows: [], selectedIndex: 0 };
  }
  const next = rows.map((row) => [...row]);
  const clampedRow = Math.max(0, Math.min(rows.length - 1, rowIndex));
  const [row] = next.splice(clampedRow, 1);
  next.push(row);
  const selectedIndex = Math.max(0, Math.min(row.length - 1, columnIndex));
  return { rows: next, selectedIndex };
}

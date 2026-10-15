import { MAX_TABLE_COLS, MAX_TABLE_ROWS, type FreeTable } from "@/lib/slides/free";

/**
 * Rows and columns of a freeform table (Task 78). Pure: a new table, or null at the limits
 * (1–12 rows, 1–8 columns). New rows/columns are added at the end, empty.
 */
export function addTableRow(table: FreeTable): FreeTable | null {
  if (table.rows.length >= MAX_TABLE_ROWS) return null;
  const rowH = table.h / table.rows.length;
  return { ...table, rows: [...table.rows, table.rows[0].map(() => "")], h: Math.round(table.h + rowH) };
}

export function removeTableRow(table: FreeTable): FreeTable | null {
  if (table.rows.length <= 1) return null;
  const rowH = table.h / table.rows.length;
  return { ...table, rows: table.rows.slice(0, -1), h: Math.max(40, Math.round(table.h - rowH)) };
}

export function addTableColumn(table: FreeTable): FreeTable | null {
  if (table.rows[0].length >= MAX_TABLE_COLS) return null;
  return { ...table, rows: table.rows.map((row) => [...row, ""]) };
}

export function removeTableColumn(table: FreeTable): FreeTable | null {
  if (table.rows[0].length <= 1) return null;
  return { ...table, rows: table.rows.map((row) => row.slice(0, -1)) };
}

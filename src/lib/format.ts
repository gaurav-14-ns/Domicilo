// INR currency + date helpers used across the app.
const INR = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const INR_COMPACT = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const formatINR = (n: number) => INR.format(Math.round(n || 0));
export const formatINRCompact = (n: number) => INR_COMPACT.format(n || 0);

export const monthKey = (d: Date | string = new Date()) => {
  const date = typeof d === "string" ? new Date(d) : d;
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
};

export const todayISO = () => new Date().toISOString().slice(0, 10);

export const monthsBetween = (fromKey: string, toKey: string): string[] => {
  const out: string[] = [];
  const [fy, fm] = fromKey.split("-").map(Number);
  const [ty, tm] = toKey.split("-").map(Number);
  let y = fy, m = fm;
  while (y < ty || (y === ty && m <= tm)) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
};

export const prettyMonth = (key: string) => {
  const [y, m] = key.split("-").map(Number);
  return new Date(y, m - 1, 1).toLocaleString("en-IN", { month: "short", year: "numeric" });
};

// ---------------------------------------------------------------------------
// CSV helpers
// ---------------------------------------------------------------------------
const csvEscape = (val: unknown): string => {
  if (val === null || val === undefined) return "";
  const s = String(val);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function toCSV<T extends Record<string, unknown>>(
  rows: T[],
  columns: { key: keyof T | string; header: string; map?: (row: T) => unknown }[],
): string {
  const header = columns.map((c) => csvEscape(c.header)).join(",");
  const body = rows
    .map((r) =>
      columns
        .map((c) => csvEscape(c.map ? c.map(r) : (r as any)[c.key]))
        .join(","),
    )
    .join("\n");
  // BOM so Excel detects UTF-8 correctly
  return "\uFEFF" + header + "\n" + body;
}

export function downloadCSV(filename: string, csv: string) {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function downloadCSV(rows: Record<string, any>[], filename: string) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const escape = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const csv = [
    headers.join(","),
    ...rows.map((r) => headers.map((h) => escape(r[h])).join(",")),
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

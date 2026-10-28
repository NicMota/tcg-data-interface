import { z } from "zod";

export const stockInput = z.object({
  sku: z.string().trim().min(1).max(100),
  name: z.string().trim().min(1).max(250),
  cardId: z.string().trim().min(1).max(100).nullable().default(null),
  setCode: z.string().trim().max(30).default(""),
  condition: z.enum(["NM", "LP", "MP", "HP", "DMG"]).default("NM"),
  language: z
    .enum(["EN", "PT", "ES", "FR", "DE", "IT", "JA", "KO", "RU", "ZH"])
    .default("EN"),
  finish: z.enum(["nonfoil", "foil", "etched"]).default("nonfoil"),
  quantity: z.number().int().min(0).max(1000000),
  costBrl: z.number().min(0).max(9999999).multipleOf(0.01).default(0),
  priceBrl: z.number().min(0).max(9999999).multipleOf(0.01).default(0),
  reorderPoint: z.number().int().min(0).max(1000000).default(2),
  location: z.string().trim().max(100).default(""),
});
export type StockInput = z.infer<typeof stockInput>;
export const importInput = z.object({
  csv: z.string().min(1).max(1000000),
  filename: z.string().trim().min(1).max(200).default("estoque.csv"),
  mapping: z.record(z.string(), z.string().max(200)),
  fingerprint: z.string().optional(),
});

// RFC 4180 quoting, BOM, CRLF, and common Brazilian delimiters.
export function parseCsv(text: string) {
  const firstLine = text.replace(/^\uFEFF/, "").split(/\r?\n/)[0];
  const count = (s: string) =>
    (firstLine.match(new RegExp(s, "g")) ?? []).length;
  const delimiter = count(";") > count(",") ? ";" : ",";
  const rows: string[][] = [];
  let row: string[] = [],
    field = "",
    quoted = false,
    closed = false;
  text = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') {
        field += '"';
        i++;
      } else if (ch === '"') {
        quoted = false;
        closed = true;
      } else field += ch;
    } else if (ch === '"' && !field && !closed) quoted = true;
    else if (ch === delimiter || ch === "\n" || ch === "\r") {
      row.push(field.trim());
      field = "";
      closed = false;
      if (ch !== delimiter) {
        if (row.some(Boolean)) rows.push(row);
        row = [];
        if (ch === "\r" && text[i + 1] === "\n") i++;
      }
    } else {
      if (closed && ch.trim())
        throw new Error("CSV: texto após fechamento de aspas.");
      if (ch === '"') throw new Error("CSV: aspas inválidas.");
      if (!closed) field += ch;
    }
    if (rows.length > 501)
      throw new Error("Importe no máximo 500 linhas por arquivo.");
  }
  if (quoted) throw new Error("CSV: aspas não fechadas.");
  row.push(field.trim());
  if (row.some(Boolean)) rows.push(row);
  const headers = rows.shift() ?? [];
  if (
    headers.length < 2 ||
    new Set(headers).size !== headers.length ||
    headers.some((h) => !h)
  )
    throw new Error(
      "CSV: cabeçalhos vazios, duplicados ou separador inválido.",
    );
  if (!rows.length || rows.length > 500)
    throw new Error("O arquivo deve conter entre 1 e 500 linhas.");
  return { headers, rows };
}

export function importRows(csv: string, mapping: Record<string, string>) {
  const { headers, rows } = parseCsv(csv);
  for (const required of ["sku", "name", "quantity"]) {
    if (!mapping[required] || !headers.includes(mapping[required]))
      throw new Error(`Mapeie a coluna ${required}.`);
  }
  const errors: { line: number; message: string }[] = [];
  const items: StockInput[] = [],
    seen = new Set<string>();
  for (const [index, row] of rows.entries()) {
    try {
      if (row.length !== headers.length)
        throw new Error("Número de colunas diferente do cabeçalho.");
      const value: Record<string, unknown> = {};
      for (const key of Object.keys(stockInput.shape)) {
        const column = mapping[key];
        if (!column) continue;
        const at = headers.indexOf(column);
        if (at < 0) throw new Error(`Coluna não encontrada: ${column}`);
        const raw = row[at];
        if (!raw) continue;
        if (["quantity", "costBrl", "priceBrl", "reorderPoint"].includes(key)) {
          const normalized = raw.replace(/^R\$\s*/, "").trim();
          if (
            !/^-?\d+(?:\.\d{3})*(?:,\d{1,2})?$|^-?\d+(?:\.\d{1,2})?$/.test(
              normalized,
            )
          )
            throw new Error(`Número inválido em ${column}.`);
          value[key] = Number(
            normalized.includes(",")
              ? normalized.replace(/\./g, "").replace(",", ".")
              : normalized,
          );
        } else value[key] = raw;
      }
      const item = stockInput.parse(value);
      if (seen.has(item.sku)) throw new Error(`SKU duplicado: ${item.sku}`);
      seen.add(item.sku);
      items.push(item);
    } catch (error) {
      errors.push({
        line: index + 2,
        message:
          error instanceof z.ZodError
            ? error.issues
                .map((i) => `${i.path.join(".")}: ${i.message}`)
                .join("; ")
            : (error as Error).message,
      });
    }
  }
  return { items, errors, total: rows.length };
}

export function csvCell(value: unknown) {
  let text = String(value ?? "");
  // Prevent spreadsheet formula execution when exports are opened in Excel.
  if (/^[=+\-@\t\r]/.test(text)) text = `'${text}`;
  return `"${text.replace(/"/g, '""')}"`;
}

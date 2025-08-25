export type ParsedCsv = { headers: string[]; rows: string[][] }

export function detectDelimiter(text: string): ',' | '\t' {
  return text.includes('\t') ? '\t' : ','
}

export function parseCsv(text: string, forceComma = false): ParsedCsv {
  const delimiter = forceComma ? ',' : detectDelimiter(text)
  const lines = text.split(/\r?\n/).filter(Boolean)
  const rows = lines.map(line => line.split(delimiter).map(cell => cell.trim()))
  const headers = rows.shift() || []
  return { headers, rows }
}

export function toRowMap(headers: string[], row: string[]): Record<string, string> {
  const map: Record<string, string> = {}
  headers.forEach((h, i) => { map[h] = row[i] ?? '' })
  return map
}

export function headersMatch(actual: string[], expected: string[]): boolean {
  if (actual.length !== expected.length) return false
  for (let i = 0; i < actual.length; i++) {
    const a = actual[i].replace(/\s+/g, '').toLowerCase()
    const e = expected[i].replace(/\s+/g, '').toLowerCase()
    if (a !== e) return false
  }
  return true
}

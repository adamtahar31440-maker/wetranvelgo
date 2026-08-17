// Postgres throws a hard "value too long for type character varying(N)"
// error on insert/update if a form field exceeds its column's varchar limit
// — an uncaught DB error that crashes the whole request (no partial save,
// no friendly message). Truncating before writing means a pro pasting an
// overlong address/URL/name never loses their whole submission over it.
export function truncate(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

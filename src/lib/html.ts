// Article bodies are stored as HTML; meta descriptions (and any other plain-text
// use) need the tags stripped back out rather than dumped raw into a <meta> tag.
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

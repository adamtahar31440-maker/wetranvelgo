import sanitizeHtml from "sanitize-html";

// Allowlist matches exactly what the article RichTextEditor's toolbar can produce
// (see src/components/admin/rich-text-editor.tsx) — nothing more, so translation
// output (AI-generated) can't smuggle in scripts or unexpected tags either.
const OPTIONS: sanitizeHtml.IOptions = {
  allowedTags: ["p", "strong", "em", "h2", "ul", "ol", "li", "img", "br"],
  allowedAttributes: {
    img: ["src", "alt"],
  },
  allowedSchemes: ["https"],
};

export function sanitizeBody(html: string): string {
  return sanitizeHtml(html, OPTIONS);
}

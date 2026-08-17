import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export type ExtractedProduct = { name: string; price: number | null; category: string | null };

export async function extractProductsFromImages(
  images: { mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; base64: string }[]
): Promise<ExtractedProduct[]> {
  if (images.length === 0) return [];

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 4096,
    system:
      "You extract menu items, products, or price-list entries from photos of physical documents " +
      "(restaurant menus, hairdresser price lists, shop price tags, activity price boards, etc.) for a " +
      "Morocco tourism business directory. Read every item name and its price if visible. Extract the " +
      "numeric price exactly as written (no currency conversion). If a price isn't shown for an item, " +
      "use null. Ignore headers, decorative text, addresses, phone numbers, and anything that isn't an " +
      "actual product/service/price entry. " +
      "The document is usually organized into sections with a heading (e.g. Entrées/Plats/Desserts for " +
      "a restaurant menu, or Coupe/Coloration/Soins for a hairdresser price list). For every item, set " +
      "category to the exact section heading it appears under, written exactly as it appears on the " +
      "document (same language, same wording). If the document has no section headings at all, set " +
      "category to null for every item — do not invent categories that aren't written on the document. " +
      "LANGUAGE: output every item name and category in French, no matter what language(s) are printed " +
      "on the document. If the document (or part of it) is only in another language (English, Arabic, " +
      "Spanish, etc.), translate it into natural, professional French as you extract it. Never leave a " +
      "name/category in a non-French language in the output. " +
      "IMPORTANT — bilingual documents: many menus/price lists show the exact same items twice, once per " +
      "language, side by side in two columns or two blocks (e.g. a French column and an English column " +
      "listing the same dishes in the same order, or French/Arabic pairs). When you detect this pattern, " +
      "output each item only ONCE: reuse the French wording already printed on the document when a French " +
      "version is present (do not re-translate it, just copy it as written), and translate from the other " +
      "language only for items that have no French version anywhere on the document. Only output items in " +
      "more than one language if they are genuinely different items, not translations of each other.",
    messages: [
      {
        role: "user",
        content: [
          ...images.map((img) => ({
            type: "image" as const,
            source: { type: "base64" as const, media_type: img.mediaType, data: img.base64 },
          })),
          {
            type: "text" as const,
            text: "Extract every product/service, its price, and its section/category heading (if any) from these document photos.",
          },
        ],
      },
    ],
    output_config: {
      format: {
        type: "json_schema",
        schema: {
          type: "object",
          properties: {
            items: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  name: { type: "string" },
                  price: { type: ["number", "null"] },
                  category: { type: ["string", "null"] },
                },
                required: ["name", "price", "category"],
                additionalProperties: false,
              },
            },
          },
          required: ["items"],
          additionalProperties: false,
        },
      },
    },
  });

  const block = response.content.find((c) => c.type === "text");
  if (!block || block.type !== "text") return [];
  try {
    const parsed = JSON.parse(block.text) as { items: ExtractedProduct[] };
    return parsed.items ?? [];
  } catch {
    return [];
  }
}

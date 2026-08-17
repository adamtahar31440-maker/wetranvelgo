import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5";

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export type ExtractedMenuVariant = { label: string; price: number };
export type ExtractedMenuItem = {
  name: string;
  description: string | null;
  price: number | null;
  category: string | null;
  variants: ExtractedMenuVariant[] | null;
};

export async function extractMenuFromImages(
  images: { mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif"; base64: string }[]
): Promise<ExtractedMenuItem[]> {
  if (images.length === 0) return [];

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 8192,
    system:
      "You extract a full priced item list from photos of a physical document (possibly several pages/photos " +
      "of the same document) for a Morocco tourism business directory. The document could be a restaurant " +
      "menu, a hotel's room rates, a spa/salon's service list, a shop's price list, an activity provider's " +
      "tour/excursion rates, a car rental agency's vehicle rates, a real-estate agency's property list, or a " +
      "similar priced catalog — apply every rule below identically no matter which of these it is; never " +
      "let the specific business type change how you follow them. Read every item, its short description if " +
      "printed under/next to the name (leave null if none), and its price(s). " +
      "LANGUAGE (follow this for every single field, on every item, no exceptions): output item names, " +
      "descriptions, category headings, and variant labels in French ONLY — regardless of what language(s) " +
      "the document is actually printed in, and regardless of whether it's a restaurant menu, a hotel rate " +
      "card, a spa/massage service list, a rental price sheet, a property listing, or anything else. If the " +
      "document (or part of it) is in another language (English, Arabic, Spanish, German, etc.), you must " +
      "translate it into natural, professional French tourism-business wording as you extract it — do not " +
      "copy the source-language text through unchanged, and do not skip translating just because the item is " +
      "a service, a room type, or a product rather than a dish. The one exception: reuse text that's already " +
      "written in French on the document exactly as printed, don't re-translate it. " +
      "CATEGORIES: some documents have two levels of heading — a main section title (e.g. TAPAS, SANDWICHES; " +
      "or SUV, BERLINES for a rental price list) with smaller subheadings printed underneath it (e.g. " +
      "\"Sea | Mer\" and \"Land | Terre\" under TAPAS; or a distinct item type like \"PIZZA\" listed under " +
      "SANDWICHES purely for page layout). For every item, output exactly ONE category — never concatenate " +
      "a main heading with a subheading into one made-up string (never output something like \"Tapas Mer\" " +
      "or \"Tapas Terre\"). Pick which single level to use with judgment: " +
      "(a) if the subheading is just a flavor/ingredient/variant-based split of the SAME item type as the " +
      "main heading (e.g. Sea vs. Land are both still tapas), use the main heading alone for every item " +
      "under it, ignoring the subheading — so every item under TAPAS > Sea/Mer and TAPAS > Land/Terre gets " +
      "category \"Tapas\"; " +
      "(b) if the subheading actually names a different item type than the main heading and was only " +
      "nested under it for space (e.g. PIZZA items listed under a SANDWICHES header — a pizza is not a " +
      "sandwich), use the subheading alone as the category for those items (\"Pizza\"), not the main " +
      "heading, so a customer browsing by item type finds it correctly. " +
      "If a photo has no section headings at all, set category to null for its items — never invent one. " +
      "Category headings follow the same LANGUAGE rule above: translate a non-French heading into French too. " +
      "MULTIPLE PRICES / VARIANTS: many items list more than one price for different variants (e.g. a " +
      "drink's verre/bouteille, a room's single/double occupancy, a rental's daily/weekly rate). When an " +
      "item has exactly one price, set price to that number and leave variants null. When an item has more " +
      "than one price for different variants, set price to null and instead fill variants with one entry " +
      "per variant, label set to the variant name (e.g. \"Verre\", \"Bouteille\") — in French, per the " +
      "LANGUAGE rule above, even if printed in another language on the document — and price the matching " +
      "number. Extract prices exactly as written, no currency conversion. " +
      "IMPORTANT — bilingual documents: many documents show the exact same items twice, once per language, " +
      "in two columns or two blocks (e.g. French/English or French/Arabic pairs of the same item). Output " +
      "each item only ONCE: reuse the French wording already printed on the document when a French version " +
      "is present (do not re-translate it, just copy it as written), and translate from the other language " +
      "only for items that have no French version anywhere on the document. Do not output the same item " +
      "twice just because it's printed in two languages. " +
      "Ignore the business's own name/logo, addresses, phone numbers, opening hours, decorative text, and " +
      "anything that isn't an actual priced item entry. " +
      "Before you answer, double-check every single name/description/category/variant value you're about to " +
      "output: if any of them is still in English, Arabic, Spanish, or any language other than French, " +
      "translate it to French now — the final JSON must not contain any non-French text anywhere.",
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
            text: "Extract the full item list (every entry, description, price or variants, and section) from these photos.",
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
                  description: { type: ["string", "null"] },
                  price: { type: ["number", "null"] },
                  category: { type: ["string", "null"] },
                  variants: {
                    type: ["array", "null"],
                    items: {
                      type: "object",
                      properties: {
                        label: { type: "string" },
                        price: { type: "number" },
                      },
                      required: ["label", "price"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["name", "description", "price", "category", "variants"],
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
    const parsed = JSON.parse(block.text) as { items: ExtractedMenuItem[] };
    return parsed.items ?? [];
  } catch {
    return [];
  }
}

import Anthropic from "@anthropic-ai/sdk";

const MODEL = "claude-haiku-4-5";

const LANGUAGE_NAMES: Record<string, string> = {
  fr: "French",
  en: "English",
  ar: "Arabic",
  es: "Spanish",
  de: "German",
  it: "Italian",
  pt: "Portuguese",
  ru: "Russian",
  zh: "Simplified Chinese",
  ko: "Korean",
  tr: "Turkish",
  he: "Hebrew",
};

let _client: Anthropic | null = null;
function getClient() {
  if (!_client) _client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return _client;
}

export async function generateBusinessDescription(
  keywords: string,
  locale: string,
  context?: { name?: string; category?: string }
): Promise<string> {
  const languageName = LANGUAGE_NAMES[locale] ?? "French";
  const contextLines = [
    context?.name ? `Business name: ${context.name}` : null,
    context?.category ? `Category: ${context.category}` : null,
  ].filter(Boolean);

  const response = await getClient().messages.create({
    model: MODEL,
    max_tokens: 1024,
    system:
      "You write short, professional, appealing tourism business descriptions for a Morocco travel " +
      "directory (Essaouira Inside), based on a handful of keywords or notes the business owner provides. " +
      "Write 2-4 warm, concrete, tourism-oriented sentences that genuinely showcase the business and make " +
      "it appealing to visitors, without generic filler, exaggerated claims, or emojis. Do not invent " +
      "specific facts (exact prices, awards, years in business) that weren't implied by the keywords. " +
      `Write entirely in ${languageName}. Output only the description text — no title, no quotes, no commentary.`,
    messages: [
      {
        role: "user",
        content:
          (contextLines.length > 0 ? contextLines.join("\n") + "\n\n" : "") +
          `Keywords/notes from the owner: ${keywords}`,
      },
    ],
  });

  const block = response.content.find((c) => c.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

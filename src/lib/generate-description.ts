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
      "directory (WeTravelGo), based on a handful of keywords or notes the business owner provides. " +
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

// Event announcements written by pros in the dashboard. Unlike the business
// description (built from a few keywords), the pro usually already wrote a
// draft: polish it — spelling, clarity, appeal — without changing any fact.
// Always French: events are written in French and auto-translated on save.
const EVENT_MODEL = "claude-opus-5-5";

export async function improveEventDescription(
  text: string,
  context?: { title?: string; date?: string; place?: string; businessName?: string }
): Promise<string> {
  const contextLines = [
    context?.title ? `Event title: ${context.title}` : null,
    context?.businessName ? `Organized by: ${context.businessName}` : null,
    context?.date ? `Date: ${context.date}` : null,
    context?.place ? `Place: ${context.place}` : null,
  ].filter(Boolean);

  const response = await getClient().messages.create({
    model: EVENT_MODEL,
    max_tokens: 2048,
    output_config: { effort: "low" },
    system:
      "You help local businesses in Morocco write the announcement of an event (concert, soirée, workshop, " +
      "festival, tasting, special offer...) for the WeTravelGo travel directory. The organizer gives you their " +
      "draft or a few notes. Rewrite it as 3-5 warm, clear, inviting sentences in French that make visitors " +
      "want to come: say what it is, what makes it special, and practical details only if they were given. " +
      "Fix spelling and grammar. Keep every fact from the draft (times, prices, menu, artists, booking " +
      "conditions) exactly as given, and never invent facts that weren't provided — no made-up prices, " +
      "times, guests or promises. The date and place are shown separately on the page, so don't repeat them " +
      "unless the draft insists on them. No title, no emojis, no hashtags, no quotes, no commentary — output " +
      "only the description text.",
    messages: [
      {
        role: "user",
        content: (contextLines.length > 0 ? contextLines.join("\n") + "\n\n" : "") + `Organizer's draft/notes: ${text}`,
      },
    ],
  });

  const block = response.content.find((c) => c.type === "text");
  return block && block.type === "text" ? block.text.trim() : "";
}

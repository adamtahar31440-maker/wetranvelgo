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

// Anthropic rejects overly large strict json_schema grammars ("compiled grammar is
// too large") and long outputs can get cut off mid-JSON if a chunk's total translated
// text approaches max_tokens. Field count grows unboundedly with the number of
// products a pro adds, and a single field (e.g. description) can be a long paragraph,
// so chunks are bounded by both field count and cumulative source character length.
const MAX_FIELDS_PER_CALL = 6;
const MAX_CHARS_PER_CALL = 600;

export async function translateFields(
  fields: Record<string, string>,
  targetLocales: string[],
  sourceLocale: string = "fr",
  // Called after each chunk resolves (success or swallowed per-chunk failure),
  // so a caller can persist progress as it happens — a large menu's translation
  // can run past the function's time budget, and without this every chunk
  // finished before the cutoff would be thrown away along with the ones that
  // never got the chance to run.
  onChunk?: (chunkResult: Record<string, Record<string, string>>) => void
): Promise<Record<string, Record<string, string>>> {
  const entries = Object.entries(fields).filter(([, v]) => v.trim().length > 0);
  if (entries.length === 0) return {};

  const locales = targetLocales.filter((l) => l !== sourceLocale && LANGUAGE_NAMES[l]);
  if (locales.length === 0) return {};

  const chunks: [string, string][][] = [];
  let current: [string, string][] = [];
  let currentChars = 0;
  for (const entry of entries) {
    const [, value] = entry;
    if (
      current.length > 0 &&
      (current.length >= MAX_FIELDS_PER_CALL || currentChars + value.length > MAX_CHARS_PER_CALL)
    ) {
      chunks.push(current);
      current = [];
      currentChars = 0;
    }
    current.push(entry);
    currentChars += value.length;
  }
  if (current.length > 0) chunks.push(current);

  // Firing every chunk at once works fine for a normal fiche (a handful of
  // chunks) but a large digital menu (100+ dishes) can produce 40+ chunks —
  // all in flight simultaneously blew past Anthropic's concurrent-request
  // rate limit and made most chunks fail at once (each failure is caught
  // silently per-chunk, so the visible symptom was "half the menu never
  // translated" rather than an error). Capping concurrency paces the calls
  // instead, without changing behavior for small inputs.
  const CONCURRENCY = 4;
  const results: Record<string, Record<string, string>>[] = new Array(chunks.length);
  let nextIndex = 0;
  async function worker() {
    while (nextIndex < chunks.length) {
      const i = nextIndex++;
      results[i] = await translateChunk(chunks[i], locales, sourceLocale);
      onChunk?.(results[i]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, chunks.length) }, worker));

  return Object.assign({}, ...results);
}

async function translateChunk(
  entries: [string, string][],
  locales: string[],
  sourceLocale: string
): Promise<Record<string, Record<string, string>>> {
  const properties: Record<string, unknown> = {};
  for (const [field] of entries) {
    properties[field] = {
      type: "object",
      properties: Object.fromEntries(locales.map((l) => [l, { type: "string" }])),
      required: locales,
      additionalProperties: false,
    };
  }

  const sourceText = entries.map(([field, value]) => `${field}: """${value}"""`).join("\n\n");
  const localeList = locales.map((l) => `${l} (${LANGUAGE_NAMES[l]})`).join(", ");
  const sourceLanguageName = LANGUAGE_NAMES[sourceLocale] ?? "French";

  // A translation hiccup (schema too large, output cut off, API error) must never
  // crash the whole save — the pro would just see a blank error page. Fields that
  // fail to translate this round simply keep their source-language value only;
  // the next save retries them.
  try {
    const response = await getClient().messages.create({
      model: MODEL,
      max_tokens: 8192,
      system:
        "You are a professional tourism translator for a Morocco travel platform (WeTravelGo). " +
        `Translate the given ${sourceLanguageName} source fields into every requested target language. ` +
        "Keep proper nouns, brand names, and place names in their original script. " +
        "Preserve tone (warm, informative, tourism-oriented) and any formatting. Do not add commentary. " +
        "Some field values are HTML (e.g. <p>, <strong>, <em>, <h2>, <ul><li>, <img src=... alt=...>) rather " +
        "than plain text. For those, reproduce the exact same tags, attributes, and nesting — including " +
        "every <img> tag's src URL untouched — and translate only the human-readable text between tags " +
        "(and the alt attribute, if present). Never drop, add, or reorder tags.",
      messages: [
        {
          role: "user",
          content: `Translate these ${sourceLanguageName} fields into: ${localeList}.\n\n${sourceText}`,
        },
      ],
      output_config: {
        format: {
          type: "json_schema",
          schema: {
            type: "object",
            properties,
            required: Object.keys(properties),
            additionalProperties: false,
          },
        },
      },
    });

    const block = response.content.find((c) => c.type === "text");
    if (!block || block.type !== "text") return {};
    return JSON.parse(block.text) as Record<string, Record<string, string>>;
  } catch (err) {
    console.error("translateFields chunk failed:", err);
    return {};
  }
}

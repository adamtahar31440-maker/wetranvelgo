"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";

export function NewsletterForm() {
  const t = useTranslations("home");
  const locale = useLocale();
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    await fetch("/api/newsletter", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, locale }),
    });
    setStatus("done");
    setEmail("");
  }

  if (status === "done") {
    return <p className="text-sm font-medium text-white">{t("newsletterSuccess")}</p>;
  }

  return (
    <form onSubmit={onSubmit} className="flex w-full max-w-md flex-col gap-2 sm:flex-row">
      <input
        required
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("newsletterPlaceholder")}
        className="w-full rounded-full bg-white px-4 py-2.5 text-sm text-foreground outline-none"
      />
      <button
        type="submit"
        disabled={status === "loading"}
        className="shrink-0 rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white transition hover:opacity-90 disabled:opacity-60"
      >
        {t("newsletterCta")}
      </button>
    </form>
  );
}

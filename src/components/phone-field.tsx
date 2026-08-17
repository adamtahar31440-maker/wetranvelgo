"use client";

import { useState } from "react";
import { PHONE_COUNTRY_CODES } from "@/lib/phone-country-codes";

export function PhoneField({
  name,
  defaultValue,
  dir,
}: {
  name: string;
  defaultValue?: string;
  dir?: "ltr" | "rtl";
}) {
  const matched = defaultValue
    ? PHONE_COUNTRY_CODES.find((c) => defaultValue.startsWith(c.code))
    : undefined;
  const [countryCode, setCountryCode] = useState(matched?.code ?? "+212");
  const [local, setLocal] = useState(matched ? defaultValue!.slice(matched.code.length).trim() : defaultValue ?? "");
  const digits = local.replace(/\D/g, "").replace(/^0+/, "");
  const full = digits ? `${countryCode}${digits}` : "";

  return (
    <div>
      <div
        className="flex items-stretch rounded-lg border border-black/10 focus-within:border-ocean-dark"
        dir="ltr"
      >
        <select
          value={countryCode}
          onChange={(e) => setCountryCode(e.target.value)}
          className="w-24 shrink-0 truncate rounded-l-lg border-r border-black/10 bg-sand px-2 text-sm font-medium text-foreground/70 outline-none"
        >
          {PHONE_COUNTRY_CODES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <input
          type="tel"
          value={local}
          onChange={(e) => setLocal(e.target.value)}
          className="min-w-0 flex-1 rounded-r-lg px-3 py-2 text-sm outline-none"
          placeholder="6XX XXX XXX"
          dir={dir}
        />
      </div>
      <input type="hidden" name={name} value={full} />
    </div>
  );
}

import { getTranslations } from "next-intl/server";
import { saveOwnEvent } from "@/lib/event-actions";
import { toDateTimeLocal, type EventRow } from "@/lib/events";
import { SingleImageField } from "@/components/single-image-field";
import { SubmitButton } from "@/components/submit-button";

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export async function EventForm({
  locale,
  establishments,
  event,
  defaultEstablishmentId,
}: {
  locale: string;
  establishments: { id: number; name: Record<string, string> }[];
  event?: EventRow;
  defaultEstablishmentId?: number;
}) {
  const t = await getTranslations("events");
  const tDash = await getTranslations("dashboard");
  const priceType = event?.isFree ? "free" : event?.priceMad != null ? "paid" : event ? "unspecified" : "free";
  const establishmentId = event ? event.establishmentId ?? "" : defaultEstablishmentId ?? establishments[0]?.id ?? "";

  return (
    <form action={saveOwnEvent} className="space-y-5 rounded-2xl border border-black/5 bg-white p-6">
      <input type="hidden" name="locale" value={locale} />
      {event && <input type="hidden" name="id" value={event.id} />}

      <p className="rounded-lg bg-ocean-dark/5 px-3 py-2 text-xs text-foreground/60">
        {t("writeInFrench")} {event && t("resubmitNote")}
      </p>

      <div>
        <label className={labelClass} htmlFor="ev-title">{t("fieldTitle")}</label>
        <input id="ev-title" name="title" required maxLength={160} defaultValue={event?.title.fr ?? ""} className={inputClass} />
      </div>

      <div>
        <label className={labelClass} htmlFor="ev-description">{t("fieldDescription")}</label>
        <textarea
          id="ev-description"
          name="description"
          rows={6}
          defaultValue={event?.description.fr ?? ""}
          className={inputClass}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="ev-start">{t("fieldStart")}</label>
          <input
            id="ev-start"
            type="datetime-local"
            name="startsAt"
            required
            defaultValue={toDateTimeLocal(event?.startsAt ?? null)}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ev-end">{t("fieldEnd")}</label>
          <input
            id="ev-end"
            type="datetime-local"
            name="endsAt"
            defaultValue={toDateTimeLocal(event?.endsAt ?? null)}
            className={inputClass}
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="ev-establishment">{t("fieldEstablishment")}</label>
          <select id="ev-establishment" name="establishmentId" defaultValue={String(establishmentId)} className={inputClass}>
            {establishments.map((e) => (
              <option key={e.id} value={e.id}>{e.name.fr}</option>
            ))}
            <option value="">{t("otherEstablishment")}</option>
          </select>
        </div>
        <div>
          <label className={labelClass} htmlFor="ev-location">{t("fieldLocation")}</label>
          <input id="ev-location" name="location" maxLength={255} defaultValue={event?.location ?? ""} className={inputClass} />
          <p className="mt-1 text-xs text-foreground/50">{t("locationHint")}</p>
        </div>
      </div>

      <fieldset>
        <legend className={labelClass}>{t("fieldPriceType")}</legend>
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {(["free", "paid", "unspecified"] as const).map((type) => (
            <label key={type} className="flex items-center gap-2">
              <input type="radio" name="priceType" value={type} defaultChecked={priceType === type} />
              {type === "free" ? t("priceFree") : type === "paid" ? t("pricePaid") : t("priceUnspecified")}
            </label>
          ))}
          <label className="flex items-center gap-2">
            <span className="text-xs text-foreground/60">{t("fieldPrice")}</span>
            <input
              type="number"
              name="priceMad"
              min={0}
              step={1}
              defaultValue={event?.priceMad ?? ""}
              className="w-28 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-ocean-dark"
            />
          </label>
        </div>
      </fieldset>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass} htmlFor="ev-booking">{t("fieldBookingUrl")}</label>
          <input
            id="ev-booking"
            type="url"
            name="bookingUrl"
            maxLength={255}
            placeholder="https://"
            defaultValue={event?.bookingUrl ?? ""}
            className={inputClass}
          />
        </div>
        <div>
          <label className={labelClass} htmlFor="ev-phone">{t("fieldPhone")}</label>
          <input id="ev-phone" type="tel" name="phone" maxLength={64} defaultValue={event?.phone ?? ""} className={inputClass} />
        </div>
      </div>

      <SingleImageField
        name="coverImage"
        label={t("fieldCover")}
        defaultValue={event?.coverImage}
        shape="banner"
        unsupportedFormatText={tDash("imagesUnsupportedFormat")}
      />

      <SubmitButton label={t("save")} pendingLabel={t("saving")} />
    </form>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft, Plus } from "lucide-react";
import { safeCurrentUser } from "@/lib/auth";
import { getProfessionalByClerkId, getEstablishmentsByProfessionalId, adminGetCities } from "@/lib/admin-data";
import { getEventsByProfessionalId, formatEventRange, isEventOver, EVENTS_SECTION_SLUG } from "@/lib/events";
import { deleteOwnEvent } from "@/lib/event-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";
import { UpdateSuccessBanner } from "@/components/update-success-banner";
import { cn } from "@/lib/utils";

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function ProEventsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ saved?: string }>;
}) {
  const { locale } = await params;
  const { saved } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("events");

  const user = await safeCurrentUser();
  const professional = user ? await getProfessionalByClerkId(user.id) : null;
  if (!professional) redirect(`/${locale}/pro/dashboard`);

  const backLink = (
    <Link
      href={`/${locale}/pro/dashboard`}
      className="inline-flex items-center gap-1.5 text-sm font-medium text-azur hover:underline"
    >
      <ArrowLeft size={16} /> {t("backToDashboard")}
    </Link>
  );

  if (professional.status !== "validated") {
    return (
      <div className="space-y-6">
        {backLink}
        <h1 className="text-2xl font-semibold text-ocean-dark">{t("myEventsTitle")}</h1>
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">{t("notValidated")}</div>
      </div>
    );
  }

  const [myEvents, myEstablishments, cities] = await Promise.all([
    getEventsByProfessionalId(professional.id),
    getEstablishmentsByProfessionalId(professional.id),
    adminGetCities(),
  ]);
  const establishmentById = new Map(myEstablishments.map((e) => [e.id, e]));
  const cityById = new Map(cities.map((c) => [c.id, c]));
  const statusLabel: Record<string, string> = {
    pending: t("statusPending"),
    approved: t("statusApproved"),
    rejected: t("statusRejected"),
  };

  return (
    <div className="space-y-6">
      {saved === "1" && <UpdateSuccessBanner message={t("saved")} />}
      {backLink}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-xl">
          <h1 className="text-2xl font-semibold text-ocean-dark">{t("myEventsTitle")}</h1>
          <p className="mt-1 text-sm text-foreground/60">{t("myEventsIntro")}</p>
        </div>
        <Link
          href={`/${locale}/pro/dashboard/evenements/nouveau`}
          className="inline-flex items-center gap-1.5 rounded-full bg-ocean-dark px-4 py-2 text-sm font-semibold text-white hover:bg-ocean"
        >
          <Plus size={16} /> {t("newEvent")}
        </Link>
      </div>

      {myEvents.length === 0 ? (
        <p className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-foreground/60">{t("noEvents")}</p>
      ) : (
        <ul className="space-y-3">
          {myEvents.map((e) => {
            const over = isEventOver(e);
            const city = cityById.get(e.cityId);
            const est = e.establishmentId ? establishmentById.get(e.establishmentId) : null;
            return (
              <li key={e.id} className="flex flex-col gap-4 rounded-2xl border border-black/5 bg-white p-4 sm:flex-row">
                {e.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.coverImage} alt="" className="h-24 w-full rounded-xl object-cover sm:w-36" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold text-ocean-dark">{e.title.fr}</p>
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_COLORS[e.status])}>
                      {statusLabel[e.status]}
                    </span>
                    {over && (
                      <span className="rounded-full bg-black/5 px-2.5 py-0.5 text-xs font-semibold text-foreground/50">
                        {t("statusPast")}
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground/70">{formatEventRange(e, locale, "short")}</p>
                  <p className="text-sm text-foreground/60">
                    {est ? est.name.fr : t("otherEstablishment")}
                    {" · "}
                    {e.isFree ? t("free") : e.priceMad != null ? `${e.priceMad} MAD` : t("priceUnspecified")}
                  </p>
                  {e.status === "rejected" && e.rejectionReason && (
                    <p className="mt-1 text-xs text-red-700">{t("rejectionReason", { reason: e.rejectionReason })}</p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-4 text-sm">
                    <Link href={`/${locale}/pro/dashboard/evenements/${e.id}`} className="font-medium text-ocean-dark hover:underline">
                      {t("edit")}
                    </Link>
                    {e.status === "approved" && !over && city && (
                      <a
                        href={`/${locale}/${city.slug}/${EVENTS_SECTION_SLUG}/${e.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-azur hover:underline"
                      >
                        {t("viewOnline")}
                      </a>
                    )}
                    <form action={deleteOwnEvent.bind(null, e.id)}>
                      <ConfirmSubmitButton confirmText={t("deleteConfirm")} className="text-red-600 hover:underline">
                        {t("delete")}
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

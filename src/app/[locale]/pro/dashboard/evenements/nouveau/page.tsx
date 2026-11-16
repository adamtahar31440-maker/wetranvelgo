import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowLeft } from "lucide-react";
import { safeCurrentUser } from "@/lib/auth";
import { getProfessionalByClerkId, getEstablishmentsByProfessionalId } from "@/lib/admin-data";
import { EventForm } from "@/components/event-form";

export default async function NewProEventPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ establishment?: string }>;
}) {
  const { locale } = await params;
  const { establishment } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("events");

  const user = await safeCurrentUser();
  const professional = user ? await getProfessionalByClerkId(user.id) : null;
  if (!professional || professional.status !== "validated") redirect(`/${locale}/pro/dashboard/evenements`);

  const myEstablishments = await getEstablishmentsByProfessionalId(professional.id);

  return (
    <div className="space-y-6">
      <Link
        href={`/${locale}/pro/dashboard/evenements`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-azur hover:underline"
      >
        <ArrowLeft size={16} /> {t("myEventsTitle")}
      </Link>
      <h1 className="text-2xl font-semibold text-ocean-dark">{t("newEvent")}</h1>
      <EventForm
        locale={locale}
        establishments={myEstablishments}
        defaultEstablishmentId={Number(establishment) || undefined}
      />
    </div>
  );
}

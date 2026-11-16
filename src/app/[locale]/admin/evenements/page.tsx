import { redirect } from "next/navigation";
import { safeCurrentUser as currentUser } from "@/lib/auth";
import { can, type Role } from "@/lib/roles";
import { adminGetEvents, formatEventRange, isEventOver, EVENTS_SECTION_SLUG } from "@/lib/events";
import { adminGetCities, adminGetEstablishments } from "@/lib/admin-data";
import { setEventStatus, adminDeleteEvent } from "@/lib/event-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";
import { cn } from "@/lib/utils";

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Publié",
  rejected: "Refusé",
};
const STATUS_COLORS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-700",
  approved: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default async function AdminEventsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const user = await currentUser();
  if (!can(user?.publicMetadata?.role as Role | undefined, "events")) redirect(`/${locale}/admin`);

  const [rows, establishments, cities] = await Promise.all([
    adminGetEvents(),
    adminGetEstablishments(),
    adminGetCities(),
  ]);
  const establishmentById = new Map(establishments.map((e) => [e.id, e]));
  const cityById = new Map(cities.map((c) => [c.id, c]));

  return (
    <div>
      <h1 className="text-2xl font-semibold text-ocean-dark">Événements</h1>
      <p className="mt-1 mb-6 text-sm text-foreground/60">
        Proposés par les professionnels validés. Un événement n&apos;apparaît sur le site qu&apos;une fois publié ici,
        et repasse en attente à chaque modification par le pro.
      </p>

      <div className="space-y-4">
        {rows.length === 0 && (
          <p className="rounded-2xl border border-black/5 bg-white p-8 text-center text-sm text-foreground/50">
            Aucun événement pour le moment.
          </p>
        )}
        {rows.map(({ event: e, companyName }) => {
          const est = e.establishmentId ? establishmentById.get(e.establishmentId) : null;
          const city = cityById.get(e.cityId);
          const over = isEventOver(e);
          return (
            <div key={e.id} className="rounded-2xl border border-black/5 bg-white p-5">
              <div className="flex flex-col gap-4 sm:flex-row">
                {e.coverImage && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.coverImage} alt="" className="h-28 w-full rounded-xl object-cover sm:w-44" />
                )}
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-semibold text-ocean-dark">{e.title.fr}</h2>
                    <span className={cn("rounded-full px-3 py-0.5 text-xs font-semibold", STATUS_COLORS[e.status])}>
                      {STATUS_LABELS[e.status]}
                    </span>
                    {over && (
                      <span className="rounded-full bg-black/5 px-3 py-0.5 text-xs font-semibold text-foreground/50">
                        Terminé
                      </span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-foreground/70">{formatEventRange(e, "fr", "short")}</p>
                  <p className="text-sm text-foreground/60">
                    {companyName ?? "—"}
                    {est && <> · {est.name.fr}</>}
                    {city && <> · {city.name.fr}</>}
                    {" · "}
                    {e.isFree ? "Gratuit" : e.priceMad != null ? `${e.priceMad} MAD` : "Prix non précisé"}
                  </p>
                  {(e.location || est?.address) && (
                    <p className="text-sm text-foreground/60">{e.location || est?.address}</p>
                  )}
                  {e.description.fr && (
                    <p className="mt-2 line-clamp-3 whitespace-pre-line text-sm text-foreground/70">{e.description.fr}</p>
                  )}
                  {(e.bookingUrl || e.phone) && (
                    <p className="mt-1 break-all text-xs text-foreground/50">
                      {e.bookingUrl}
                      {e.bookingUrl && e.phone && " · "}
                      {e.phone}
                    </p>
                  )}
                  {e.status === "rejected" && e.rejectionReason && (
                    <p className="mt-2 text-xs text-red-700">Motif : {e.rejectionReason}</p>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-4 text-sm">
                    {e.status !== "approved" && (
                      <form action={setEventStatus.bind(null, e.id, "approved")}>
                        <button type="submit" className="font-semibold text-green-700 hover:underline">
                          Publier
                        </button>
                      </form>
                    )}
                    {e.status === "approved" && city && (
                      <a
                        href={`/${locale}/${city.slug}/${EVENTS_SECTION_SLUG}/${e.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-azur hover:underline"
                      >
                        Voir en ligne
                      </a>
                    )}
                    {e.status !== "rejected" && (
                      <form action={setEventStatus.bind(null, e.id, "rejected")} className="flex items-center gap-2">
                        <input
                          name="reason"
                          placeholder="Motif (optionnel, visible par le pro)"
                          className="w-56 rounded-lg border border-black/10 px-2 py-1 text-xs outline-none focus:border-ocean-dark"
                        />
                        <button type="submit" className="text-amber-700 hover:underline">
                          Refuser
                        </button>
                      </form>
                    )}
                    <form action={adminDeleteEvent.bind(null, e.id)}>
                      <ConfirmSubmitButton confirmText="Supprimer cet événement ?" className="text-red-600 hover:underline">
                        Supprimer
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

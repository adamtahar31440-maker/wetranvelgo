import Link from "next/link";
import Image from "next/image";
import { MapPin } from "lucide-react";
import { eventDayBadge, formatEventRange, type EventRow } from "@/lib/events";

export function EventList({
  locale,
  basePath,
  events,
  organizerById,
  title,
  emptyLabel,
  freeLabel,
}: {
  locale: string;
  basePath: string;
  events: EventRow[];
  organizerById: Map<number, { name: Record<string, string>; address: string | null }>;
  title: string;
  emptyLabel: string;
  freeLabel: string;
}) {
  return (
    <div className="mx-auto max-w-7xl px-4 pt-14 sm:px-6">
      <h2 className="text-xl font-semibold text-ocean-dark">{title}</h2>
      {events.length === 0 ? (
        <p className="mt-3 text-sm text-foreground/60">{emptyLabel}</p>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {events.map((e) => {
            const eventTitle = e.title[locale] ?? e.title.fr;
            const organizer = e.establishmentId ? organizerById.get(e.establishmentId) : undefined;
            const place = e.location || organizer?.address;
            const badge = eventDayBadge(e.startsAt, locale);
            return (
              <Link
                key={e.id}
                href={`/${locale}/${basePath}/${e.slug}`}
                className="group block overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="relative aspect-[16/10] w-full overflow-hidden bg-sand">
                  {e.coverImage && (
                    <Image
                      src={e.coverImage}
                      alt={eventTitle}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="(max-width: 768px) 100vw, 33vw"
                    />
                  )}
                  <div className="absolute top-3 left-3 rounded-xl bg-white px-3 py-1.5 text-center shadow-sm rtl:right-3 rtl:left-auto">
                    <p className="text-lg leading-none font-bold text-ocean-dark">{badge.day}</p>
                    <p className="text-xs font-semibold uppercase text-terracotta">{badge.month}</p>
                  </div>
                  {(e.isFree || e.priceMad != null) && (
                    <span className="absolute right-3 bottom-3 rounded-full bg-ocean-dark/90 px-3 py-1 text-xs font-semibold text-white rtl:right-auto rtl:left-3">
                      {e.isFree ? freeLabel : `${e.priceMad} MAD`}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <h3 className="text-base font-semibold text-ocean-dark">{eventTitle}</h3>
                  <p className="mt-1 text-sm text-foreground/60">{formatEventRange(e, locale, "short")}</p>
                  {(organizer || place) && (
                    <p className="mt-1 flex items-start gap-1 text-sm text-foreground/60">
                      <MapPin size={14} className="mt-0.5 shrink-0" />
                      <span className="min-w-0 break-words">
                        {organizer ? organizer.name[locale] ?? organizer.name.fr : place}
                      </span>
                    </p>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

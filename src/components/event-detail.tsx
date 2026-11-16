import Link from "next/link";
import { ArrowLeft, CalendarDays, ExternalLink, MapPin, Phone, Store, Ticket } from "lucide-react";
import { formatEventRange, isEventOver, type EventRow } from "@/lib/events";

export function EventDetail({
  locale,
  event,
  backHref,
  organizer,
  labels,
}: {
  locale: string;
  event: EventRow;
  backHref: string;
  organizer: { name: string; href: string | null; address: string | null } | null;
  labels: {
    back: string;
    date: string;
    location: string;
    price: string;
    free: string;
    organizer: string;
    book: string;
    call: string;
    past: string;
  };
}) {
  const title = event.title[locale] ?? event.title.fr;
  const description = event.description[locale] ?? event.description.fr;
  const place = event.location || organizer?.address;
  const price = event.isFree ? labels.free : event.priceMad != null ? `${event.priceMad} MAD` : null;

  return (
    <div>
      {event.coverImage && (
        <div className="w-full overflow-hidden bg-sand">
          {/* Posters come in any shape — keep their natural aspect ratio. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={event.coverImage} alt={title} className="mx-auto h-auto max-h-[70vh] w-auto max-w-full" />
        </div>
      )}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link href={backHref} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-azur hover:underline">
          <ArrowLeft size={16} /> {labels.back}
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-semibold text-ocean-dark sm:text-4xl">{title}</h1>
          {isEventOver(event) && (
            <span className="rounded-full bg-black/5 px-3 py-1 text-xs font-semibold text-foreground/50">{labels.past}</span>
          )}
        </div>

        <dl className="mt-6 grid gap-4 rounded-2xl border border-black/5 bg-white p-5 shadow-sm sm:grid-cols-2">
          <div className="flex items-start gap-3">
            <CalendarDays size={18} className="mt-0.5 shrink-0 text-terracotta" />
            <div>
              <dt className="text-xs font-semibold text-foreground/50">{labels.date}</dt>
              <dd className="text-sm text-ocean-dark">{formatEventRange(event, locale)}</dd>
            </div>
          </div>
          {place && (
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-0.5 shrink-0 text-terracotta" />
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-foreground/50">{labels.location}</dt>
                <dd className="break-words text-sm text-ocean-dark">{place}</dd>
              </div>
            </div>
          )}
          {price && (
            <div className="flex items-start gap-3">
              <Ticket size={18} className="mt-0.5 shrink-0 text-terracotta" />
              <div>
                <dt className="text-xs font-semibold text-foreground/50">{labels.price}</dt>
                <dd className="text-sm text-ocean-dark">{price}</dd>
              </div>
            </div>
          )}
          {organizer && (
            <div className="flex items-start gap-3">
              <Store size={18} className="mt-0.5 shrink-0 text-terracotta" />
              <div className="min-w-0">
                <dt className="text-xs font-semibold text-foreground/50">{labels.organizer}</dt>
                <dd className="text-sm text-ocean-dark">
                  {organizer.href ? (
                    <Link href={organizer.href} className="font-medium hover:underline">
                      {organizer.name}
                    </Link>
                  ) : (
                    organizer.name
                  )}
                </dd>
              </div>
            </div>
          )}
        </dl>

        {(event.bookingUrl || event.phone) && (
          <div className="mt-5 flex flex-wrap gap-3">
            {event.bookingUrl && (
              <a
                href={event.bookingUrl}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="inline-flex items-center gap-2 rounded-full bg-terracotta px-5 py-2.5 text-sm font-semibold text-white hover:bg-terracotta/90"
              >
                <ExternalLink size={16} /> {labels.book}
              </a>
            )}
            {event.phone && (
              <a
                href={`tel:${event.phone.replace(/\s+/g, "")}`}
                className="inline-flex items-center gap-2 rounded-full border border-ocean-dark/20 px-5 py-2.5 text-sm font-semibold text-ocean-dark hover:bg-ocean-dark/5"
              >
                <Phone size={16} /> {labels.call}
              </a>
            )}
          </div>
        )}

        {description && (
          <p className="mt-8 break-words whitespace-pre-line text-base leading-relaxed text-foreground/80">{description}</p>
        )}
      </div>
    </div>
  );
}

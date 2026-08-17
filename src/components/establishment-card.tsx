import Image from "next/image";
import Link from "next/link";
import { MapPin, Wifi, Car } from "lucide-react";
import { priceLevelLabel } from "@/lib/labels";

export function EstablishmentCard({
  href,
  name,
  image,
  subcategory,
  address,
  priceLevel,
  badge,
  wifi,
  parking,
  avgDailyPriceMad,
  avgDailyPriceLabel,
}: {
  href: string;
  name: string;
  image?: string;
  subcategory?: string;
  address?: string | null;
  priceLevel?: string | null;
  badge?: string | null;
  wifi?: boolean | null;
  parking?: boolean | null;
  avgDailyPriceMad?: number | null;
  // e.g. "{price} MAD/jour" — pre-formatted so the card stays locale-agnostic.
  avgDailyPriceLabel?: string;
}) {
  return (
    <Link
      href={href}
      className="group block overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-sand">
        {image && (
          <Image
            src={image}
            alt={name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 33vw"
          />
        )}
        {badge && (
          <span className="absolute left-3 top-3 rounded-full bg-terracotta px-3 py-1 text-xs font-semibold text-white shadow">
            {badge}
          </span>
        )}
        {priceLevel && (
          <span className="absolute right-3 top-3 rounded-full bg-black/60 px-2.5 py-1 text-xs font-semibold text-white">
            {priceLevelLabel(priceLevel)}
          </span>
        )}
      </div>
      <div className="p-4">
        {subcategory && (
          <p className="text-xs font-semibold uppercase tracking-wide text-azur">{subcategory}</p>
        )}
        <h3 className="mt-1 text-base font-semibold text-ocean-dark">{name}</h3>
        {address && (
          <p className="mt-1 flex items-center gap-1 text-sm text-foreground/60">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{address}</span>
          </p>
        )}
        {avgDailyPriceMad != null && avgDailyPriceLabel && (
          <p className="mt-1 text-sm font-semibold text-terracotta">{avgDailyPriceLabel}</p>
        )}
        {(wifi || parking) && (
          <div className="mt-2 flex items-center gap-3 text-foreground/50">
            {wifi && <Wifi size={15} />}
            {parking && <Car size={15} />}
          </div>
        )}
      </div>
    </Link>
  );
}

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProductCategoryList } from "@/components/product-category-list";
import { MapSection } from "@/components/map-section";

export function ContentDetail({
  locale,
  backHref,
  backLabel,
  title,
  body,
  coverImage,
  priceGroups,
  pricesTitle,
  mapPoints,
  mapTitle,
}: {
  locale: string;
  backHref: string;
  backLabel: string;
  title: string;
  body: string;
  coverImage?: string | null;
  priceGroups?: { category: string | null; items: { name: string; price: number | null }[] }[];
  pricesTitle?: string;
  mapPoints?: { lat: number; lng: number; label: string }[];
  mapTitle?: string;
}) {
  return (
    <div>
      {coverImage && (
        <div className="w-full overflow-hidden bg-sand">
          {/* Natural aspect ratio (unknown dimensions) — no crop, no empty bars. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={coverImage} alt={title} className="h-auto w-full" />
        </div>
      )}
      <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
        <Link href={backHref} className="mb-6 inline-flex items-center gap-1.5 text-sm font-medium text-azur hover:underline">
          <ArrowLeft size={16} /> {backLabel}
        </Link>
        <h1 className="text-3xl font-semibold text-ocean-dark sm:text-4xl">{title}</h1>
        {body && (
          <div
            className="prose prose-lg mt-6 max-w-none text-foreground/80 prose-headings:text-ocean-dark prose-img:rounded-xl"
            dangerouslySetInnerHTML={{ __html: body }}
          />
        )}

        {priceGroups && priceGroups.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-ocean-dark">{pricesTitle}</h2>
            <div className="mt-3">
              <ProductCategoryList groups={priceGroups} />
            </div>
          </div>
        )}

        {mapPoints && mapPoints.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-semibold text-ocean-dark">{mapTitle}</h2>
            <div className="mt-3 h-72 overflow-hidden rounded-2xl border border-black/5 sm:h-96">
              <MapSection points={mapPoints} zoom={14} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

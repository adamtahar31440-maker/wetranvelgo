import Link from "next/link";
import Image from "next/image";

export function ContentHub({
  locale,
  basePath,
  title,
  subtitle,
  pages,
}: {
  locale: string;
  basePath: string;
  title: string;
  subtitle?: string;
  pages: { slug: string; title: Record<string, string>; coverImage?: string | null }[];
}) {
  return (
    <div>
      <div className="bg-sand/40 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6">
          <h1 className="text-3xl font-semibold text-ocean-dark sm:text-4xl">{title}</h1>
          {subtitle && <p className="mt-2 text-foreground/60">{subtitle}</p>}
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-14 sm:px-6">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map((p) => (
            <Link
              key={p.slug}
              href={`/${locale}/${basePath}/${p.slug}`}
              className="group block overflow-hidden rounded-2xl border border-black/5 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-sand">
                {p.coverImage && (
                  <Image
                    src={p.coverImage}
                    alt={p.title[locale] ?? p.title.fr}
                    fill
                    className="object-cover transition duration-500 group-hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 33vw"
                  />
                )}
              </div>
              <div className="p-4">
                <h3 className="text-base font-semibold text-ocean-dark">
                  {p.title[locale] ?? p.title.fr}
                </h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

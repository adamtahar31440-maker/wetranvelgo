import { notFound } from "next/navigation";
import { adminGetContentPageById, adminGetSiteSections } from "@/lib/admin-data";
import { getActiveCities } from "@/lib/data";
import { ContentPageForm } from "@/components/admin/content-page-form";

export default async function EditContentPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const [page, customSections, cities] = await Promise.all([
    adminGetContentPageById(Number(id)),
    adminGetSiteSections(),
    getActiveCities(),
  ]);
  if (!page) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Modifier : {page.title.fr}</h1>
      <ContentPageForm locale={locale} page={page} customSections={customSections} cities={cities} />
    </div>
  );
}

import { ContentPageForm } from "@/components/admin/content-page-form";
import { adminGetSiteSections } from "@/lib/admin-data";
import { getActiveCities } from "@/lib/data";

export default async function NewContentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const [customSections, cities] = await Promise.all([adminGetSiteSections(), getActiveCities()]);
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Nouvelle page</h1>
      <ContentPageForm locale={locale} customSections={customSections} cities={cities} />
    </div>
  );
}

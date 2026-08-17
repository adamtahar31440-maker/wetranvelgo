import { notFound } from "next/navigation";
import { adminGetSiteSectionById } from "@/lib/admin-data";
import { SiteSectionForm } from "@/components/admin/site-section-form";

export default async function EditSiteSectionPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const section = await adminGetSiteSectionById(Number(id));
  if (!section) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Modifier : {section.name.fr}</h1>
      <SiteSectionForm locale={locale} section={section} />
    </div>
  );
}

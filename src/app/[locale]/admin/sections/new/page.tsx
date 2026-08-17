import { SiteSectionForm } from "@/components/admin/site-section-form";

export default async function NewSiteSectionPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Nouvelle section</h1>
      <SiteSectionForm locale={locale} />
    </div>
  );
}

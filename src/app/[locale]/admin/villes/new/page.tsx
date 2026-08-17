import { CityForm } from "@/components/admin/city-form";

export default async function NewCityPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Ajouter une ville</h1>
      <CityForm locale={locale} />
    </div>
  );
}

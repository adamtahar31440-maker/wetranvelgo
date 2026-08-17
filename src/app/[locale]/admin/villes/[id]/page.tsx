import { notFound } from "next/navigation";
import { adminGetCityById } from "@/lib/admin-data";
import { CityForm } from "@/components/admin/city-form";

export default async function EditCityPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;
  const city = await adminGetCityById(Number(id));
  if (!city) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Modifier : {city.name.fr}</h1>
      <CityForm locale={locale} city={city} />
    </div>
  );
}

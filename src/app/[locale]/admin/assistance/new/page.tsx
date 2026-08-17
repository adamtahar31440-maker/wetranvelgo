import { EmergencyContactForm } from "@/components/admin/emergency-contact-form";
import { getActiveCities } from "@/lib/data";

export default async function NewEmergencyContactPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const cities = await getActiveCities();
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Nouveau contact d&apos;urgence</h1>
      <EmergencyContactForm locale={locale} cities={cities} />
    </div>
  );
}

import Link from "next/link";
import { adminGetEmergencyContacts } from "@/lib/admin-data";
import { deleteEmergencyContact, toggleEmergencyContactFeatured } from "@/lib/admin-actions";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";

export default async function AdminAssistancePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const contacts = await adminGetEmergencyContacts();

  return (
    <div>
      <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-2xl font-semibold text-ocean-dark">Assistance & Urgences</h1>
        <Link
          href={`/${locale}/admin/assistance/new`}
          className="rounded-full bg-ocean-dark px-4 py-2 text-sm font-semibold text-white hover:bg-ocean"
        >
          + Nouveau contact
        </Link>
      </div>
      <p className="mb-6 text-sm text-foreground/60">
        Les guides pratiques ("J&apos;ai perdu mon passeport"...) se gèrent depuis{" "}
        <Link href={`/${locale}/admin/pages`} className="text-azur hover:underline">Pages</Link> (section
        "assistance-guides").
      </p>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Catégorie</th>
              <th className="px-4 py-3">Téléphone</th>
              <th className="px-4 py-3">SOS</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {contacts.map((c) => (
              <tr key={c.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ocean-dark">{c.name.fr}</td>
                <td className="px-4 py-3 text-foreground/70">{c.category}</td>
                <td className="px-4 py-3 text-foreground/70">{c.phone || "—"}</td>
                <td className="px-4 py-3">
                  <form action={toggleEmergencyContactFeatured.bind(null, c.id, !c.featured)}>
                    <button
                      type="submit"
                      className={
                        c.featured
                          ? "rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700"
                          : "rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500"
                      }
                    >
                      {c.featured ? "★ Oui" : "Non"}
                    </button>
                  </form>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <Link href={`/${locale}/admin/assistance/${c.id}`} className="text-azur hover:underline">
                      Modifier
                    </Link>
                    <form action={deleteEmergencyContact.bind(null, c.id)}>
                      <ConfirmSubmitButton confirmText={`Supprimer "${c.name.fr}" ?`} className="text-red-600 hover:underline">
                        Supprimer
                      </ConfirmSubmitButton>
                    </form>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

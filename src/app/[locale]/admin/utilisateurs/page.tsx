import { clerkClient } from "@clerk/nextjs/server";
import { setUserBanned, deleteUser } from "@/lib/admin-actions";
import { adminGetProfessionals } from "@/lib/admin-data";
import { RoleSelectForm } from "@/components/admin/role-select-form";
import { ConfirmSubmitButton } from "@/components/admin/confirm-button";
import type { Role } from "@/lib/roles";

export default async function AdminUsersPage() {
  const client = await clerkClient();
  const [{ data: allUsers }, professionals] = await Promise.all([
    client.users.getUserList({ limit: 100 }),
    adminGetProfessionals(),
  ]);
  // Professionals (applicants and validated partners alike) are managed
  // exclusively from the "Professionnels" page, not mixed in here.
  const professionalClerkIds = new Set(professionals.map((p) => p.clerkUserId));
  const users = allUsers.filter((u) => !professionalClerkIds.has(u.id));

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Utilisateurs</h1>

      <div className="overflow-x-auto rounded-2xl border border-black/5 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/5 bg-sand/30 text-xs uppercase text-foreground/60">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Inscrit le</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id} className="border-b border-black/5 last:border-0">
                <td className="px-4 py-3 font-medium text-ocean-dark">
                  {u.firstName} {u.lastName}
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  {u.emailAddresses[0]?.emailAddress}
                </td>
                <td className="px-4 py-3 text-foreground/70">
                  {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                </td>
                <td className="px-4 py-3">
                  <RoleSelectForm clerkUserId={u.id} role={u.publicMetadata?.role as Role | undefined} />
                </td>
                <td className="px-4 py-3">
                  {u.banned ? (
                    <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">Bloqué</span>
                  ) : (
                    <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">Actif</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <form action={setUserBanned.bind(null, u.id, !u.banned)}>
                      <button type="submit" className="text-amber-700 hover:underline">
                        {u.banned ? "Débloquer" : "Bloquer"}
                      </button>
                    </form>
                    <form action={deleteUser.bind(null, u.id)}>
                      <ConfirmSubmitButton
                        confirmText={`Supprimer ${u.emailAddresses[0]?.emailAddress} ?`}
                        className="text-red-600 hover:underline"
                      >
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

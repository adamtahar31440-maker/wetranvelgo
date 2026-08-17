import { redirect } from "next/navigation";
import { safeCurrentUser as currentUser } from "@/lib/auth";
import { ADMIN_ROLES, type Role } from "@/lib/roles";
import { AdminSidebar } from "@/components/admin/sidebar";

export default async function AdminLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await currentUser();
  const role = user?.publicMetadata?.role as Role | undefined;

  if (!user) redirect(`/${locale}/sign-in`);
  if (!role || !ADMIN_ROLES.includes(role)) redirect(`/${locale}`);

  return (
    <div className="flex min-h-screen flex-col lg:flex-row">
      <AdminSidebar locale={locale} role={role} />
      <div className="min-w-0 flex-1 bg-sand/20 p-4 sm:p-6 lg:p-8">{children}</div>
    </div>
  );
}

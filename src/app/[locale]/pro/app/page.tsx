import { redirect } from "next/navigation";
import { safeCurrentUser as currentUser } from "@/lib/auth";
import { ADMIN_ROLES, type Role } from "@/lib/roles";

// Launch URL of the installed "WeTravelGo Pro" app (public/pro.webmanifest):
// one icon for both audiences, sending staff to /admin and merchants to their
// dashboard.
export default async function ProAppLaunchPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await currentUser();
  if (!user) redirect(`/${locale}/sign-in?redirect_url=/${locale}/pro/app`);

  const role = user.publicMetadata?.role as Role | undefined;
  if (role && ADMIN_ROLES.includes(role)) redirect(`/${locale}/admin`);
  redirect(`/${locale}/pro/dashboard`);
}

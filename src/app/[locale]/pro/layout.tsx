import Link from "next/link";
import { SignOutButton, UserButton } from "@clerk/nextjs";
import { LogOut } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { safeCurrentUser } from "@/lib/auth";
import { InstallAppButton } from "@/components/install-app-button";
import { proAppMetadata } from "@/lib/pro-app-metadata";

export const metadata = proAppMetadata;

export default async function ProLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await safeCurrentUser();
  const t = await getTranslations("nav");

  return (
    <div className="min-h-screen bg-sand/20">
      <header className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-4">
        <Link href={`/${locale}/pro`} className="text-sm font-semibold text-ocean-dark">
          WeTravelGo — <span className="text-terracotta">Espace Pro</span>
        </Link>
        <div className="flex items-center gap-3">
          <InstallAppButton
            label="Installer l'app"
            iosHint="Sur iPhone/iPad : dans Safari, appuyez sur Partager puis « Sur l'écran d'accueil »."
            className="relative flex flex-col items-end text-ocean-dark [&>p]:absolute [&>p]:top-full [&>p]:right-0 [&>p]:z-10 [&>p]:w-64 [&>p]:rounded-lg [&>p]:bg-white [&>p]:p-3 [&>p]:shadow-lg"
          />
          {user ? (
            <>
              {/* The avatar menu's "Sign out" is easy to miss — pros managing
                  several accounts need an obvious way to switch. */}
              <SignOutButton redirectUrl={`/${locale}`}>
                <button
                  type="button"
                  title={t("signOut")}
                  aria-label={t("signOut")}
                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-semibold text-foreground/70 hover:border-red-200 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut size={14} />
                  <span className="hidden sm:inline">{t("signOut")}</span>
                </button>
              </SignOutButton>
              <UserButton />
            </>
          ) : (
            <Link href={`/${locale}/sign-in`} className="text-sm font-medium text-ocean-dark hover:underline">
              Se connecter
            </Link>
          )}
        </div>
      </header>
      {children}
    </div>
  );
}

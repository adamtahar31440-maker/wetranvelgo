import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { safeCurrentUser } from "@/lib/auth";

export default async function ProLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const user = await safeCurrentUser();

  return (
    <div className="min-h-screen bg-sand/20">
      <header className="flex items-center justify-between border-b border-black/5 bg-white px-6 py-4">
        <Link href={`/${locale}/pro`} className="text-sm font-semibold text-ocean-dark">
          Essaouira Inside — <span className="text-terracotta">Espace Pro</span>
        </Link>
        {user ? (
          <UserButton />
        ) : (
          <Link href={`/${locale}/sign-in`} className="text-sm font-medium text-ocean-dark hover:underline">
            Se connecter
          </Link>
        )}
      </header>
      {children}
    </div>
  );
}

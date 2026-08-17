"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { can, type Role, type Permission } from "@/lib/roles";

const SECTIONS: { href: string; label: string; permission?: Permission; group?: string }[] = [
  { href: "", label: "Dashboard" },

  { href: "/villes", label: "Villes", permission: "cities", group: "Plateforme" },

  { href: "/pages", label: "Pages", permission: "articles", group: "Contenu & Navigation" },
  { href: "/sections", label: "Sections personnalisées", permission: "articles", group: "Contenu & Navigation" },
  { href: "/categories", label: "Catégories", permission: "categories", group: "Contenu & Navigation" },
  { href: "/nav", label: "Navigation", permission: "nav", group: "Contenu & Navigation" },

  { href: "/establissements", label: "Établissements", permission: "establishments", group: "Établissements" },
  { href: "/label-candidatures", label: "Candidatures Label", permission: "label", group: "Établissements" },
  { href: "/avis", label: "Avis", permission: "reviews", group: "Établissements" },
  { href: "/menu-scans", label: "Scans QR", permission: "establishments", group: "Établissements" },

  { href: "/utilisateurs", label: "Utilisateurs", permission: "users", group: "Utilisateurs & Pros" },
  { href: "/professionnels", label: "Professionnels", permission: "professionals", group: "Utilisateurs & Pros" },

  { href: "/abonnements", label: "Abonnements", permission: "subscriptions", group: "Finance" },
  { href: "/paiements", label: "Paiements & Factures", permission: "payments", group: "Finance" },
  { href: "/publicites", label: "Publicités", permission: "ads", group: "Finance" },

  { href: "/assistance", label: "Assistance & Urgences", permission: "assistance", group: "Système" },
  { href: "/newsletter", label: "Newsletter", permission: "newsletter", group: "Système" },
  { href: "/seo", label: "SEO", permission: "seo", group: "Système" },
  { href: "/modules", label: "Modules", permission: "modules", group: "Système" },
  { href: "/parametres", label: "Paramètres", permission: "settings", group: "Système" },
];

export function AdminSidebar({ locale, role }: { locale: string; role: Role }) {
  const pathname = usePathname();
  const base = `/${locale}/admin`;
  const [open, setOpen] = useState(false);
  const sections = SECTIONS.filter((s) => !s.permission || can(role, s.permission));

  const nav = (onNavigate?: () => void) => {
    let lastGroup: string | undefined;
    return (
      <nav className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {sections.map((s) => {
          const href = `${base}${s.href}`;
          const active = pathname === href;
          const showGroupHeader = s.group && s.group !== lastGroup;
          lastGroup = s.group;
          return (
            <div key={s.href}>
              {showGroupHeader && (
                <p className="mt-4 mb-1 px-3 text-xs font-semibold uppercase tracking-wide text-white/40 first:mt-1">
                  {s.group}
                </p>
              )}
              <Link
                href={href}
                onClick={onNavigate}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm font-medium transition",
                  active ? "bg-white/15 text-white" : "text-white/70 hover:bg-white/10 hover:text-white"
                )}
              >
                {s.label}
              </Link>
            </div>
          );
        })}
      </nav>
    );
  };

  return (
    <>
      {/* Mobile top bar */}
      <div className="flex items-center justify-between border-b border-black/10 bg-ocean-dark px-4 py-3 text-white lg:hidden">
        <button onClick={() => setOpen(true)} aria-label="Menu" className="p-1">
          <Menu size={22} />
        </button>
        <Link href={base}>
          <Image src="/logo-wetravelgo-on-dark.png" alt="WeTravelGo" width={160} height={53} className="h-6 w-auto" />
        </Link>
        <UserButton />
      </div>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col bg-ocean-dark text-white rtl:left-auto rtl:right-0">
            <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
              <span className="text-sm font-semibold">Menu</span>
              <button onClick={() => setOpen(false)} aria-label="Fermer" className="p-1">
                <X size={20} />
              </button>
            </div>
            {nav(() => setOpen(false))}
            <div className="border-t border-white/10 p-3 text-xs text-white/50">
              Connecté en tant que {role}
            </div>
          </aside>
        </div>
      )}

      {/* Desktop sidebar */}
      <aside className="hidden h-full w-64 shrink-0 flex-col border-r border-black/10 bg-ocean-dark text-white lg:flex">
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <Link href={base} className="text-sm font-semibold">
            Essaouira <span className="text-terracotta">Inside</span>
          </Link>
          <UserButton />
        </div>
        {nav()}
        <div className="border-t border-white/10 p-3 text-xs text-white/50">
          Connecté en tant que {role}
        </div>
      </aside>
    </>
  );
}

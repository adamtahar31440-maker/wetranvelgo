import { BedDouble, Martini, Scissors, ShoppingBag, Sparkles, Compass, UtensilsCrossed } from "lucide-react";
import type { MenuSectionKind } from "@/lib/menu-types";

const ICONS: Record<MenuSectionKind, typeof BedDouble> = {
  hotel: BedDouble,
  restaurant: UtensilsCrossed,
  bar: Martini,
  spa: Sparkles,
  coiffeur: Scissors,
  boutique: ShoppingBag,
  activites: Compass,
};

export function MenuSectionIcon({ kind, size = 16 }: { kind: MenuSectionKind; size?: number }) {
  const Icon = ICONS[kind];
  return <Icon size={size} aria-hidden />;
}

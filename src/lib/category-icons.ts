import {
  Bed,
  Utensils,
  Waves,
  ShoppingBag,
  Sparkles,
  Wrench,
  PartyPopper,
  Camera,
  TreePalm,
  Car,
  Coffee,
  Music,
  Star,
  MapPin,
  Heart,
  Briefcase,
  Ship,
  Tent,
  KeyRound,
  Bus,
  type LucideIcon,
} from "lucide-react";

export const CATEGORY_ICON_OPTIONS: { key: string; label: string; icon: LucideIcon }[] = [
  { key: "bed", label: "Lit (hébergement)", icon: Bed },
  { key: "utensils", label: "Couverts (restaurant)", icon: Utensils },
  { key: "waves", label: "Vagues (plage/activité)", icon: Waves },
  { key: "shopping-bag", label: "Sac (boutique)", icon: ShoppingBag },
  { key: "sparkles", label: "Étincelles (bien-être)", icon: Sparkles },
  { key: "wrench", label: "Clé (service)", icon: Wrench },
  { key: "party-popper", label: "Fête (événement)", icon: PartyPopper },
  { key: "camera", label: "Appareil photo", icon: Camera },
  { key: "tree-palm", label: "Palmier", icon: TreePalm },
  { key: "car", label: "Voiture (transport)", icon: Car },
  { key: "coffee", label: "Café", icon: Coffee },
  { key: "music", label: "Musique", icon: Music },
  { key: "star", label: "Étoile", icon: Star },
  { key: "map-pin", label: "Épingle de carte", icon: MapPin },
  { key: "heart", label: "Cœur", icon: Heart },
  { key: "briefcase", label: "Mallette (pro)", icon: Briefcase },
  { key: "ship", label: "Bateau", icon: Ship },
  { key: "tent", label: "Tente (camping)", icon: Tent },
  { key: "key-round", label: "Clé (location de véhicule)", icon: KeyRound },
  { key: "bus", label: "Bus (transport)", icon: Bus },
];

const DEFAULT_ICON: LucideIcon = MapPin;

export function getCategoryIcon(key?: string | null): LucideIcon {
  return CATEGORY_ICON_OPTIONS.find((o) => o.key === key)?.icon ?? DEFAULT_ICON;
}

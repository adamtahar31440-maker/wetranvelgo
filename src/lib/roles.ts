export const ROLES = [
  "super_admin",
  "admin",
  "moderator",
  "editor",
  "translator",
  "sales",
  "professional",
  "user",
] as const;

export type Role = (typeof ROLES)[number];

// Roles allowed inside /admin (each page narrows further by permission)
export const ADMIN_ROLES: Role[] = [
  "super_admin",
  "admin",
  "moderator",
  "editor",
  "translator",
  "sales",
];

export const PERMISSIONS: Record<
  | "users"
  | "professionals"
  | "establishments"
  | "articles"
  | "categories"
  | "cities"
  | "nav"
  | "reviews"
  | "comments"
  | "media"
  | "translations"
  | "seo"
  | "ads"
  | "newsletter"
  | "subscriptions"
  | "payments"
  | "modules"
  | "settings"
  | "assistance"
  | "label",
  Role[]
> = {
  users: ["admin"],
  professionals: ["admin", "sales"],
  establishments: ["admin"],
  articles: ["admin", "editor"],
  categories: ["admin"],
  // Structural/platform-level — only super_admin (unrestricted via `can()`),
  // not the regular "admin" role, since opening a city is a bigger decision
  // than day-to-day content moderation.
  cities: [],
  nav: ["admin"],
  reviews: ["admin", "moderator"],
  comments: ["admin", "moderator"],
  media: ["admin", "moderator"],
  translations: ["admin", "translator"],
  seo: ["admin"],
  ads: ["admin", "sales"],
  newsletter: ["admin"],
  subscriptions: ["admin", "sales"],
  payments: ["admin"],
  modules: [],
  settings: [],
  assistance: ["admin"],
  label: ["admin"],
};

export type Permission = keyof typeof PERMISSIONS;

// Super Admin has unrestricted access to every module (per cahier des charges).
export function can(role: Role | undefined, section: Permission) {
  if (!role) return false;
  if (role === "super_admin") return true;
  return PERMISSIONS[section]?.includes(role) ?? false;
}

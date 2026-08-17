// Top-level URL segments already used by static routes. A custom category or
// site-section slug must avoid these, otherwise its pages would be unreachable —
// Next.js resolves the matching static folder before ever falling back to the
// [category] dynamic route. Existing DB-driven categories/site-sections are
// checked for slug collisions directly against the database at creation time.
export const RESERVED_TOP_LEVEL_SLUGS = [
  "assistance",
  "recherche",
  "tarifs",
  "approved",
  "pro",
  "admin",
  "sign-in",
  "sign-up",
  "api",
];

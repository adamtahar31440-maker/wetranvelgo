import { NextResponse } from "next/server";
import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";
import createIntlMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createIntlMiddleware(routing);

const isProtectedRoute = createRouteMatcher(["/:locale/admin(.*)", "/:locale/pro/dashboard(.*)"]);

export default clerkMiddleware(async (auth, req) => {
  // API routes need Clerk's auth context (for currentUser()/auth() inside route
  // handlers) but must never go through next-intl's locale rewriting/redirects,
  // and must never be evaluated against the page-oriented isProtectedRoute
  // matcher below — "/api/admin/..." otherwise matches "/:locale/admin(.*)"
  // with "api" mistaken for the locale segment.
  if (req.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }
  // The QR-scanned digital menu page is a standalone, non-locale-prefixed route
  // (src/app/menu/[slug]) on purpose — a printed QR code can't adapt its target
  // URL per scanner, so the page itself detects/switches language client-side
  // instead. It must bypass next-intl's locale redirect just like /api does,
  // or every request would get 308-redirected to a "/fr/menu/..." URL that no
  // route handles.
  if (req.nextUrl.pathname.startsWith("/menu/")) {
    return NextResponse.next();
  }
  if (isProtectedRoute(req)) {
    await auth.protect();
  }
  return intlMiddleware(req);
});

export const config = {
  matcher: ["/((?!_next|_vercel|.*\\..*).*)", "/(api|trpc)(.*)"],
};

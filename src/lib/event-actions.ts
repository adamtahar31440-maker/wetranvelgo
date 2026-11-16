"use server";

import { safeCurrentUser as currentUser } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { waitUntil } from "@vercel/functions";
import { eq } from "drizzle-orm";
import { getDb } from "@/db";
import { events, establishments } from "@/db/schema";
import { getProfessionalByClerkId } from "@/lib/admin-data";
import { getEventById } from "@/lib/events";
import { can, type Role } from "@/lib/roles";
import { ALL_LOCALES } from "@/lib/localized-form";
import { translateFields } from "@/lib/translate";
import { slugify } from "@/lib/slug";
import { truncate } from "@/lib/truncate";

// Only a pro the WeTravelGo team has validated can publish events — unlike
// the fiche itself, which pending pros can already set up.
async function requireValidatedProfessional() {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");
  const professional = await getProfessionalByClerkId(user.id);
  if (!professional || professional.status !== "validated") throw new Error("Forbidden");
  return professional;
}

async function requireEventsRole() {
  const user = await currentUser();
  const role = user?.publicMetadata?.role as Role | undefined;
  if (!can(role, "events")) throw new Error("Forbidden");
}

function optional(formData: FormData, field: string, max: number) {
  const value = String(formData.get(field) ?? "").trim();
  return value ? truncate(value, max) : null;
}

// Rendered as a link on the public page — only real web links, never
// "javascript:" & co.
function httpUrl(value: string | null) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? value : null;
  } catch {
    return null;
  }
}

// Covers go through next/image, which throws on hosts outside
// next.config's remotePatterns — accept only our own Blob uploads.
function uploadedImageUrl(value: string | null) {
  const url = httpUrl(value);
  return url && new URL(url).hostname.endsWith(".public.blob.vercel-storage.com") ? url : null;
}

// Creates or updates (when "id" is set) one of the signed-in pro's events.
// Content is written in French and saved immediately; the other locales are
// filled in the background like the establishment fiche. Any edit sends the
// event back to "pending" so the team re-checks what actually goes public.
export async function saveOwnEvent(formData: FormData) {
  const professional = await requireValidatedProfessional();
  const db = getDb();
  const locale = String(formData.get("locale") ?? "fr");

  const id = Number(formData.get("id")) || null;
  const existing = id ? await getEventById(id) : null;
  if (id && (!existing || existing.professionalId !== professional.id)) throw new Error("Forbidden");

  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "");
  const endsAt = String(formData.get("endsAt") ?? "") || null;
  if (!title || !startsAt) throw new Error("Missing required fields");
  if (endsAt && endsAt < startsAt) throw new Error("La date de fin doit être après la date de début.");

  // The event is either tied to one of the pro's own businesses or to none
  // ("Autre") — never to someone else's.
  const establishmentId = Number(formData.get("establishmentId")) || null;
  let cityId = professional.cityId;
  if (establishmentId) {
    const [est] = await db.select().from(establishments).where(eq(establishments.id, establishmentId));
    if (!est || est.professionalId !== professional.id) throw new Error("Forbidden");
    cityId = est.cityId;
  }

  const priceType = String(formData.get("priceType") ?? "unspecified");
  const priceRaw = Number(formData.get("priceMad"));
  const priceMad = priceType === "paid" && Number.isFinite(priceRaw) && priceRaw >= 0 ? Math.round(priceRaw) : null;

  const values = {
    cityId,
    establishmentId,
    startsAt,
    endsAt,
    location: optional(formData, "location", 255),
    isFree: priceType === "free",
    priceMad,
    coverImage: uploadedImageUrl(optional(formData, "coverImage", 255)),
    bookingUrl: httpUrl(optional(formData, "bookingUrl", 255)),
    phone: optional(formData, "phone", 64),
    status: "pending",
    rejectionReason: null,
    updatedAt: new Date(),
  };

  const titleChanged = !existing || existing.title.fr !== title;
  const descriptionChanged = !existing || existing.description.fr !== description;
  const localizedTitle = titleChanged ? { fr: title } : existing!.title;
  const localizedDescription = descriptionChanged ? { fr: description } : existing!.description;

  let eventId: number;
  if (existing) {
    await db
      .update(events)
      .set({ ...values, title: localizedTitle, description: localizedDescription })
      .where(eq(events.id, existing.id));
    eventId = existing.id;
  } else {
    const [created] = await db
      .insert(events)
      .values({
        ...values,
        professionalId: professional.id,
        slug: truncate(`${slugify(title)}-${Date.now().toString(36)}`, 160),
        title: localizedTitle,
        description: localizedDescription,
      })
      .returning();
    eventId = created.id;
  }

  const translationFields: Record<string, string> = {};
  if (titleChanged) translationFields.title = title;
  if (descriptionChanged && description) translationFields.description = description;
  if (Object.keys(translationFields).length > 0) {
    waitUntil(
      (async () => {
        const translated = await translateFields(translationFields, ALL_LOCALES, "fr");
        await db
          .update(events)
          .set({
            ...(titleChanged ? { title: { ...translated.title, fr: title } } : {}),
            ...(descriptionChanged && description ? { description: { ...translated.description, fr: description } } : {}),
          })
          .where(eq(events.id, eventId));
      })()
    );
  }

  revalidatePath("/", "layout");
  redirect(`/${locale}/pro/dashboard/evenements?saved=1`);
}

export async function deleteOwnEvent(id: number) {
  const professional = await requireValidatedProfessional();
  const existing = await getEventById(id);
  if (!existing || existing.professionalId !== professional.id) throw new Error("Forbidden");
  await getDb().delete(events).where(eq(events.id, id));
  revalidatePath("/", "layout");
}

// ---- Admin moderation ----
export async function setEventStatus(id: number, status: "approved" | "rejected", formData?: FormData) {
  await requireEventsRole();
  const reason = status === "rejected" ? String(formData?.get("reason") ?? "").trim() || null : null;
  await getDb().update(events).set({ status, rejectionReason: reason }).where(eq(events.id, id));
  revalidatePath("/", "layout");
}

export async function adminDeleteEvent(id: number) {
  await requireEventsRole();
  await getDb().delete(events).where(eq(events.id, id));
  revalidatePath("/", "layout");
}

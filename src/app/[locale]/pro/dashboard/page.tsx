import Link from "next/link";
import { safeCurrentUser } from "@/lib/auth";
import { getTranslations, setRequestLocale } from "next-intl/server";
import {
  getProfessionalByClerkId,
  getSubscriptionByProfessionalId,
  getInvoicesByProfessionalId,
  adminGetEstablishments,
  getSubscriptionPlans,
  getAllCategories,
  adminGetSubcategories,
} from "@/lib/admin-data";
import { applyAsProfessional, updateOwnEstablishment } from "@/lib/pro-actions";
import { getActiveCities } from "@/lib/data";
import { MenuEditor } from "@/components/menu-editor";
import { SingleImageField } from "@/components/single-image-field";
import { SubmitButton } from "@/components/submit-button";
import { ProApplicationForm } from "@/components/pro-application-form";
import { DashboardLangSwitcher } from "@/components/dashboard-lang-switcher";
import { ImageUploader } from "@/components/image-uploader";
import { HoursEditor } from "@/components/hours-editor";
import { SubcategoryMultiSelect } from "@/components/subcategory-multi-select";
import { qrFeatureLabel } from "@/lib/qr-feature-label";
import { ActivityTagsPicker } from "@/components/activity-tags-picker";
import { UpdateSuccessBanner } from "@/components/update-success-banner";
import { PRICE_LEVELS, priceLevelLabel, buildSubcategoryMap, subcategoryLabel, flattenSubcategories } from "@/lib/labels";
import { AiDescriptionField } from "@/components/ai-description-field";
import { AddressLocationPicker } from "@/components/address-location-picker";

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export default async function ProDashboardPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ updated?: string }>;
}) {
  const { locale } = await params;
  const { updated } = await searchParams;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");
  const user = await safeCurrentUser();
  const professional = user ? await getProfessionalByClerkId(user.id) : null;

  if (!professional) {
    const [categories, cities] = await Promise.all([getAllCategories(), getActiveCities()]);
    const subcategoriesByCategory = Object.fromEntries(
      await Promise.all(categories.map(async (c) => [c.id, await adminGetSubcategories(c.id)]))
    );
    return (
      <ProApplicationForm
        action={applyAsProfessional}
        categories={categories}
        subcategoriesByCategory={subcategoriesByCategory}
        cities={cities}
        defaultLocale={locale}
      />
    );
  }

  const langSwitcher = <DashboardLangSwitcher locale={locale} label={t("language")} />;

  // Pending pros get full dashboard access right away — they can set up their
  // fiche/menu while waiting on review instead of being blocked until an admin
  // gets to it — but the listing itself only goes public once validated (see
  // setProfessionalStatus in admin-actions.ts, which flips the establishment
  // to "active"). Only a negative outcome (refused/suspended) blocks the
  // dashboard entirely.
  if (professional.status === "refused" || professional.status === "suspended") {
    return (
      <div className="space-y-4">
        <div className="flex justify-end">{langSwitcher}</div>
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <p className="font-semibold text-red-800">
            {professional.status === "refused" ? t("refusedTitle") : t("suspendedTitle")}
          </p>
          <p className="mt-1 text-sm text-red-700">{t("refusedSuspendedBody")}</p>
        </div>
      </div>
    );
  }

  const [subscription, invoices, allEstablishments, plans, categories] = await Promise.all([
    getSubscriptionByProfessionalId(professional.id),
    getInvoicesByProfessionalId(professional.id),
    adminGetEstablishments(),
    getSubscriptionPlans(),
    getAllCategories(),
  ]);
  const myEstablishment = allEstablishments.find((e) => e.professionalId === professional.id);
  const myEstablishmentCategoryType = myEstablishment
    ? categories.find((c) => c.id === myEstablishment.categoryId)?.type
    : undefined;
  const isCarRental = myEstablishmentCategoryType === "location-vehicules";
  const isRealEstate = myEstablishmentCategoryType === "agences-immobilieres";
  const hasMultiSubcategory = isCarRental || isRealEstate;
  const currentPlanKey = subscription?.status === "active" ? subscription.planKey : "starter";
  const maxPhotos = plans.find((p) => p.key === currentPlanKey)?.maxPhotos ?? null;
  const subcategoriesByCategory = Object.fromEntries(
    await Promise.all(categories.map(async (c) => [c.id, await adminGetSubcategories(c.id)]))
  );
  const myEstablishmentSubcategories = myEstablishment ? subcategoriesByCategory[myEstablishment.categoryId] ?? [] : [];
  const subcategoryMap = buildSubcategoryMap(myEstablishmentSubcategories);
  const activityOptions = flattenSubcategories(categories, subcategoriesByCategory);

  return (
    <div className="space-y-10">
      {updated === "1" && <UpdateSuccessBanner message={t("updateSuccess")} />}

      {professional.status === "pending" && (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <p className="text-sm font-medium text-amber-800">{t("pendingBannerText")}</p>
        </div>
      )}

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-ocean-dark">{t("greeting", { name: professional.companyName })}</h1>
          <p className="text-sm text-foreground/60">{t("tagline")}</p>
        </div>
        {langSwitcher}
      </div>

      {myEstablishment ? (
        <form action={updateOwnEstablishment} className="space-y-10">
          <input type="hidden" name="id" value={myEstablishment.id} />
          <input type="hidden" name="locale" value={locale} />

          <section className="rounded-2xl border border-black/5 bg-white p-6">
            <h2 className="mb-3 text-sm font-semibold text-ocean-dark">{t("establishmentTitle")}</h2>

            {myEstablishment.status !== "active" && (
              <p className="rounded-lg bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                {t("establishmentStatusNote", {
                  status: myEstablishment.status === "pending" ? t("statusPending") : t("statusDisabled"),
                })}
              </p>
            )}

            <p className="rounded-lg bg-ocean-dark/5 px-3 py-2 text-xs text-foreground/60">{t("editHint")}</p>

            <div>
              <label className={labelClass}>{t("fieldName")}</label>
              <input name="name" defaultValue={myEstablishment.name.fr} className={inputClass} required />
            </div>
            <AiDescriptionField
              label={t("fieldDescription")}
              defaultValue={myEstablishment.description.fr}
              locale={locale}
              businessName={myEstablishment.name.fr}
              category={subcategoryLabel(subcategoryMap, myEstablishment.subcategory, locale)}
              generateLabel={t("generateDescriptionButton")}
              generatePendingLabel={t("generateDescriptionButtonPending")}
              emptyErrorText={t("generateDescriptionEmptyError")}
              errorText={t("generateDescriptionError")}
              placeholder={t("generateDescriptionPlaceholder")}
              labelClassName={labelClass}
              inputClassName={inputClass}
            />
            <div>
              <label className={labelClass}>{t("fieldHours")}</label>
              <HoursEditor
                name="hours"
                defaultValue={myEstablishment.hours?.fr ?? ""}
                dayLabels={[
                  t("dayMon"),
                  t("dayTue"),
                  t("dayWed"),
                  t("dayThu"),
                  t("dayFri"),
                  t("daySat"),
                  t("daySun"),
                ]}
                copyLabel={t("hoursCopyPrevious")}
                closedLabel={t("hoursClosed")}
                openLabel={t("hoursOpenDay")}
                addRangeLabel={t("hoursAddRange")}
              />
            </div>

            <div>
              <label className={labelClass}>{t("fieldVacation")}</label>
              <p className="mb-2 text-xs text-foreground/50">{t("vacationHint")}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>{t("vacationStart")}</label>
                  <input
                    type="date"
                    name="vacationStart"
                    defaultValue={myEstablishment.vacationStart ?? ""}
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("vacationEnd")}</label>
                  <input
                    type="date"
                    name="vacationEnd"
                    defaultValue={myEstablishment.vacationEnd ?? ""}
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>{t("fieldAddress")}</label>
              <AddressLocationPicker
                className={inputClass}
                defaultAddress={myEstablishment.address ?? ""}
                defaultLat={myEstablishment.lat}
                defaultLng={myEstablishment.lng}
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className={labelClass}>{t("fieldPhone")}</label>
                <input name="phone" defaultValue={myEstablishment.phone ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("fieldWhatsapp")}</label>
                <input name="whatsapp" defaultValue={myEstablishment.whatsapp ?? ""} className={inputClass} />
              </div>
              <div>
                <label className={labelClass}>{t("fieldWebsite")}</label>
                <input name="website" defaultValue={myEstablishment.website ?? ""} className={inputClass} />
              </div>
            </div>

            <div>
              <label className={labelClass}>{t("fieldSocialReviews")}</label>
              <p className="mb-2 text-xs text-foreground/50">{t("socialReviewsHint")}</p>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className={labelClass}>Instagram</label>
                  <input
                    name="instagram"
                    defaultValue={myEstablishment.instagram ?? ""}
                    placeholder="https://instagram.com/..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>Facebook</label>
                  <input
                    name="facebook"
                    defaultValue={myEstablishment.facebook ?? ""}
                    placeholder="https://facebook.com/..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("googleReviewsLabel")}</label>
                  <input
                    name="googleReviewsUrl"
                    defaultValue={myEstablishment.googleReviewsUrl ?? ""}
                    placeholder="https://g.page/r/..."
                    className={inputClass}
                  />
                </div>
                <div>
                  <label className={labelClass}>{t("tripadvisorLabel")}</label>
                  <input
                    name="tripadvisorUrl"
                    defaultValue={myEstablishment.tripadvisorUrl ?? ""}
                    placeholder="https://tripadvisor.com/..."
                    className={inputClass}
                  />
                </div>
              </div>
            </div>

            <div>
              <label className={labelClass}>{t("fieldPriceLevel")}</label>
              <select name="priceLevel" defaultValue={myEstablishment.priceLevel ?? "€€"} className={inputClass}>
                {PRICE_LEVELS.map((level) => (
                  <option key={level} value={level}>
                    {priceLevelLabel(level)}
                  </option>
                ))}
              </select>
            </div>
            {hasMultiSubcategory && (
              <div className="space-y-4 rounded-xl border border-ocean-dark/20 bg-ocean-dark/5 p-4">
                <SubcategoryMultiSelect
                  options={myEstablishmentSubcategories}
                  locale={locale}
                  defaultValues={myEstablishment.subcategories ?? []}
                  label={isCarRental ? t("fieldVehicleTypes") : t("fieldPropertyTypes")}
                />
                {isCarRental && (
                  <div>
                    <label className={labelClass}>{t("fieldAvgDailyPrice")}</label>
                    <input
                      type="number"
                      name="avgDailyPriceMad"
                      min={0}
                      step={1}
                      defaultValue={myEstablishment.avgDailyPriceMad ?? ""}
                      className={inputClass}
                    />
                    <p className="mt-1 text-xs text-foreground/50">{t("avgDailyPriceHint")}</p>
                  </div>
                )}
              </div>
            )}
            {/* Every business now uses the dedicated digital catalog/QR section
                below instead — but keep passing the existing products through
                unchanged so saving this form doesn't wipe out any legacy data
                still sitting in that column for this establishment. */}
            <input type="hidden" name="products" value={JSON.stringify(myEstablishment.products ?? [])} />

            <div>
              <label className={labelClass}>{t("fieldOtherActivities")}</label>
              <p className="mb-2 text-xs text-foreground/50">{t("otherActivitiesHint")}</p>
              <ActivityTagsPicker
                options={activityOptions}
                locale="fr"
                defaultValues={myEstablishment.services?.fr ?? []}
                otherLabel={t("otherOptionLabel")}
                otherPlaceholder={t("otherActivitySpecifyPlaceholder")}
              />
            </div>

            <div>
              <label className={labelClass}>{t("fieldAmenities")}</label>
              <div className="flex flex-wrap gap-x-6 gap-y-2">
                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <input type="checkbox" name="wifi" defaultChecked={!!myEstablishment.wifi} /> {t("amenityWifi")}
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <input type="checkbox" name="parking" defaultChecked={!!myEstablishment.parking} /> {t("amenityParking")}
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <input type="checkbox" name="pool" defaultChecked={!!myEstablishment.pool} /> {t("amenityPool")}
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <input type="checkbox" name="airConditioning" defaultChecked={!!myEstablishment.airConditioning} />{" "}
                  {t("amenityAirConditioning")}
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <input type="checkbox" name="accessibility" defaultChecked={!!myEstablishment.accessibility} />{" "}
                  {t("amenityAccessibility")}
                </label>
                <label className="flex items-center gap-2 text-sm text-foreground/80">
                  <input type="checkbox" name="petsAllowed" defaultChecked={!!myEstablishment.petsAllowed} />{" "}
                  {t("amenityPetsAllowed")}
                </label>
              </div>
            </div>

            <ImageUploader
              label={t("fieldImages")}
              defaultImages={myEstablishment.images ?? []}
              max={maxPhotos}
              limitReachedText={typeof maxPhotos === "number" ? t("imagesLimitReached", { max: maxPhotos }) : undefined}
              unsupportedFormatText={t("imagesUnsupportedFormat")}
            />
          </section>

          <section className="rounded-2xl border border-black/5 bg-white p-6">
            <h2 className="mb-1 text-sm font-semibold text-ocean-dark">
              {qrFeatureLabel(myEstablishmentCategoryType, locale)}
            </h2>
            <p className="mb-4 text-sm text-foreground/60">{t("menuIntro")}</p>

              {myEstablishment.menuTranslationEnabled ? (
                <>
                  <div className="space-y-4">
                    <p className="rounded-lg bg-ocean-dark/5 px-3 py-2 text-xs text-foreground/60">{t("menuHint")}</p>

                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
                      <SingleImageField
                        name="menuPhoto"
                        label={t("menuPhotoLabel")}
                        defaultValue={myEstablishment.menuPhoto}
                        shape="square"
                        unsupportedFormatText={t("imagesUnsupportedFormat")}
                      />
                      <SingleImageField
                        name="menuBanner"
                        label={t("menuBannerLabel")}
                        defaultValue={myEstablishment.menuBanner}
                        shape="banner"
                        unsupportedFormatText={t("imagesUnsupportedFormat")}
                      />
                    </div>

                    <MenuEditor
                      name="menuItems"
                      defaultItems={(myEstablishment.digitalMenu ?? []).map((it) => ({
                        name: it.name.fr,
                        description: it.description?.fr ?? null,
                        category: it.category?.fr ?? null,
                        price: it.price,
                        variants: (it.variants ?? []).map((v) => ({ label: v.label.fr, price: v.price })),
                        photo: it.photo ?? null,
                      }))}
                      namePlaceholder={t("menuItemNamePlaceholder")}
                      descriptionPlaceholder={t("menuItemDescriptionPlaceholder")}
                      categoryNamePlaceholder={t("menuItemCategoryPlaceholder")}
                      pricePlaceholder={t("menuItemPricePlaceholder")}
                      variantLabelPlaceholder={t("menuVariantLabelPlaceholder")}
                      addItemLabel={t("menuAddItem")}
                      addVariantLabel={t("menuAddVariant")}
                      addCategoryLabel={t("menuAddCategory")}
                      newCategoryDefaultName={t("menuNewCategoryDefault")}
                      uncategorizedLabel={t("menuUncategorized")}
                      orderLabel={t("menuCategoryOrderLabel")}
                      collapseAllLabel={t("menuCollapseAll")}
                      expandAllLabel={t("menuExpandAll")}
                      singlePriceLabel={t("menuSinglePriceLabel")}
                      variantPriceLabel={t("menuVariantPriceLabel")}
                      scanLabel={t("menuScanDocument")}
                      scanningLabel={t("menuScanning")}
                      scanHint={t("menuScanHint")}
                      scanErrorText={t("menuScanError")}
                      scanUnsupportedFormatText={t("imagesUnsupportedFormat")}
                      scanSuccessTemplate={t.raw("menuScanSuccess")}
                    />
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-black/5 pt-5">
                    {(myEstablishment.digitalMenu?.length ?? 0) > 0 ? (
                      <>
                        <a
                          href={`/api/menu/qr/${myEstablishment.slug}`}
                          download
                          className="rounded-full bg-ocean-dark px-4 py-2 text-xs font-semibold text-white hover:bg-ocean"
                        >
                          {t("menuDownloadQr")}
                        </a>
                        <a
                          href={`/api/menu/poster/${myEstablishment.slug}`}
                          download
                          className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-foreground/70 hover:bg-black/5"
                        >
                          {t("menuDownloadPoster")}
                        </a>
                        <Link
                          href={`/menu/${myEstablishment.slug}`}
                          target="_blank"
                          className="rounded-full border border-black/10 px-4 py-2 text-xs font-semibold text-foreground/70 hover:bg-black/5"
                        >
                          {t("menuPreview")}
                        </Link>
                      </>
                    ) : (
                      <p className="text-xs text-foreground/50">{t("menuEmptyState")}</p>
                    )}
                  </div>
                  {(myEstablishment.digitalMenu?.length ?? 0) > 0 && (
                    <p className="mt-2 text-xs text-foreground/50">{t("menuQrHint")}</p>
                  )}
                </>
              ) : (
                <p className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
                  {t("menuDisabledBody")}
                </p>
              )}
          </section>

          <div>
            <SubmitButton label={t("save")} pendingLabel={t("savePending")} requireChangesToEnable />
          </div>
        </form>
      ) : (
        <section className="rounded-2xl border border-black/5 bg-white p-6">
          <h2 className="mb-3 text-sm font-semibold text-ocean-dark">{t("establishmentTitle")}</h2>
          <p className="text-sm text-foreground/60">{t("noEstablishment")}</p>
        </section>
      )}

      <section className="rounded-2xl border border-black/5 bg-white p-6">
        <h2 className="mb-3 text-sm font-semibold text-ocean-dark">{t("invoicesTitle")}</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-foreground/60">{t("noInvoices")}</p>
        ) : (
          <ul className="space-y-1 text-sm text-foreground/70">
            {invoices.map((inv) => (
              <li key={inv.id}>
                {inv.amountMad} MAD — {inv.status} —{" "}
                {inv.issuedAt ? new Date(inv.issuedAt).toLocaleDateString(locale) : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

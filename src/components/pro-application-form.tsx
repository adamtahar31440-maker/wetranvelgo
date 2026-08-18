"use client";

import { useRef, useState } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { ALL_LOCALES, LOCALE_LABELS } from "@/lib/localized-form";
import { PRO_FORM_STRINGS } from "@/lib/pro-form-i18n";
import { PRICE_LEVELS, priceLevelLabel } from "@/lib/labels";
import { AddressLocationPicker } from "@/components/address-location-picker";
import { CategorySubcategoryPicker } from "@/components/category-subcategory-picker";
import { SubcategoryMultiSelect } from "@/components/subcategory-multi-select";
import { qrFeatureLabel } from "@/lib/qr-feature-label";
import { hasMultiSubcategory } from "@/lib/multi-subcategory";
import { HoursEditor } from "@/components/hours-editor";
import { MenuEditor } from "@/components/menu-editor";
import { SingleImageField } from "@/components/single-image-field";
import { ImageUploader } from "@/components/image-uploader";
import { PhoneField } from "@/components/phone-field";
import { SubmitButton } from "@/components/submit-button";

const RTL_LOCALES = ["ar", "he"];

const inputClass = "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

// Simple nearest-center match — cities are far enough apart in practice that
// this is a good enough default; the pro can always correct it from the dropdown.
function nearestCity<T extends { id: number; lat: number | null; lng: number | null }>(
  cities: T[],
  lat: number,
  lng: number
): T | null {
  let best: T | null = null;
  let bestDist = Infinity;
  for (const city of cities) {
    if (city.lat == null || city.lng == null) continue;
    const dist = (city.lat - lat) ** 2 + (city.lng - lng) ** 2;
    if (dist < bestDist) {
      bestDist = dist;
      best = city;
    }
  }
  return best;
}

export function ProApplicationForm({
  action,
  categories,
  subcategoriesByCategory,
  cities,
  defaultLocale,
  extraHiddenFields = [],
}: {
  action: (formData: FormData) => void;
  categories: { id: number; type: string; name: Record<string, string> }[];
  subcategoriesByCategory: Record<number, { slug: string; name: Record<string, string> }[]>;
  cities: { id: number; slug: string; name: Record<string, string>; lat: number | null; lng: number | null }[];
  defaultLocale: string;
  // Lets a parent (e.g. the pro dashboard's "add another business" flow) mark
  // this submission for applyAsProfessional without the component needing to
  // know anything about that use case.
  extraHiddenFields?: { name: string; value: string }[];
}) {
  const [lang, setLang] = useState(ALL_LOCALES.includes(defaultLocale) ? defaultLocale : "fr");
  const t = PRO_FORM_STRINGS[lang] ?? PRO_FORM_STRINGS.fr;
  const dir = RTL_LOCALES.includes(lang) ? "rtl" : "ltr";
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const categoryType = categories.find((c) => c.id === categoryId)?.type;
  const isCarRental = categoryType === "location-vehicules";
  const isRealEstate = categoryType === "agences-immobilieres";
  const isActivity = categoryType === "activite";
  const isRestaurant = categoryType === "restaurant";
  const isShopping = categoryType === "shopping";
  const showMultiSubcategory = hasMultiSubcategory(categoryType);
  const multiSubcategoryLabel = isCarRental
    ? t.fieldVehicleTypes
    : isRealEstate
      ? t.fieldPropertyTypes
      : isActivity
        ? t.fieldActivityTypes
        : isRestaurant
          ? t.fieldCuisineTypes
          : isShopping
            ? t.fieldProductTypes
            : t.fieldOnsiteServices;

  const [cityId, setCityId] = useState<number | null>(cities[0]?.id ?? null);
  const handleLocationChange = (lat: number, lng: number) => {
    const match = nearestCity(cities, lat, lng);
    if (match) setCityId(match.id);
  };

  const nameRef = useRef<HTMLInputElement>(null);
  const categorySelectRef = useRef<HTMLSelectElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  const [generatingDescription, setGeneratingDescription] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  async function handleGenerateDescription() {
    const keywords = descriptionRef.current?.value.trim() ?? "";
    if (!keywords) {
      setGenerateError(t.generateDescriptionEmptyError);
      return;
    }
    setGeneratingDescription(true);
    setGenerateError(null);
    try {
      const res = await fetch("/api/pro/generate-description", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          keywords,
          locale: lang,
          name: nameRef.current?.value || undefined,
          category: categorySelectRef.current?.selectedOptions[0]?.text || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.description) throw new Error(data.error ?? "Generation failed");
      if (descriptionRef.current) descriptionRef.current.value = data.description;
    } catch (err) {
      console.error("AI description generation failed:", err);
      setGenerateError(t.generateDescriptionError);
    } finally {
      setGeneratingDescription(false);
    }
  }

  return (
    <div>
      <h1 className="mb-2 text-2xl font-semibold text-ocean-dark">{t.heading}</h1>
      <p className="mb-6 text-sm text-foreground/60">{t.intro}</p>
      <form
        action={action}
        dir={dir}
        className="max-w-2xl space-y-6 rounded-2xl border border-black/5 bg-white p-6"
      >
        {extraHiddenFields.map((f) => (
          <input key={f.name} type="hidden" name={f.name} value={f.value} />
        ))}

        <div className="rounded-xl border border-ocean-dark/20 bg-ocean-dark/5 p-4">
          <label className={labelClass}>{t.langLabel}</label>
          <select
            name="sourceLocale"
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            className={inputClass}
          >
            {ALL_LOCALES.map((l) => (
              <option key={l} value={l}>
                {LOCALE_LABELS[l]}
              </option>
            ))}
          </select>
          <p className="mt-2 text-xs text-foreground/60">{t.langHint}</p>
        </div>

        <div>
          <label className={labelClass}>{t.contactName}</label>
          <input name="contactName" className={inputClass} required />
        </div>

        <CategorySubcategoryPicker
          categories={categories}
          subcategoriesByCategory={subcategoriesByCategory}
          locale={lang}
          categoryRef={categorySelectRef}
          categoryLabel={t.category}
          subcategoryLabel={t.subcategory}
          otherLabel={t.otherOptionLabel}
          otherPlaceholder={t.otherActivitySpecifyPlaceholder}
          onCategoryChange={setCategoryId}
          hideSubcategory={showMultiSubcategory}
        />

        {showMultiSubcategory && (
          <div className="space-y-4 rounded-xl border border-ocean-dark/20 bg-ocean-dark/5 p-4">
            <SubcategoryMultiSelect
              options={subcategoriesByCategory[categoryId ?? -1] ?? []}
              locale={lang}
              label={multiSubcategoryLabel}
              otherLabel={t.otherOptionLabel}
              otherPlaceholder={t.otherActivitySpecifyPlaceholder}
            />
            {isCarRental && (
              <div>
                <label className={labelClass}>{t.fieldAvgDailyPrice}</label>
                <input type="number" name="avgDailyPriceMad" min={0} step={1} className={inputClass} />
                <p className="mt-1 text-xs text-foreground/50">{t.avgDailyPriceHint}</p>
              </div>
            )}
          </div>
        )}

        <div>
          <label className={labelClass}>{t.name}</label>
          <input name="name" ref={nameRef} className={inputClass} required dir={dir} />
        </div>
        <div>
          <div className="mb-1 flex items-center justify-between gap-2">
            <label className={labelClass}>{t.description}</label>
            <button
              type="button"
              onClick={handleGenerateDescription}
              disabled={generatingDescription}
              className="flex shrink-0 items-center gap-1 rounded-full bg-ocean-dark/10 px-3 py-1 text-xs font-semibold text-ocean-dark hover:bg-ocean-dark/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generatingDescription ? (
                <Loader2 size={12} className="animate-spin" />
              ) : (
                <Sparkles size={12} />
              )}
              {generatingDescription ? t.generateDescriptionButtonPending : t.generateDescriptionButton}
            </button>
          </div>
          <textarea
            name="description"
            ref={descriptionRef}
            rows={4}
            placeholder={t.generateDescriptionPlaceholder}
            className={inputClass}
            dir={dir}
          />
          {generateError && <p className="mt-1 text-xs font-medium text-red-600">{generateError}</p>}
        </div>

        <div>
          <label className={labelClass}>{t.fieldHours}</label>
          <HoursEditor
            name="hours"
            dayLabels={[t.dayMon, t.dayTue, t.dayWed, t.dayThu, t.dayFri, t.daySat, t.daySun]}
            closedLabel={t.hoursClosed}
            openLabel={t.hoursOpenDay}
            addRangeLabel={t.hoursAddRange}
            copyLabel={t.hoursCopyPrevious}
          />
        </div>

        <div>
          <label className={labelClass}>{t.fieldVacation}</label>
          <p className="mb-2 text-xs text-foreground/50">{t.vacationHint}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>{t.vacationStart}</label>
              <input type="date" name="vacationStart" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t.vacationEnd}</label>
              <input type="date" name="vacationEnd" className={inputClass} />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>{t.city}</label>
          <select
            name="cityId"
            value={cityId ?? ""}
            onChange={(e) => setCityId(Number(e.target.value))}
            className={inputClass}
            required
          >
            {cities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name[lang] ?? c.name.fr ?? c.slug}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>{t.address}</label>
          <AddressLocationPicker className={inputClass} dir={dir} onLocationChange={handleLocationChange} />
          <p className="mt-1 text-xs text-foreground/50">{t.addressHint}</p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>{t.phone}</label>
            <PhoneField name="phone" dir={dir} />
          </div>
          <div>
            <label className={labelClass}>{t.whatsapp}</label>
            <PhoneField name="whatsapp" dir={dir} />
          </div>
          <div>
            <label className={labelClass}>{t.website}</label>
            <input name="website" className={inputClass} />
          </div>
        </div>

        <div>
          <label className={labelClass}>{t.fieldSocialReviews}</label>
          <p className="mb-2 text-xs text-foreground/50">{t.socialReviewsHint}</p>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>Instagram</label>
              <input name="instagram" placeholder="https://instagram.com/..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Facebook</label>
              <input name="facebook" placeholder="https://facebook.com/..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t.googleReviewsLabel}</label>
              <input name="googleReviewsUrl" placeholder="https://g.page/r/..." className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>{t.tripadvisorLabel}</label>
              <input name="tripadvisorUrl" placeholder="https://tripadvisor.com/..." className={inputClass} />
            </div>
          </div>
        </div>

        <div>
          <label className={labelClass}>{t.priceLevel}</label>
          <select name="priceLevel" defaultValue="€€" className={inputClass}>
            {PRICE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {priceLevelLabel(level)}
              </option>
            ))}
          </select>
          <p className="mt-1 text-xs text-foreground/50">{t.priceLevelHint}</p>
        </div>

        {/* Every business gets the same digital catalog + QR code feature — only
            the section title changes (menu, room rates, catalog...) per category. */}
        <div className="rounded-xl border border-ocean-dark/20 bg-ocean-dark/5 p-4">
          <label className={labelClass}>{qrFeatureLabel(categoryType, lang)}</label>
          <p className="mb-3 text-xs text-foreground/50">{t.menuIntro}</p>

          <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
            <SingleImageField
              name="menuPhoto"
              label={t.menuPhotoLabel}
              shape="square"
              unsupportedFormatText={t.imagesUnsupportedFormat}
            />
            <SingleImageField
              name="menuBanner"
              label={t.menuBannerLabel}
              shape="banner"
              unsupportedFormatText={t.imagesUnsupportedFormat}
            />
          </div>

          <p className="mb-2 rounded-lg bg-white px-3 py-2 text-xs text-foreground/60">{t.menuHint}</p>
          <MenuEditor
            name="menuItems"
            namePlaceholder={t.menuItemNamePlaceholder}
            descriptionPlaceholder={t.menuItemDescriptionPlaceholder}
            categoryNamePlaceholder={t.menuItemCategoryPlaceholder}
            pricePlaceholder={t.menuItemPricePlaceholder}
            variantLabelPlaceholder={t.menuVariantLabelPlaceholder}
            addItemLabel={t.menuAddItem}
            addVariantLabel={t.menuAddVariant}
            addCategoryLabel={t.menuAddCategory}
            newCategoryDefaultName={t.menuNewCategoryDefault}
            uncategorizedLabel={t.menuUncategorized}
            orderLabel={t.menuCategoryOrderLabel}
            collapseAllLabel={t.menuCollapseAll}
            expandAllLabel={t.menuExpandAll}
            singlePriceLabel={t.menuSinglePriceLabel}
            variantPriceLabel={t.menuVariantPriceLabel}
            scanLabel={t.menuScanDocument}
            scanningLabel={t.menuScanning}
            scanHint={t.menuScanHint}
            scanErrorText={t.menuScanError}
            scanUnsupportedFormatText={t.imagesUnsupportedFormat}
            scanSuccessTemplate={t.menuScanSuccess}
          />
        </div>

        <div>
          <label className={labelClass}>{t.fieldAmenities}</label>
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" name="wifi" /> {t.amenityWifi}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" name="parking" /> {t.amenityParking}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" name="pool" /> {t.amenityPool}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" name="airConditioning" /> {t.amenityAirConditioning}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" name="accessibility" /> {t.amenityAccessibility}
            </label>
            <label className="flex items-center gap-2 text-sm text-foreground/80">
              <input type="checkbox" name="petsAllowed" /> {t.amenityPetsAllowed}
            </label>
          </div>
        </div>

        <ImageUploader label={t.images} hint={t.imagesHint} unsupportedFormatText={t.imagesUnsupportedFormat} />

        <label className="flex items-start gap-2 text-sm text-foreground/80">
          <input type="checkbox" name="acceptTerms" required className="mt-0.5 shrink-0" />
          <span>
            {t.acceptTermsPrefix}
            <a
              href={`/${lang}/pro/conditions-generales`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ocean-dark underline hover:text-terracotta"
            >
              {t.acceptTermsLink}
            </a>
            {t.acceptTermsMiddle}
            <a
              href={`/${lang}/pro/confidentialite`}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-ocean-dark underline hover:text-terracotta"
            >
              {t.acceptTermsPrivacyLink}
            </a>
            {t.acceptTermsSuffix}
          </span>
        </label>

        <SubmitButton label={t.submit} pendingLabel={t.submitPending} />
      </form>
    </div>
  );
}

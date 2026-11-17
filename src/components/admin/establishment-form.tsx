"use client";

import { useState } from "react";
import { upsertEstablishment } from "@/lib/admin-actions";
import { PRICE_LEVELS, priceLevelLabel } from "@/lib/labels";
import { SubmitButton } from "@/components/submit-button";
import { CategorySubcategoryPicker } from "@/components/category-subcategory-picker";
import { SubcategoryMultiSelect } from "@/components/subcategory-multi-select";
import { HoursEditor } from "@/components/hours-editor";
import { ProductsEditor } from "@/components/products-editor";
import { ActivityTagsPicker } from "@/components/activity-tags-picker";
import { flattenSubcategories } from "@/lib/labels";
import { hasMultiSubcategory } from "@/lib/multi-subcategory";
import { AddressLocationPicker } from "@/components/address-location-picker";
import { PhoneField } from "@/components/phone-field";
import { ImageUploader } from "@/components/image-uploader";
import { SingleImageField } from "@/components/single-image-field";
import { MenuEditor } from "@/components/menu-editor";
import { storedMenuToInput } from "@/lib/digital-menu";
import { qrFeatureLabel } from "@/lib/qr-feature-label";
import { PRO_FORM_STRINGS } from "@/lib/pro-form-i18n";
import type { DigitalMenuItem } from "@/lib/menu-types";

type Category = { id: number; type: string; name: Record<string, string> };
type Subcategory = { slug: string; name: Record<string, string> };
type Professional = { id: number; companyName: string; status: string };
type City = { id: number; slug: string; name: Record<string, string> };
type Establishment = {
  id: number;
  cityId: number;
  categoryId: number;
  subcategory: string;
  subcategories: string[] | null;
  avgDailyPriceMad: number | null;
  slug: string;
  name: Record<string, string>;
  description: Record<string, string>;
  hours: Record<string, string> | null;
  vacationStart: string | null;
  vacationEnd: string | null;
  address: string | null;
  lat: number | null;
  lng: number | null;
  phone: string | null;
  whatsapp: string | null;
  website: string | null;
  instagram: string | null;
  facebook: string | null;
  googleReviewsUrl: string | null;
  tripadvisorUrl: string | null;
  priceLevel: string | null;
  products: { name: Record<string, string>; price: number | null; category: Record<string, string> | null }[] | null;
  services: Record<string, string[]> | null;
  parking: boolean | null;
  wifi: boolean | null;
  accessibility: boolean | null;
  pool: boolean | null;
  airConditioning: boolean | null;
  petsAllowed: boolean | null;
  featured: boolean | null;
  badge: string | null;
  status: string;
  images: string[] | null;
  professionalId: number | null;
  menuPhoto: string | null;
  menuBanner: string | null;
  digitalMenu: DigitalMenuItem[] | null;
};

// Same French labels as the pro's own signup form, so the admin sees the
// fiche exactly the way the pro filled it in.
const t = PRO_FORM_STRINGS.fr;

// A pro may write their fiche in any language: it's saved in that language
// first and only gets its French version once the background translation
// finishes. Show the original meanwhile instead of an empty field (saving an
// empty field would erase the pro's text).
function frOrOriginal(value: Record<string, string> | null | undefined) {
  if (!value) return "";
  return value.fr ?? Object.values(value).find(Boolean) ?? "";
}

const inputClass =
  "w-full rounded-lg border border-black/10 px-3 py-2 text-sm outline-none focus:border-ocean-dark";
const labelClass = "mb-1 block text-xs font-semibold text-foreground/60";

export function EstablishmentForm({
  locale,
  categories,
  subcategoriesByCategory,
  professionals,
  cities,
  establishment,
}: {
  locale: string;
  categories: Category[];
  subcategoriesByCategory: Record<number, Subcategory[]>;
  professionals?: Professional[];
  cities: City[];
  establishment?: Establishment;
}) {
  const activityOptions = flattenSubcategories(categories, subcategoriesByCategory);
  const [categoryId, setCategoryId] = useState<number | undefined>(establishment?.categoryId);
  const categoryType = categories.find((c) => c.id === categoryId)?.type;
  const isCarRental = categoryType === "location-vehicules";
  const isRealEstate = categoryType === "agences-immobilieres";
  const isActivity = categoryType === "activite";
  const isRestaurant = categoryType === "restaurant";
  const isShopping = categoryType === "shopping";
  const isWellness = categoryType === "bien-etre";
  const showMultiSubcategory = hasMultiSubcategory(categoryType);
  const missingFrench =
    !!establishment && (!establishment.name.fr || (!!frOrOriginal(establishment.description) && !establishment.description.fr));
  const multiSubcategoryLabel = isCarRental
    ? "Types de véhicules proposés"
    : isRealEstate
      ? "Types de biens proposés"
      : isActivity
        ? "Types d'activités proposées"
        : isRestaurant
          ? "Types de cuisine et services proposés"
          : isShopping
            ? "Types de produits proposés"
            : isWellness
              ? "Soins et prestations proposés"
              : "Services et activités sur place (restaurant, bar, boîte de nuit, boutique...)";
  return (
    <form action={upsertEstablishment} className="space-y-8">
      <input type="hidden" name="locale" value={locale} />
      {establishment && <input type="hidden" name="id" value={establishment.id} />}
      {establishment && <input type="hidden" name="slug" value={establishment.slug} />}

      <div>
        <label className={labelClass}>Ville</label>
        <select name="cityId" defaultValue={establishment?.cityId ?? cities[0]?.id} className={inputClass} required>
          {cities.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name.fr ?? c.slug}
            </option>
          ))}
        </select>
      </div>

      <CategorySubcategoryPicker
        categories={categories}
        subcategoriesByCategory={subcategoriesByCategory}
        defaultCategoryId={establishment?.categoryId}
        defaultSubcategory={establishment?.subcategory}
        onCategoryChange={setCategoryId}
        hideSubcategory={showMultiSubcategory}
      />

      {showMultiSubcategory && (
        <section className="space-y-4 rounded-xl border border-ocean-dark/20 bg-ocean-dark/5 p-4">
          <SubcategoryMultiSelect
            options={subcategoriesByCategory[categoryId ?? -1] ?? []}
            locale="fr"
            defaultValues={establishment?.subcategories ?? []}
            label={multiSubcategoryLabel}
          />
          {isCarRental && (
            <div>
              <label className={labelClass}>Prix moyen par jour (MAD)</label>
              <input
                type="number"
                name="avgDailyPriceMad"
                min={0}
                step={1}
                defaultValue={establishment?.avgDailyPriceMad ?? ""}
                className={inputClass}
              />
              <p className="mt-1 text-xs text-foreground/50">Donne une idée du budget aux clients, affiché sur la fiche.</p>
            </div>
          )}
        </section>
      )}

      {professionals && (
        <section>
          <label className={labelClass}>Professionnel lié (accès à l&apos;espace pro)</label>
          <select name="professionalId" defaultValue={establishment?.professionalId ?? ""} className={inputClass}>
            <option value="">— Aucun —</option>
            {professionals.map((p) => (
              <option key={p.id} value={p.id}>
                {p.companyName} ({p.status})
              </option>
            ))}
          </select>
        </section>
      )}

      <p className="rounded-lg bg-ocean-dark/5 px-3 py-2 text-xs text-foreground/60">
        Rédigez en français : les autres langues du site seront automatiquement retraduites lors de l&apos;enregistrement.
      </p>

      {missingFrench && (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800">
          La traduction française de cette fiche n&apos;est pas encore prête : les textes ci-dessous sont affichés dans
          la langue utilisée par le professionnel.
        </p>
      )}

      <div>
        <label className={labelClass}>Nom</label>
        <input name="name" defaultValue={frOrOriginal(establishment?.name)} className={inputClass} required />
      </div>
      <div>
        <label className={labelClass}>Description</label>
        <textarea name="description" defaultValue={frOrOriginal(establishment?.description)} rows={4} className={inputClass} />
      </div>

      <div>
        <label className={labelClass}>Horaires</label>
        <HoursEditor
          name="hours"
          defaultValue={frOrOriginal(establishment?.hours)}
          dayLabels={["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"]}
          closedLabel="Fermé"
          openLabel="Ouvert"
          addRangeLabel="Ajouter une plage (pause)"
          copyLabel="Copier la veille"
        />
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Vacances / Fermeture temporaire — Du</label>
          <input type="date" name="vacationStart" defaultValue={establishment?.vacationStart ?? ""} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Vacances / Fermeture temporaire — Au</label>
          <input type="date" name="vacationEnd" defaultValue={establishment?.vacationEnd ?? ""} className={inputClass} />
        </div>
      </section>

      <div>
        <label className={labelClass}>Adresse</label>
        <AddressLocationPicker
          className={inputClass}
          defaultAddress={establishment?.address ?? ""}
          defaultLat={establishment?.lat}
          defaultLng={establishment?.lng}
        />
      </div>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Téléphone</label>
          <PhoneField name="phone" defaultValue={establishment?.phone ?? ""} />
        </div>
        <div>
          <label className={labelClass}>WhatsApp</label>
          <PhoneField name="whatsapp" defaultValue={establishment?.whatsapp ?? ""} />
        </div>
        <div>
          <label className={labelClass}>Site internet</label>
          <input name="website" defaultValue={establishment?.website ?? ""} className={inputClass} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Instagram</label>
          <input name="instagram" defaultValue={establishment?.instagram ?? ""} placeholder="https://instagram.com/..." className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Facebook</label>
          <input name="facebook" defaultValue={establishment?.facebook ?? ""} placeholder="https://facebook.com/..." className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Avis Google</label>
          <input name="googleReviewsUrl" defaultValue={establishment?.googleReviewsUrl ?? ""} placeholder="https://g.page/r/..." className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Avis TripAdvisor</label>
          <input name="tripadvisorUrl" defaultValue={establishment?.tripadvisorUrl ?? ""} placeholder="https://tripadvisor.com/..." className={inputClass} />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Niveau de prix</label>
          <select name="priceLevel" defaultValue={establishment?.priceLevel ?? "€€"} className={inputClass}>
            {PRICE_LEVELS.map((level) => (
              <option key={level} value={level}>
                {priceLevelLabel(level)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Badge</label>
          <input name="badge" defaultValue={establishment?.badge ?? ""} className={inputClass} placeholder="Partenaire" />
        </div>
        <div>
          <label className={labelClass}>Statut</label>
          <select name="status" defaultValue={establishment?.status ?? "active"} className={inputClass}>
            <option value="active">Actif</option>
            <option value="pending">En attente (candidature pro)</option>
            <option value="disabled">Désactivé</option>
          </select>
        </div>
      </section>

      <section className="rounded-xl border border-ocean-dark/20 bg-ocean-dark/5 p-4">
        <label className={labelClass}>{qrFeatureLabel(categoryType, "fr")}</label>
        <p className="mb-3 text-xs text-foreground/50">{t.menuIntro}</p>
        <div className="mb-4 grid grid-cols-1 gap-4 sm:grid-cols-[auto_1fr]">
          <SingleImageField
            name="menuPhoto"
            label={t.menuPhotoLabel}
            defaultValue={establishment?.menuPhoto}
            shape="square"
            unsupportedFormatText={t.imagesUnsupportedFormat}
          />
          <SingleImageField
            name="menuBanner"
            label={t.menuBannerLabel}
            defaultValue={establishment?.menuBanner}
            shape="banner"
            unsupportedFormatText={t.imagesUnsupportedFormat}
          />
        </div>
        <MenuEditor
          name="menuItems"
          defaultItems={storedMenuToInput(establishment?.digitalMenu)}
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
          scanTakePhotoLabel={t.scanTakePhoto}
          scanAnotherPageLabel={t.scanAnotherPage}
          scanAnalyzeTemplate={t.scanAnalyze}
          scanGalleryLabel={t.chooseFromGallery}
          clearMenuLabel={t.clearMenu}
          clearMenuConfirm={t.clearMenuConfirm}
        />
      </section>

      <div>
        <label className={labelClass}>Produits & Services</label>
        <ProductsEditor
          name="products"
          defaultProducts={(establishment?.products ?? []).map((p) => ({
            name: p.name.fr,
            price: p.price,
            category: p.category?.fr ?? null,
          }))}
          namePlaceholder="Nom du produit ou service"
          pricePlaceholder="Prix (MAD)"
          categoryPlaceholder="Catégorie (ex : Entrées)"
          addLabel="Ajouter un produit"
          scanLabel="Scanner un menu ou une carte de prix (photo)"
          scanningLabel="Analyse de la photo en cours..."
          scanHint="Prenez en photo ou importez votre menu, carte de prix ou tarifs affichés — l'IA les ajoutera automatiquement à la liste ci-dessus, à vérifier avant d'enregistrer."
          scanErrorText="Impossible d'analyser cette image, réessayez ou ajoutez les produits manuellement."
          scanSuccessTemplate="{count} élément(s) détecté(s) et ajouté(s) à la liste."
        />
      </div>

      <div>
        <label className={labelClass}>Autres activités sur place</label>
        <p className="mb-2 text-xs text-foreground/50">
          Si l&apos;établissement propose d&apos;autres activités sur place (ex : un hôtel avec restaurant, boutique et hammam).
        </p>
        <ActivityTagsPicker
          options={activityOptions}
          locale="fr"
          defaultValues={establishment?.services?.fr ?? []}
          otherLabel="Autre"
          otherPlaceholder="Précisez votre activité"
        />
      </div>

      <section className="flex flex-wrap gap-6">
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="wifi" defaultChecked={!!establishment?.wifi} /> Wi-Fi
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="parking" defaultChecked={!!establishment?.parking} /> Parking
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="pool" defaultChecked={!!establishment?.pool} /> Piscine
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="airConditioning" defaultChecked={!!establishment?.airConditioning} /> Climatisation
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="accessibility" defaultChecked={!!establishment?.accessibility} /> Accessibilité
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="petsAllowed" defaultChecked={!!establishment?.petsAllowed} /> Animaux acceptés
        </label>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" name="featured" defaultChecked={!!establishment?.featured} /> Mis en avant
        </label>
      </section>

      <ImageUploader
        label={t.images}
        hint={t.imagesHint}
        defaultImages={establishment?.images ?? []}
        unsupportedFormatText={t.imagesUnsupportedFormat}
      />

      <SubmitButton label="Enregistrer" pendingLabel="Traduction et enregistrement en cours..." />
    </form>
  );
}

"use client";

import { useMemo, useRef, useState } from "react";
import { Plus, X, Camera, Loader2, ChevronDown, ChevronUp, ImagePlus } from "lucide-react";
import { compressImage, isUnsupportedImageFile, uploadImageFile } from "@/lib/image-upload";

type VariantInput = { label: string; price: string };
type MenuItemInput = {
  id: string;
  name: string;
  description: string;
  category: string;
  price: string;
  variants: VariantInput[];
  photo: string | null;
};

function fileToBase64(file: File): Promise<{ mediaType: string; base64: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const [prefix, base64] = result.split(",");
      const mediaType = prefix.match(/data:(.*);base64/)?.[1] ?? "image/jpeg";
      resolve({ mediaType, base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// Items are stored as a single flat, ordered array (matches the `products`
// column's convention elsewhere on the site) — category "groups" are derived
// from it by first-occurrence order, not a separate entity. Reordering a group
// just moves its items as a contiguous block within that flat array, and the
// saved order is exactly what the public menu page and dashboard both render.
function groupByCategory(items: MenuItemInput[]) {
  const groups: { category: string; items: MenuItemInput[] }[] = [];
  for (const item of items) {
    const existing = groups.find((g) => g.category === item.category);
    if (existing) existing.items.push(item);
    else groups.push({ category: item.category, items: [item] });
  }
  return groups;
}

export function MenuEditor({
  name,
  defaultItems = [],
  namePlaceholder,
  descriptionPlaceholder,
  categoryNamePlaceholder,
  pricePlaceholder,
  variantLabelPlaceholder,
  addItemLabel,
  addVariantLabel,
  addCategoryLabel,
  newCategoryDefaultName,
  uncategorizedLabel,
  orderLabel,
  collapseAllLabel,
  expandAllLabel,
  singlePriceLabel,
  variantPriceLabel,
  scanLabel,
  scanningLabel,
  scanHint,
  scanErrorText,
  scanUnsupportedFormatText,
  scanSuccessTemplate,
}: {
  name: string;
  defaultItems?: {
    name: string;
    description: string | null;
    price: number | null;
    category: string | null;
    variants: { label: string; price: number }[] | null;
    photo: string | null;
  }[];
  namePlaceholder: string;
  descriptionPlaceholder: string;
  categoryNamePlaceholder: string;
  pricePlaceholder: string;
  variantLabelPlaceholder: string;
  addItemLabel: string;
  addVariantLabel: string;
  addCategoryLabel: string;
  newCategoryDefaultName: string;
  uncategorizedLabel: string;
  orderLabel: string;
  collapseAllLabel: string;
  expandAllLabel: string;
  singlePriceLabel: string;
  variantPriceLabel: string;
  scanLabel: string;
  scanningLabel: string;
  scanHint: string;
  scanErrorText: string;
  scanUnsupportedFormatText: string;
  scanSuccessTemplate: string;
}) {
  const nextId = useRef(0);
  function makeId() {
    nextId.current += 1;
    return `item-${nextId.current}`;
  }
  function emptyItem(category = ""): MenuItemInput {
    return { id: makeId(), name: "", description: "", category, price: "", variants: [], photo: null };
  }

  // Seeded with plain index-based ids rather than makeId() — reading the ref-backed
  // counter during this lazy initializer (which runs at render time) trips React's
  // "no refs during render" rule. makeId() is only ever called afterwards, from
  // event handlers, where touching the ref is safe.
  const [items, setItems] = useState<MenuItemInput[]>(() =>
    defaultItems.map((it, i) => ({
      id: `initial-${i}`,
      name: it.name,
      description: it.description ?? "",
      category: it.category ?? "",
      price: it.price != null ? String(it.price) : "",
      variants: (it.variants ?? []).map((v) => ({ label: v.label, price: String(v.price) })),
      photo: it.photo ?? null,
    }))
  );
  const [openIds, setOpenIds] = useState<Set<string>>(new Set());
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [scanUnsupported, setScanUnsupported] = useState(false);
  const [scanSuccessCount, setScanSuccessCount] = useState<number | null>(null);
  const [scanProgress, setScanProgress] = useState(0);
  const [scanRemainingSeconds, setScanRemainingSeconds] = useState<number | null>(null);
  const [photoUploadingIds, setPhotoUploadingIds] = useState<Set<string>>(new Set());
  // The order-position input is controlled through a per-group draft buffer
  // (keyed by the group's first item id, which stays stable across renames and
  // reorders) rather than the group's live computed position — otherwise typing
  // a two-digit number would fight the position recomputed on every keystroke.
  const [orderDrafts, setOrderDrafts] = useState<Record<string, string>>({});
  // Collapsed categories, keyed the same way as orderDrafts (by the group's
  // first item id) so the collapsed/expanded state survives renames and reorders.
  const [collapsedGroupIds, setCollapsedGroupIds] = useState<Set<string>>(new Set());

  const groups = useMemo(() => groupByCategory(items), [items]);

  function toggleGroupCollapsed(groupId: string) {
    setCollapsedGroupIds((prev) => {
      const next = new Set(prev);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  }
  function collapseAllGroups() {
    setCollapsedGroupIds(new Set(groups.map((g) => g.items[0].id)));
  }
  function expandAllGroups() {
    setCollapsedGroupIds(new Set());
  }

  function toggleOpen(id: string) {
    setOpenIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function updateItem(id: string, field: "name" | "description" | "price", value: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [field]: value } : it)));
  }
  function removeItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id));
  }

  async function handlePhotoUpload(id: string, fileList: FileList | null) {
    const file = fileList?.[0];
    if (!file || isUnsupportedImageFile(file)) return;
    setPhotoUploadingIds((prev) => new Set(prev).add(id));
    try {
      const url = await uploadImageFile(file);
      setItems((prev) => prev.map((it) => (it.id === id ? { ...it, photo: url } : it)));
    } catch {
      // Non-critical, optional field — the pro can just retry the upload.
    } finally {
      setPhotoUploadingIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
    }
  }
  function removePhoto(id: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, photo: null } : it)));
  }

  function addVariant(id: string) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, price: "", variants: [...it.variants, { label: "", price: "" }] } : it))
    );
  }
  function updateVariant(id: string, vi: number, field: "label" | "price", value: string) {
    setItems((prev) =>
      prev.map((it) =>
        it.id === id
          ? { ...it, variants: it.variants.map((v, vidx) => (vidx === vi ? { ...v, [field]: value } : v)) }
          : it
      )
    );
  }
  function removeVariant(id: string, vi: number) {
    setItems((prev) =>
      prev.map((it) => (it.id === id ? { ...it, variants: it.variants.filter((_, vidx) => vidx !== vi) } : it))
    );
  }

  function addItemToGroup(groupIndex: number) {
    const newItem = emptyItem(groups[groupIndex].category);
    setOpenIds((open) => new Set(open).add(newItem.id));
    const newGroups = groups.map((g, i) => (i === groupIndex ? { ...g, items: [...g.items, newItem] } : g));
    setItems(newGroups.flatMap((g) => g.items));
  }

  function renameGroup(groupIndex: number, newCategory: string) {
    const ids = new Set(groups[groupIndex].items.map((it) => it.id));
    setItems((prev) => prev.map((it) => (ids.has(it.id) ? { ...it, category: newCategory } : it)));
  }

  function moveGroupToPosition(groupIndex: number, newPositionOneBased: number) {
    if (Number.isFinite(newPositionOneBased)) {
      const targetIndex = Math.min(Math.max(Math.trunc(newPositionOneBased) - 1, 0), groups.length - 1);
      if (targetIndex !== groupIndex) {
        const reordered = [...groups];
        const [moved] = reordered.splice(groupIndex, 1);
        reordered.splice(targetIndex, 0, moved);
        setItems(reordered.flatMap((g) => g.items));
      }
    }
  }

  function addCategory() {
    const existingNames = new Set(groups.map((g) => g.category));
    let candidate = newCategoryDefaultName;
    let n = 2;
    while (existingNames.has(candidate)) {
      candidate = `${newCategoryDefaultName} ${n}`;
      n += 1;
    }
    const newItem = emptyItem(candidate);
    setOpenIds((open) => new Set(open).add(newItem.id));
    setItems((prev) => [...prev, newItem]);
  }

  async function handleScan(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const allFiles = Array.from(fileList).slice(0, 8);
    // Phone camera shots routinely land here as HEIC (iPhone's default format,
    // which the extraction API rejects) and at 4-10MB each — sending those
    // straight through is exactly what made scanning from a phone fail. Filter
    // out unsupported formats and downscale/re-encode the rest first, same as
    // the photo gallery uploader already does.
    const files = allFiles.filter((f) => !isUnsupportedImageFile(f));
    setScanning(true);
    setScanError(false);
    setScanUnsupported(files.length < allFiles.length);
    setScanSuccessCount(null);
    setScanProgress(0);
    setScanRemainingSeconds(null);
    if (files.length === 0) {
      setScanning(false);
      return;
    }
    let progressTimer: ReturnType<typeof setInterval> | null = null;
    try {
      const compressed = await Promise.all(files.map(compressImage));
      const images = await Promise.all(compressed.map(fileToBase64));

      // Real progress, not a scripted animation: the estimate comes from how long
      // past scans with a similar photo count actually took (see
      // /api/extract-menu/estimate), and the bar/countdown track real elapsed time
      // against it — self-correcting as more scans happen. Capped short of 100%
      // until the response actually arrives, since the estimate is never exact.
      let estimatedMs = images.length * 12000;
      fetch(`/api/extract-menu/estimate?images=${images.length}`)
        .then((r) => (r.ok ? r.json() : null))
        .then((data: { estimatedMs?: number } | null) => {
          if (data?.estimatedMs) estimatedMs = data.estimatedMs;
        })
        .catch(() => {});

      const startedAt = Date.now();
      progressTimer = setInterval(() => {
        const elapsed = Date.now() - startedAt;
        setScanProgress(Math.min(95, (elapsed / estimatedMs) * 100));
        setScanRemainingSeconds(Math.max(0, Math.ceil((estimatedMs - elapsed) / 1000)));
      }, 200);

      const res = await fetch("/api/extract-menu", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      if (!res.ok) throw new Error("extraction failed");
      const data = (await res.json()) as {
        items: {
          name: string;
          description: string | null;
          price: number | null;
          category: string | null;
          variants: { label: string; price: number }[] | null;
        }[];
      };
      const extracted = (data.items ?? []).map((it) => ({
        id: makeId(),
        name: it.name,
        description: it.description ?? "",
        category: it.category ?? "",
        price: it.price != null ? String(it.price) : "",
        variants: (it.variants ?? []).map((v) => ({ label: v.label, price: String(v.price) })),
        photo: null,
      }));
      // Scanned items merge into any existing category group with the exact same
      // name (so re-scanning a second page of the same menu extends the same
      // Entrées/Plats/Desserts sections instead of duplicating them).
      setItems((prev) => [...prev, ...extracted]);
      setScanSuccessCount(extracted.length);
      setScanProgress(100);
      setScanRemainingSeconds(0);
    } catch {
      setScanError(true);
    } finally {
      if (progressTimer) clearInterval(progressTimer);
      setScanning(false);
    }
  }

  const serialized = JSON.stringify(
    items
      .filter((it) => it.name.trim())
      .map((it) => {
        const variants = it.variants
          .filter((v) => v.label.trim() && v.price.trim())
          .map((v) => ({ label: v.label.trim(), price: Number(v.price) }));
        return {
          name: it.name.trim(),
          description: it.description.trim() || null,
          category: it.category.trim() || null,
          price: variants.length === 0 && it.price.trim() ? Number(it.price) : null,
          variants: variants.length > 0 ? variants : null,
          photo: it.photo,
        };
      })
  );

  return (
    <div>
      <div className="space-y-4">
        {groups.map((group, gi) => {
          const groupId = group.items[0].id;
          const isCollapsed = collapsedGroupIds.has(groupId);
          return (
          <div key={gi} className="rounded-xl border border-black/10 bg-sand/10">
            <div className="flex items-center gap-2 border-b border-black/5 p-3">
              <button
                type="button"
                onClick={() => toggleGroupCollapsed(groupId)}
                className="shrink-0 rounded-full p-1.5 text-foreground/50 hover:bg-sand/50"
                aria-label={isCollapsed ? "Ouvrir" : "Réduire"}
              >
                {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
              </button>
              <label className="flex shrink-0 items-center gap-1">
                <span className="text-xs text-foreground/40">{orderLabel}</span>
                <input
                  type="number"
                  min={1}
                  max={groups.length}
                  value={orderDrafts[groupId] ?? String(gi + 1)}
                  onChange={(e) => setOrderDrafts((prev) => ({ ...prev, [groupId]: e.target.value }))}
                  onBlur={(e) => {
                    moveGroupToPosition(gi, Number(e.target.value));
                    setOrderDrafts((prev) => {
                      const next = { ...prev };
                      delete next[groupId];
                      return next;
                    });
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                  }}
                  className="w-14 rounded-lg border border-black/10 bg-white px-2 py-1.5 text-center text-sm outline-none focus:border-ocean-dark"
                />
              </label>
              <input
                value={group.category}
                onChange={(e) => renameGroup(gi, e.target.value)}
                placeholder={categoryNamePlaceholder}
                className="min-w-0 flex-1 rounded-lg border border-black/10 bg-white px-3 py-1.5 text-sm font-semibold text-ocean-dark outline-none focus:border-ocean-dark"
              />
              {!group.category && (
                <span className="shrink-0 text-xs italic text-foreground/40">{uncategorizedLabel}</span>
              )}
              <span className="shrink-0 text-xs text-foreground/40">({group.items.length})</span>
            </div>

            {!isCollapsed && (
            <div className="space-y-2 p-3">
              {group.items.map((it) => {
                const isOpen = openIds.has(it.id);
                return (
                  <div key={it.id} className="rounded-lg border border-black/10 bg-white">
                    <div className="flex flex-wrap items-center gap-2 p-2.5">
                      <div className="flex min-w-[190px] flex-1 items-center gap-2">
                      <div className="relative shrink-0">
                        <label
                          className={`flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-black/10 bg-sand/30 ${
                            photoUploadingIds.has(it.id) ? "cursor-not-allowed" : "cursor-pointer"
                          }`}
                        >
                          {it.photo ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={it.photo} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <ImagePlus size={15} className="text-foreground/30" />
                          )}
                          <input
                            type="file"
                            accept="image/*"
                            disabled={photoUploadingIds.has(it.id)}
                            onChange={(e) => handlePhotoUpload(it.id, e.target.files)}
                            className="hidden"
                          />
                        </label>
                        {photoUploadingIds.has(it.id) && (
                          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/40">
                            <Loader2 size={12} className="animate-spin text-white" />
                          </div>
                        )}
                        {it.photo && !photoUploadingIds.has(it.id) && (
                          <button
                            type="button"
                            onClick={() => removePhoto(it.id)}
                            className="absolute -right-1.5 -top-1.5 rounded-full bg-white p-0.5 text-foreground/60 shadow hover:text-red-600"
                          >
                            <X size={10} />
                          </button>
                        )}
                      </div>
                      <input
                        value={it.name}
                        onChange={(e) => updateItem(it.id, "name", e.target.value)}
                        placeholder={namePlaceholder}
                        className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-ocean-dark"
                      />
                      </div>
                      <div className="ms-auto flex shrink-0 items-center gap-2">
                      {it.variants.length === 0 ? (
                        <input
                          value={it.price}
                          onChange={(e) => updateItem(it.id, "price", e.target.value.replace(/[^\d]/g, ""))}
                          placeholder={pricePlaceholder}
                          inputMode="numeric"
                          className="w-24 shrink-0 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-ocean-dark"
                        />
                      ) : (
                        // Prices must stay visible on the collapsed row too — hiding them
                        // behind the "Détails" toggle made a scanned drink with a
                        // glass/bottle price look like it had no price at all.
                        !isOpen && (
                          <span className="shrink-0 whitespace-nowrap text-xs font-medium text-ocean-dark">
                            {it.variants.map((v) => `${v.label || "?"} ${v.price || "?"}`).join(" · ")} MAD
                          </span>
                        )
                      )}
                      <button
                        type="button"
                        onClick={() => toggleOpen(it.id)}
                        className="shrink-0 rounded-full p-1.5 text-foreground/50 hover:bg-sand/50"
                        aria-label={isOpen ? "Réduire" : "Détails"}
                      >
                        {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="shrink-0 rounded-full p-1.5 text-foreground/50 hover:bg-sand/50 hover:text-red-600"
                      >
                        <X size={16} />
                      </button>
                      </div>
                    </div>

                    {isOpen && (
                      <div className="space-y-3 border-t border-black/5 p-2.5">
                        <textarea
                          value={it.description}
                          onChange={(e) => updateItem(it.id, "description", e.target.value)}
                          placeholder={descriptionPlaceholder}
                          rows={2}
                          className="w-full rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-ocean-dark"
                        />

                        <div>
                          <p className="mb-1.5 text-xs font-medium text-foreground/50">
                            {it.variants.length > 0 ? variantPriceLabel : singlePriceLabel}
                          </p>
                          {it.variants.map((v, vi) => (
                            <div key={vi} className="mb-1.5 flex items-center gap-2">
                              <input
                                value={v.label}
                                onChange={(e) => updateVariant(it.id, vi, "label", e.target.value)}
                                placeholder={variantLabelPlaceholder}
                                className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-ocean-dark"
                              />
                              <input
                                value={v.price}
                                onChange={(e) => updateVariant(it.id, vi, "price", e.target.value.replace(/[^\d]/g, ""))}
                                placeholder={pricePlaceholder}
                                inputMode="numeric"
                                className="w-24 shrink-0 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-ocean-dark"
                              />
                              <button
                                type="button"
                                onClick={() => removeVariant(it.id, vi)}
                                className="shrink-0 rounded-full p-1.5 text-foreground/50 hover:bg-sand/50 hover:text-red-600"
                              >
                                <X size={14} />
                              </button>
                            </div>
                          ))}
                          <button
                            type="button"
                            onClick={() => addVariant(it.id)}
                            className="mt-1 flex items-center gap-1 text-xs font-medium text-azur hover:underline"
                          >
                            <Plus size={12} /> {addVariantLabel}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}

              <button
                type="button"
                onClick={() => addItemToGroup(gi)}
                className="flex items-center gap-1.5 rounded-full border border-dashed border-black/20 px-3 py-1 text-xs font-medium text-foreground/70 hover:bg-white"
              >
                <Plus size={12} /> {addItemLabel}
              </button>
            </div>
            )}
          </div>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addCategory}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-black/20 px-4 py-1.5 text-xs font-medium text-foreground/70 hover:bg-sand/50"
        >
          <Plus size={14} /> {addCategoryLabel}
        </button>
        {groups.length > 1 && (
          <button
            type="button"
            onClick={collapsedGroupIds.size > 0 ? expandAllGroups : collapseAllGroups}
            className="flex items-center gap-1.5 rounded-full border border-black/10 px-4 py-1.5 text-xs font-medium text-foreground/70 hover:bg-sand/50"
          >
            {collapsedGroupIds.size > 0 ? (
              <>
                <ChevronDown size={14} /> {expandAllLabel}
              </>
            ) : (
              <>
                <ChevronUp size={14} /> {collapseAllLabel}
              </>
            )}
          </button>
        )}

        <label
          className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-4 py-1.5 text-xs font-medium ${
            scanning
              ? "cursor-not-allowed border-black/10 text-foreground/40"
              : "border-ocean-dark/30 text-ocean-dark hover:bg-ocean-dark/5"
          }`}
        >
          {scanning ? <Loader2 size={14} className="animate-spin" /> : <Camera size={14} />}
          {scanning ? scanningLabel : scanLabel}
          <input
            type="file"
            accept="image/*"
            multiple
            disabled={scanning}
            onChange={(e) => handleScan(e.target.files)}
            className="hidden"
          />
        </label>
      </div>
      {scanning && (
        <div className="mt-2 w-full max-w-xs">
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-black/10">
            <div
              className="h-full rounded-full bg-ocean-dark transition-[width] duration-200 ease-linear"
              style={{ width: `${scanProgress}%` }}
            />
          </div>
          {scanRemainingSeconds !== null && scanRemainingSeconds > 0 && (
            <p className="mt-1 text-[11px] text-foreground/50">~{scanRemainingSeconds}s</p>
          )}
        </div>
      )}
      <p className="mt-1 text-xs text-foreground/50">{scanHint}</p>
      {scanError && <p className="mt-1 text-xs font-medium text-red-600">{scanErrorText}</p>}
      {scanUnsupported && <p className="mt-1 text-xs font-medium text-amber-600">{scanUnsupportedFormatText}</p>}
      {scanSuccessCount !== null && scanSuccessCount > 0 && (
        <p className="mt-1 text-xs font-medium text-green-700">
          {scanSuccessTemplate.replace("{count}", String(scanSuccessCount))}
        </p>
      )}

      <input type="hidden" name={name} value={serialized} />
    </div>
  );
}

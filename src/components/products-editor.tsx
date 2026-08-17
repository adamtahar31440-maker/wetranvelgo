"use client";

import { useState } from "react";
import { Plus, X, Camera, Loader2 } from "lucide-react";

type ProductInput = { name: string; price: string; category: string };

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

export function ProductsEditor({
  name,
  defaultProducts = [],
  namePlaceholder,
  pricePlaceholder,
  categoryPlaceholder,
  addLabel,
  scanLabel,
  scanningLabel,
  scanHint,
  scanErrorText,
  scanSuccessTemplate,
}: {
  name: string;
  defaultProducts?: { name: string; price: number | null; category?: string | null }[];
  namePlaceholder: string;
  pricePlaceholder: string;
  categoryPlaceholder: string;
  addLabel: string;
  scanLabel: string;
  scanningLabel: string;
  scanHint: string;
  scanErrorText: string;
  scanSuccessTemplate: string;
}) {
  const [items, setItems] = useState<ProductInput[]>(
    defaultProducts.map((p) => ({
      name: p.name,
      price: p.price != null ? String(p.price) : "",
      category: p.category ?? "",
    }))
  );
  const [scanning, setScanning] = useState(false);
  const [scanError, setScanError] = useState(false);
  const [scanSuccessCount, setScanSuccessCount] = useState<number | null>(null);

  function addItem() {
    setItems((prev) => [...prev, { name: "", price: "", category: "" }]);
  }
  function updateItem(i: number, field: "name" | "price" | "category", value: string) {
    setItems((prev) => prev.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)));
  }
  function removeItem(i: number) {
    setItems((prev) => prev.filter((_, idx) => idx !== i));
  }

  async function handleScan(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;
    const files = Array.from(fileList).slice(0, 5);
    setScanning(true);
    setScanError(false);
    setScanSuccessCount(null);
    try {
      const images = await Promise.all(files.map(fileToBase64));
      const res = await fetch("/api/extract-products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ images }),
      });
      if (!res.ok) throw new Error("extraction failed");
      const data = (await res.json()) as {
        items: { name: string; price: number | null; category: string | null }[];
      };
      const extracted = (data.items ?? []).map((it) => ({
        name: it.name,
        price: it.price != null ? String(it.price) : "",
        category: it.category ?? "",
      }));
      setItems((prev) => [...prev, ...extracted]);
      setScanSuccessCount(extracted.length);
    } catch {
      setScanError(true);
    } finally {
      setScanning(false);
    }
  }

  const serialized = JSON.stringify(
    items
      .filter((it) => it.name.trim())
      .map((it) => ({
        name: it.name.trim(),
        price: it.price.trim() ? Number(it.price) : null,
        category: it.category.trim() || null,
      }))
  );

  return (
    <div>
      <div className="space-y-2">
        {items.map((it, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              value={it.name}
              onChange={(e) => updateItem(i, "name", e.target.value)}
              placeholder={namePlaceholder}
              className="flex-1 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-ocean-dark"
            />
            <input
              value={it.category}
              onChange={(e) => updateItem(i, "category", e.target.value)}
              placeholder={categoryPlaceholder}
              className="w-32 shrink-0 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-ocean-dark"
            />
            <input
              value={it.price}
              onChange={(e) => updateItem(i, "price", e.target.value.replace(/[^\d]/g, ""))}
              placeholder={pricePlaceholder}
              inputMode="numeric"
              className="w-28 shrink-0 rounded-lg border border-black/10 px-3 py-1.5 text-sm outline-none focus:border-ocean-dark"
            />
            <button
              type="button"
              onClick={() => removeItem(i)}
              className="shrink-0 rounded-full p-1.5 text-foreground/50 hover:bg-sand/50 hover:text-red-600"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 rounded-full border border-dashed border-black/20 px-4 py-1.5 text-xs font-medium text-foreground/70 hover:bg-sand/50"
        >
          <Plus size={14} /> {addLabel}
        </button>

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
      <p className="mt-1 text-xs text-foreground/50">{scanHint}</p>
      {scanError && <p className="mt-1 text-xs font-medium text-red-600">{scanErrorText}</p>}
      {scanSuccessCount !== null && scanSuccessCount > 0 && (
        <p className="mt-1 text-xs font-medium text-green-700">
          {scanSuccessTemplate.replace("{count}", String(scanSuccessCount))}
        </p>
      )}

      <input type="hidden" name={name} value={serialized} />
    </div>
  );
}

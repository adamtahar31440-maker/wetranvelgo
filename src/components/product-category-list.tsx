"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

type ProductItem = { name: string; price: number | null };
type ProductGroup = { category: string | null; items: ProductItem[] };

function ProductRow({ item }: { item: ProductItem }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <span className="text-sm text-foreground/80">{item.name}</span>
      {item.price != null && (
        <span className="shrink-0 text-sm font-semibold text-ocean-dark">{item.price} MAD</span>
      )}
    </div>
  );
}

export function ProductCategoryList({ groups }: { groups: ProductGroup[] }) {
  const [openIndices, setOpenIndices] = useState<Set<number>>(new Set());

  function toggle(i: number) {
    setOpenIndices((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  }

  return (
    <div className="space-y-3">
      {groups.map((group, gi) => {
        if (!group.category) {
          return (
            <div key={gi} className="divide-y divide-black/5 rounded-2xl border border-black/5">
              {group.items.map((p, i) => (
                <ProductRow key={i} item={p} />
              ))}
            </div>
          );
        }

        const isOpen = openIndices.has(gi);
        return (
          <div key={gi} className="overflow-hidden rounded-2xl border border-black/5">
            <button
              type="button"
              onClick={() => toggle(gi)}
              aria-expanded={isOpen}
              className="flex w-full items-center justify-between gap-4 bg-sand/30 px-4 py-3 text-left"
            >
              <span className="text-sm font-semibold uppercase tracking-wide text-azur">
                {group.category}
              </span>
              {isOpen ? (
                <ChevronUp size={16} className="shrink-0 text-ocean-dark" />
              ) : (
                <ChevronDown size={16} className="shrink-0 text-ocean-dark" />
              )}
            </button>
            {isOpen && (
              <div className="divide-y divide-black/5 border-t border-black/5">
                {group.items.map((p, i) => (
                  <ProductRow key={i} item={p} />
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

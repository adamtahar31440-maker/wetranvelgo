"use client";

import { useState } from "react";
import Image from "next/image";
import { X, ChevronLeft, ChevronRight } from "lucide-react";

export function PhotoGallery({
  images,
  name,
  moreLabel,
}: {
  images: string[];
  name: string;
  moreLabel: string;
}) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  function showPrev() {
    setOpenIndex((i) => (i === null ? null : (i - 1 + images.length) % images.length));
  }
  function showNext() {
    setOpenIndex((i) => (i === null ? null : (i + 1) % images.length));
  }

  return (
    <>
      <div className="grid grid-cols-3 gap-1.5 sm:grid-cols-4 md:grid-cols-6">
        {images.slice(0, 6).map((img, i) => {
          const isLastVisible = i === 5 && images.length > 6;
          return (
            <button
              key={i}
              type="button"
              onClick={() => setOpenIndex(i)}
              className="relative aspect-square overflow-hidden rounded-lg bg-sand"
            >
              <Image
                src={img}
                alt={`${name} ${i + 1}`}
                fill
                className="object-cover"
                priority={i === 0}
                sizes="(max-width: 640px) 33vw, (max-width: 768px) 25vw, 16vw"
              />
              {isLastVisible && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 text-sm font-semibold text-white">
                  {moreLabel}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {openIndex !== null && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpenIndex(null)}
        >
          <button
            type="button"
            onClick={() => setOpenIndex(null)}
            className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          >
            <X size={24} />
          </button>

          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showPrev();
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronLeft size={24} />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  showNext();
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              >
                <ChevronRight size={24} />
              </button>
            </>
          )}

          <div className="relative h-full max-h-[85vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image
              src={images[openIndex]}
              alt={`${name} ${openIndex + 1}`}
              fill
              className="object-contain"
              sizes="100vw"
            />
          </div>
        </div>
      )}
    </>
  );
}

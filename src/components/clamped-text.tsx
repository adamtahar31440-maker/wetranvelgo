"use client";

import { useEffect, useRef, useState } from "react";

// Clamps long text (e.g. an establishment's description) to 4 lines with a
// "Voir plus/moins" toggle. The toggle only renders once we've actually
// measured that the text overflows 4 lines, so short descriptions never show
// a pointless button.
export function ClampedText({
  text,
  moreLabel,
  lessLabel,
  className,
}: {
  text: string;
  moreLabel: string;
  lessLabel: string;
  className?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [isTruncated, setIsTruncated] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    setIsTruncated(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div>
      <p
        ref={ref}
        className={`whitespace-pre-line leading-relaxed ${expanded ? "" : "line-clamp-4"} ${className ?? ""}`}
      >
        {text}
      </p>
      {(isTruncated || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((e) => !e)}
          className="mt-1 text-sm font-medium text-terracotta hover:underline"
        >
          {expanded ? lessLabel : moreLabel}
        </button>
      )}
    </div>
  );
}

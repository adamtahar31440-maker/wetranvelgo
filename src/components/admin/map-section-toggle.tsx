"use client";

import { useState } from "react";

export function MapSectionToggle({
  label,
  defaultEnabled,
  children,
}: {
  label: string;
  defaultEnabled: boolean;
  children: React.ReactNode;
}) {
  const [enabled, setEnabled] = useState(defaultEnabled);

  return (
    <div>
      <label className="flex items-center gap-2 text-sm text-foreground/80">
        <input type="checkbox" name="mapEnabled" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        {label}
      </label>
      {enabled && <div className="mt-3">{children}</div>}
    </div>
  );
}

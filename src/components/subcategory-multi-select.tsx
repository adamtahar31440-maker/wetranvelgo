type SubcategoryOption = { slug: string; name: Record<string, string> };

// Plain checkboxes sharing one `name` — the browser's own multi-value form
// semantics (formData.getAll(name)) do the serialization, no client state or
// hidden-input JSON needed.
export function SubcategoryMultiSelect({
  options,
  locale = "fr",
  defaultValues = [],
  label,
  name = "subcategories",
}: {
  options: SubcategoryOption[];
  locale?: string;
  defaultValues?: string[];
  label: string;
  name?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-semibold text-foreground/60">{label}</label>
      <div className="flex flex-wrap gap-2">
        {options.map((o) => (
          <label
            key={o.slug}
            className="flex cursor-pointer items-center gap-1.5 rounded-full border border-black/10 px-3 py-1.5 text-xs font-medium text-foreground/70 has-[:checked]:border-ocean-dark has-[:checked]:bg-ocean-dark/10 has-[:checked]:text-ocean-dark"
          >
            <input
              type="checkbox"
              name={name}
              value={o.slug}
              defaultChecked={defaultValues.includes(o.slug)}
              className="h-3.5 w-3.5 accent-ocean-dark"
            />
            {o.name[locale] ?? o.name.fr}
          </label>
        ))}
      </div>
    </div>
  );
}

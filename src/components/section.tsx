import { cn } from "@/lib/utils";

export function Section({
  title,
  action,
  className,
  children,
}: {
  title?: string;
  action?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <section className={cn("mx-auto max-w-7xl px-4 py-14 sm:px-6", className)}>
      {(title || action) && (
        <div className="mb-8 flex items-end justify-between gap-4">
          {title && <h2 className="text-2xl font-semibold tracking-tight text-ocean-dark sm:text-3xl">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

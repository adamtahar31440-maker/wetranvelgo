"use client";

// No error boundary existed anywhere in the app before this — any unhandled
// exception (e.g. a Server Action throwing on a bad form value) fell through
// to Next.js's bare, unstyled default error page, which read to users as
// "this page couldn't load" with no way to recover except leaving.
export default function LocaleError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <h1 className="text-2xl font-semibold text-ocean-dark">Une erreur est survenue</h1>
      <p className="max-w-md text-sm text-foreground/60">
        Quelque chose s&apos;est mal passé de notre côté. Réessayez — si le problème persiste, contactez-nous.
      </p>
      <button
        onClick={() => reset()}
        className="rounded-full bg-ocean-dark px-6 py-2.5 text-sm font-semibold text-white hover:bg-ocean"
      >
        Réessayer
      </button>
    </div>
  );
}

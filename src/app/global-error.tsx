"use client";

// Last-resort boundary for errors thrown outside the [locale] segment (e.g.
// in [locale]/layout.tsx itself) — replaces the whole document, so it can't
// rely on globals.css/Tailwind having loaded and uses inline styles instead.
export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif" }}>
        <div
          style={{
            minHeight: "60vh",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 16,
            padding: 16,
            textAlign: "center",
          }}
        >
          <h1 style={{ fontSize: 24, fontWeight: 600, color: "#17495e" }}>Une erreur est survenue</h1>
          <p style={{ maxWidth: 420, fontSize: 14, color: "#666" }}>
            Quelque chose s&apos;est mal passé de notre côté. Réessayez — si le problème persiste, contactez-nous.
          </p>
          <button
            onClick={() => reset()}
            style={{
              borderRadius: 999,
              background: "#17495e",
              color: "white",
              padding: "10px 24px",
              fontSize: 14,
              fontWeight: 600,
              border: "none",
              cursor: "pointer",
            }}
          >
            Réessayer
          </button>
        </div>
      </body>
    </html>
  );
}

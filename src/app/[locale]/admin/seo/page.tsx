export default function AdminSeoPage() {
  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">SEO</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <p className="text-sm font-semibold text-ocean-dark">Sitemap XML</p>
          <p className="mt-1 text-sm text-foreground/60">
            Généré automatiquement pour toutes les langues et tous les contenus.
          </p>
          <a href="/sitemap.xml" target="_blank" className="mt-2 inline-block text-sm text-azur hover:underline">
            Voir le sitemap →
          </a>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <p className="text-sm font-semibold text-ocean-dark">Robots.txt</p>
          <p className="mt-1 text-sm text-foreground/60">Autorise l&apos;indexation, exclut /api/.</p>
          <a href="/robots.txt" target="_blank" className="mt-2 inline-block text-sm text-azur hover:underline">
            Voir robots.txt →
          </a>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <p className="text-sm font-semibold text-ocean-dark">Meta tags & Schema.org</p>
          <p className="mt-1 text-sm text-foreground/60">
            Chaque établissement, article et événement génère automatiquement ses balises meta title/description,
            Open Graph et un schema.org (LocalBusiness / Article / Event) à partir de son contenu.
          </p>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-5">
          <p className="text-sm font-semibold text-ocean-dark">Redirections 301</p>
          <p className="mt-1 text-sm text-foreground/60">
            Pas encore d&apos;éditeur dédié — dis-moi si tu as des URLs à rediriger et je les ajoute.
          </p>
        </div>
      </div>
    </div>
  );
}

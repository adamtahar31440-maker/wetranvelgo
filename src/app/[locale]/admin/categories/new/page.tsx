import { CategoryForm } from "@/components/admin/category-form";

export default async function NewCategoryPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-ocean-dark">Nouvelle catégorie</h1>
      <CategoryForm locale={locale} />
    </div>
  );
}

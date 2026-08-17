import { SignIn } from "@clerk/nextjs";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-sand/30 px-4 py-16">
      <SignIn path={`/${locale}/sign-in`} signUpUrl={`/${locale}/sign-up`} />
    </div>
  );
}

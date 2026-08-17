import { SignUp } from "@clerk/nextjs";

export default async function SignUpPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-sand/30 px-4 py-16">
      <SignUp path={`/${locale}/sign-up`} signInUrl={`/${locale}/sign-in`} />
    </div>
  );
}

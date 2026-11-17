import { SignIn } from "@clerk/nextjs";

export default async function SignInPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  return (
    <div className="flex min-h-[80vh] items-center justify-center bg-sand/30 px-4 py-16">
      {/* No "Sign up" link here: new pro accounts are only created from the
          /pro landing page, so the public sign-in button can't be used to
          mass-create accounts from the main site. */}
      <SignIn
        path={`/${locale}/sign-in`}
        signUpUrl={`/${locale}/pro`}
        appearance={{ elements: { footerAction: { display: "none" } } }}
      />
    </div>
  );
}

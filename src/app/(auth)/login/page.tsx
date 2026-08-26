import { signIn } from "@/lib/auth";
import { LoginForm } from "./login-form";

export default function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center gap-6 px-5 py-16">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">Sign In</h1>
        <p className="text-chalk-dim mt-2 text-sm">Enter your email and we&apos;ll send you a sign-in link.</p>
      </div>

      <LoginErrorBanner searchParams={searchParams} />

      <LoginForm
        action={async (formData) => {
          "use server";
          const email = formData.get("email");
          if (typeof email !== "string" || !email) return;
          // Always land on /welcome — it redirects straight through to "/"
          // for anyone who already has a display name, so this doesn't add
          // a visible extra step for returning users.
          await signIn("resend", { email, redirectTo: "/welcome" });
        }}
      />
    </div>
  );
}

async function LoginErrorBanner({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  if (!error) return null;

  return (
    <p className="border-clay-bright text-clay-bright border-l-2 py-1 pl-3 text-sm">
      That link didn&apos;t work — it may have expired. Request a new one below.
    </p>
  );
}

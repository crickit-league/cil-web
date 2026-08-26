import { signIn } from "@/lib/auth";
import { getPostSignInRedirect } from "@/lib/services/users";

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

      <form
        action={async (formData) => {
          "use server";
          const email = formData.get("email");
          if (typeof email !== "string" || !email) return;
          const redirectTo = await getPostSignInRedirect(email);
          await signIn("resend", { email, redirectTo });
        }}
        className="flex flex-col gap-3"
      >
        <label htmlFor="email" className="font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          autoComplete="email"
          placeholder="you@example.com"
          className="border-line text-chalk placeholder:text-chalk-faint focus:border-clay border-0 border-b-[1.5px] bg-transparent px-0.5 py-2 text-[1.02rem] focus:outline-none"
        />
        <button
          type="submit"
          className="font-data border-clay bg-clay text-chalk hover:border-clay-bright hover:bg-clay-bright mt-4 border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors"
        >
          Send Sign-In Link
        </button>
      </form>
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

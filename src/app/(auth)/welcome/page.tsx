import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { WelcomeForm } from "./welcome-form";

export default async function WelcomePage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  // Already set (e.g. someone re-visits this URL) — nothing to do here.
  if (session.user.name) {
    redirect("/");
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center gap-6 px-5 py-16">
      <div>
        <h1 className="font-display text-2xl font-extrabold tracking-wide uppercase">Welcome</h1>
        <p className="text-chalk-dim mt-2 text-sm">What should we call you?</p>
      </div>
      <WelcomeForm />
    </div>
  );
}

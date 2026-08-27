"use client";

import { LOGIN_EMAIL_STORAGE_KEY } from "@/lib/auth/client-constants";

export function LoginForm({ action }: { action: (formData: FormData) => void }) {
  return (
    <form
      action={action}
      onSubmit={(event) => {
        const email = new FormData(event.currentTarget).get("email");
        if (typeof email === "string" && email) {
          try {
            sessionStorage.setItem(LOGIN_EMAIL_STORAGE_KEY, email);
          } catch {
            // Private browsing, storage disabled, etc. — the code-entry box
            // just won't be prefilled; not worth failing sign-in over.
          }
        }
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
  );
}

"use client";

import { useEffect, useState } from "react";
import { LOGIN_EMAIL_STORAGE_KEY } from "@/lib/auth/client-constants";

// Submits straight to Auth.js's own callback route with the query params it
// already expects (callbackUrl, token, email) — the exact same request a
// clicked link makes, just built from a typed-in code instead of a URL.
// See src/lib/auth/config.ts for why the code and the link are the same
// token under the hood.
export function VerifyCodeForm() {
  const [email, setEmail] = useState("");

  useEffect(() => {
    // sessionStorage only exists client-side, so this can't be a useState
    // initializer without mismatching the server-rendered empty input.
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time hydration from browser storage, not a sync loop
      setEmail(sessionStorage.getItem(LOGIN_EMAIL_STORAGE_KEY) ?? "");
    } catch {
      // Private browsing, storage disabled, etc. — just leave it blank.
    }
  }, []);

  return (
    <form method="GET" action="/api/auth/callback/resend" className="flex flex-col gap-3">
      <input type="hidden" name="callbackUrl" value="/welcome" />

      <label
        htmlFor="verify-email"
        className="font-data text-chalk-dim text-[0.68rem] tracking-[0.1em] uppercase"
      >
        Email
      </label>
      <input
        id="verify-email"
        name="email"
        type="email"
        required
        autoComplete="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="you@example.com"
        className="border-line text-chalk placeholder:text-chalk-faint focus:border-clay border-0 border-b-[1.5px] bg-transparent px-0.5 py-2 text-[1.02rem] focus:outline-none"
      />

      <label
        htmlFor="token"
        className="font-data text-chalk-dim mt-2 text-[0.68rem] tracking-[0.1em] uppercase"
      >
        6-digit code
      </label>
      <input
        id="token"
        name="token"
        type="text"
        inputMode="numeric"
        pattern="[0-9]{6}"
        maxLength={6}
        required
        placeholder="123456"
        className="border-line text-chalk placeholder:text-chalk-faint focus:border-clay border-0 border-b-[1.5px] bg-transparent px-0.5 py-2 text-[1.4rem] tracking-[0.3em] focus:outline-none"
      />

      <button
        type="submit"
        className="font-data border-line text-chalk-dim hover:border-clay hover:text-chalk mt-4 border px-5 py-3 text-xs tracking-[0.08em] uppercase transition-colors"
      >
        Verify Code
      </button>
    </form>
  );
}

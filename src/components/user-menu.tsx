"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useSession, signOut } from "next-auth/react";

export function UserMenu() {
  const { data: session, status } = useSession();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  if (status === "loading") {
    return <div className="h-4 w-16" aria-hidden />;
  }

  if (!session?.user) {
    return (
      <Link
        href="/login"
        className="font-data text-chalk-dim hover:text-chalk text-xs tracking-[0.1em] uppercase transition-colors"
      >
        Sign In
      </Link>
    );
  }

  const isAdmin = session.user.roles?.includes("ADMIN") || session.user.roles?.includes("SUPER_ADMIN");

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="font-data text-chalk-dim hover:text-chalk max-w-[10rem] truncate text-xs tracking-[0.1em] uppercase transition-colors"
      >
        {session.user.name || session.user.email}
      </button>

      {open ? (
        <div className="border-line bg-dugout absolute top-full right-0 z-50 mt-2 w-48 border py-1">
          {isAdmin ? (
            <Link
              href="/admin"
              onClick={() => setOpen(false)}
              className="font-data text-chalk-dim hover:text-chalk hover:bg-dugout-2 block px-4 py-2.5 text-xs tracking-[0.08em] uppercase transition-colors"
            >
              Admin Dashboard
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: "/" })}
            className="font-data text-chalk-dim hover:text-chalk hover:bg-dugout-2 block w-full px-4 py-2.5 text-left text-xs tracking-[0.08em] uppercase transition-colors"
          >
            Sign Out
          </button>
        </div>
      ) : null}
    </div>
  );
}

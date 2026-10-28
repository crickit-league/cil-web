"use client";

import { useSyncExternalStore } from "react";
import { Moon, Sun } from "lucide-react";

type Theme = "light" | "dark";

const STORAGE_KEY = "cil-theme";
const CHANGE_EVENT = "cil-theme-change";

// The theme in effect: the visitor's stored choice (the root layout's script copies it
// onto <html data-theme>), else their system setting.
function readTheme(): Theme {
  const chosen = document.documentElement.dataset.theme;
  if (chosen === "light" || chosen === "dark") return chosen;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function subscribe(notify: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: dark)");
  window.addEventListener(CHANGE_EVENT, notify);
  media.addEventListener("change", notify);
  return () => {
    window.removeEventListener(CHANGE_EVENT, notify);
    media.removeEventListener("change", notify);
  };
}

export function ThemeToggle() {
  // The server can't know the visitor's theme; it renders the light default and the
  // client corrects it after hydration.
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as Theme);
  const next: Theme = theme === "dark" ? "light" : "dark";

  const toggle = () => {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // storage unavailable: the choice just lasts until the page is closed
    }
    window.dispatchEvent(new Event(CHANGE_EVENT));
  };

  const Icon = theme === "dark" ? Sun : Moon;
  return (
    <button
      type="button"
      onClick={toggle}
      aria-label={`Switch to ${next} theme`}
      title={`Switch to ${next} theme`}
      className="border-line text-chalk-dim hover:border-clay hover:text-clay flex h-9 w-9 items-center justify-center rounded-full border transition-colors"
    >
      <Icon className="size-[18px]" aria-hidden="true" />
    </button>
  );
}

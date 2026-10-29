"use client";

import { useLayoutEffect, useRef, useState } from "react";
import { formatPhone, phoneDigits } from "@/lib/phone";

/** Index in `formatted` just after its `count`-th digit (0 → before the first digit). */
function caretAfterDigits(formatted: string, count: number): number {
  if (count === 0) return formatted.startsWith("(") ? 1 : 0;
  let seen = 0;
  for (let i = 0; i < formatted.length; i++) {
    if (/\d/.test(formatted[i]) && ++seen === count) return i + 1;
  }
  return formatted.length;
}

/**
 * A US phone field that formats as you type: "4045550123" → "(404) 555-0123".
 * Keeps the caret next to the same digit while the punctuation moves, makes
 * backspace over ")", " " or "-" delete the digit before it, and cleans up
 * pastes ("+1 404-555-0123" → "(404) 555-0123"). Submits the formatted text;
 * the server re-validates it as exactly 10 digits.
 */
export function PhoneInput({
  name,
  defaultValue,
  placeholder,
  className,
}: {
  name: string;
  defaultValue: string;
  placeholder: string;
  className: string;
}) {
  const [value, setValue] = useState(() => formatPhone(phoneDigits(defaultValue)));
  const ref = useRef<HTMLInputElement>(null);
  const pendingCaret = useRef<number | null>(null);

  useLayoutEffect(() => {
    if (pendingCaret.current !== null && ref.current && document.activeElement === ref.current) {
      ref.current.setSelectionRange(pendingCaret.current, pendingCaret.current);
    }
    pendingCaret.current = null;
  }, [value]);

  function update(nextDigits: string, digitsBeforeCaret: number) {
    const formatted = formatPhone(nextDigits);
    pendingCaret.current = caretAfterDigits(formatted, Math.min(digitsBeforeCaret, nextDigits.length));
    setValue(formatted);
  }

  return (
    <input
      ref={ref}
      name={name}
      value={value}
      type="tel"
      inputMode="tel"
      autoComplete="off"
      // "(404) 555-0123" is 14 characters; pastes are cleaned in onPaste first.
      maxLength={14}
      placeholder={placeholder}
      className={className}
      onPaste={(event) => {
        event.preventDefault();
        const input = event.currentTarget;
        const start = input.selectionStart ?? value.length;
        const end = input.selectionEnd ?? value.length;
        const before = value.slice(0, start).replace(/\D/g, "");
        const after = value.slice(end).replace(/\D/g, "");
        const pasted = event.clipboardData.getData("text").replace(/\D/g, "");
        // A pasted "+1 404…" drops the country code even mid-field.
        const cleanPasted = pasted.length === 11 && pasted.startsWith("1") ? pasted.slice(1) : pasted;
        const next = phoneDigits(before + cleanPasted + after);
        update(next, before.length + cleanPasted.length);
      }}
      onChange={(event) => {
        const raw = event.target.value;
        const caret = event.target.selectionStart ?? raw.length;
        let digitsBeforeCaret = raw.slice(0, caret).replace(/\D/g, "").length;
        let next = phoneDigits(raw);
        const prev = phoneDigits(value);
        // Backspace/delete removed only punctuation: remove the digit before it instead.
        if (next === prev && raw.length < value.length && digitsBeforeCaret > 0) {
          next = prev.slice(0, digitsBeforeCaret - 1) + prev.slice(digitsBeforeCaret);
          digitsBeforeCaret -= 1;
        }
        // phoneDigits may have dropped a leading "1"; keep the caret on the same digit.
        const rawDigits = raw.replace(/\D/g, "");
        if (rawDigits.startsWith("1") && !next.startsWith("1") && digitsBeforeCaret > 0) {
          digitsBeforeCaret -= 1;
        }
        update(next, digitsBeforeCaret);
      }}
    />
  );
}

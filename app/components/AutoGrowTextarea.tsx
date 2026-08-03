"use client";

import { useLayoutEffect, useRef } from "react";

type AutoGrowTextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  minRows?: number;
  maxHeight?: number;
  className?: string;
};

export function AutoGrowTextarea({
  value,
  onChange,
  placeholder,
  icon,
  minRows = 3,
  maxHeight = 420,
  className = "",
}: AutoGrowTextareaProps) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [value, maxHeight]);

  const isEmpty = value.length === 0;

  return (
    <div className="relative">
      <textarea
        ref={ref}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={minRows}
        style={{
          background: "var(--surface-1)",
          borderColor: "var(--border-subtle)",
          color: "var(--text-primary)",
          maxHeight,
        }}
        className={`custom-scroll focus-glow w-full resize-none overflow-y-auto rounded-xl border p-4 text-sm leading-relaxed outline-none transition-shadow placeholder:text-[color:var(--text-tertiary)] ${className}`}
      />
      {isEmpty && icon && (
        <div
          className="pointer-events-none absolute top-0 right-0 bottom-0 left-0 flex items-center justify-center opacity-[0.07]"
          style={{ color: "var(--text-primary)" }}
        >
          <div className="h-10 w-10">{icon}</div>
        </div>
      )}
    </div>
  );
}

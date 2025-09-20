"use client";
import { useState } from "react";

type Props = React.InputHTMLAttributes<HTMLInputElement> & {
  label?: string;
  error?: string;
  rightIcon?: React.ReactNode;
};

export default function Input({ label, error, rightIcon, className = "", type = "text", ...rest }: Props) {
  const [show, setShow] = useState(false);
  const isPassword = type === "password";
  const currentType = isPassword ? (show ? "text" : "password") : type;

  return (
    <label className="block w-full">
      {label && (
        <span className="mb-2 block text-sm text-[color:var(--lilac)]">{label}</span>
      )}
      <div className={`relative`}>
        <input
          {...rest}
          type={currentType}
          className={`w-full rounded-xl bg-[rgba(255,255,255,0.06)]/90 border border-[rgba(168,164,255,0.25)] outline-none text-[color:var(--foreground)] placeholder:text-[rgba(241,250,238,0.55)] px-4 py-3 pr-12 focus:ring-2 focus:ring-[color:var(--purple)] transition-[ring,background,border] ${className}`}
        />
        {isPassword ? (
          <button
            type="button"
            aria-label={show ? "Ocultar senha" : "Mostrar senha"}
            onClick={() => setShow(v => !v)}
            className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center w-8 h-8 rounded focus:outline-none focus:ring-2 focus:ring-[color:var(--lilac)] text-[rgba(241,250,238,0.8)] hover:text-white transition-colors"
            tabIndex={0}
          >
            {show ? (
              // eye-off
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <path d="M17.94 17.94A10.94 10.94 0 0 1 12 19.5C6.274 19.5 1.67 15.6.458 11.264a1.5 1.5 0 0 1 0-1.028A13.3 13.3 0 0 1 6.6 4.117" />
                <path d="M1 1l22 22" />
                <path d="M9.53 9.53a4 4 0 0 0 5.66 5.66" />
                <path d="M12 5.5a7.5 7.5 0 0 1 7.5 7.5c0 .387-.031.767-.092 1.137" />
              </svg>
            ) : (
              // eye-on
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
                <ellipse cx="12" cy="12" rx="10" ry="7" />
                <circle cx="12" cy="12" r="3" />
              </svg>
            )}
          </button>
        ) : (
          rightIcon && <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightIcon}</div>
        )}
      </div>
      {error && <span className="mt-1 block text-xs text-red-300">{error}</span>}
    </label>
  );
}

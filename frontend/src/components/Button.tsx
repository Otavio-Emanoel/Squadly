import { ButtonHTMLAttributes } from "react";

export default function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center rounded-xl bg-[color:var(--purple)]/90 hover:bg-[color:var(--purple)] text-white px-4 py-3 font-medium shadow-[0_10px_20px_rgba(157,78,221,0.25)] focus:outline-none focus:ring-2 focus:ring-[color:var(--lilac)] disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${className}`}
    />
  );
}

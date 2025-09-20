import { PropsWithChildren } from "react";

export default function GlassCard({ children, className = "" }: PropsWithChildren<{ className?: string }>) {
  return (
    <div className={`glass rounded-2xl p-6 md:p-8 shadow-[0_10px_30px_rgba(0,0,0,0.3)] border ${className}`}>
      {children}
    </div>
  );
}

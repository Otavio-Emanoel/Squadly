"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Starfield from "@/components/Starfield";
import Logo from "@/components/Logo";

export default function SplashPage() {
  const router = useRouter();

  useEffect(() => {
    const id = setTimeout(() => router.replace("/login"), 1600);
    return () => clearTimeout(id);
  }, [router]);

  return (
    <div className="relative min-h-dvh grid place-items-center overflow-hidden">
      <Starfield />

      {/* Nebulosas */}
      <div className="nebula -z-10" style={{ width: 360, height: 360, borderRadius: 9999, background: "radial-gradient(circle, #A8A4FF, transparent 60%)", left: "-60px", top: "-40px" }} />
      <div className="nebula -z-10" style={{ width: 420, height: 420, borderRadius: 9999, background: "radial-gradient(circle, #9D4EDD, transparent 60%)", right: "-100px", bottom: "-60px" }} />

      <div className="relative flex flex-col items-center gap-2">
        <div className="animate-pulse">
          <Logo size={84} />
        </div>
        <h1 className="text-[clamp(28px,6vw,48px)] font-extrabold tracking-wider text-glow">Squadly</h1>
        <p className="text-[rgba(241,250,238,.8)] text-sm">Explorando produtividade em outra órbita</p>
      </div>

      <p className="absolute bottom-6 inset-x-0 text-center text-xs text-[rgba(241,250,238,.55)]">Carregando...</p>
    </div>
  );
}

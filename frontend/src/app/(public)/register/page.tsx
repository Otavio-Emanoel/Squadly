"use client";
import Link from "next/link";
import Starfield from "@/components/Starfield";
import GlassCard from "@/components/GlassCard";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Logo from "@/components/Logo";
import { useState } from "react";
import { motion } from "framer-motion";
import { authApi } from "@/lib/api";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("As senhas não conferem");
      return;
    }
    setLoading(true);
    try {
      const res = await authApi.register(name, email, password);
      if (res?.token) localStorage.setItem("token", res.token);
      router.push("/splash");
    } catch (err: unknown) {
      function hasMessage(e: unknown): e is { message: string } {
        return typeof e === "object" && e !== null && "message" in e && typeof (e as { message: unknown }).message === "string";
      }
      const message = hasMessage(err) ? err.message : "Falha no cadastro";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-dvh overflow-hidden">
      <Starfield />
      {/* Nebulosas */}
      <div className="nebula -z-10" style={{ width: 420, height: 420, borderRadius: 9999, background: "radial-gradient(circle, #A8A4FF, transparent 60%)", left: "-120px", top: "-80px" }} />
      <div className="nebula -z-10" style={{ width: 520, height: 520, borderRadius: 9999, background: "radial-gradient(circle, #9D4EDD, transparent 60%)", right: "-160px", bottom: "-120px" }} />

      <div className="relative grid place-items-center px-4 py-10 md:py-16">
        <motion.div
          className="w-full max-w-[520px]"
          initial={{ opacity: 0, y: 12, scale: 0.985 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="flex items-center gap-3 mb-6">
            <Logo size={48} />
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-glow">Criar conta</h1>
              <p className="text-sm text-[rgba(241,250,238,.7)]">Preencha os dados abaixo</p>
            </div>
          </div>

          <GlassCard className="overflow-hidden">
            <form onSubmit={submit} className="space-y-4">
              {error && (
                <div className="rounded-md border border-red-400/30 bg-red-500/10 text-red-200 px-3 py-2 text-sm">
                  {error}
                </div>
              )}
              <Input label="Nome completo" placeholder="Seu nome" value={name} onChange={e => setName(e.currentTarget.value)} required />
              <Input label="E-mail" type="email" placeholder="voce@exemplo.com" value={email} onChange={e => setEmail(e.currentTarget.value)} autoComplete="email" required />
              <div className="grid sm:grid-cols-2 gap-4">
                <Input label="Senha" type="password" placeholder="Crie uma senha" value={password} onChange={e => setPassword(e.currentTarget.value)} autoComplete="new-password" required />
                <Input label="Confirmar senha" type="password" placeholder="Repita a senha" value={confirm} onChange={e => setConfirm(e.currentTarget.value)} autoComplete="new-password" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? "Cadastrando..." : "Cadastrar"}
              </Button>
            </form>
          </GlassCard>

          <p className="mt-4 text-sm text-center text-[rgba(241,250,238,.8)]">
            Já possui conta? {" "}
            <Link href="/login" className="text-[color:var(--lilac)] hover:underline">Entrar</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}

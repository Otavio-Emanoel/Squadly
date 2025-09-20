"use client";
import { useState } from "react";
import Starfield from "@/components/Starfield";
import GlassCard from "@/components/GlassCard";
import Input from "@/components/Input";
import Button from "@/components/Button";
import Logo from "@/components/Logo";
import Link from "next/link";

export default function RegisterPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  return (
    <main className="min-h-dvh relative overflow-hidden grid place-items-center px-4">
      <Starfield />
      <div className="relative z-10 w-full max-w-[480px]">
        <div className="flex items-center gap-3 mb-6 justify-center">
          <Logo size={52} />
          <h1 className="text-xl md:text-2xl font-semibold text-glow">Criar conta</h1>
        </div>
        <GlassCard>
          <form className="grid gap-4">
            <Input label="Nome" placeholder="Seu nome" value={name} onChange={(e) => setName(e.target.value)} />
            <Input label="E-mail" type="email" placeholder="seu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input label="Senha" type="password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
            <Input label="Confirmar senha" type="password" placeholder="••••••••" value={confirm} onChange={(e) => setConfirm(e.target.value)} />
            <Button type="submit" className="w-full mt-2">Criar conta</Button>
          </form>
        </GlassCard>
        <p className="mt-4 text-center text-sm opacity-80">
          Já tem conta? <Link href="/auth/login" className="text-[color:var(--lilac)] hover:underline">Entrar</Link>
        </p>
      </div>
    </main>
  );
}

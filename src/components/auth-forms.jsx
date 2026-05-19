"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LockKeyhole, UserPlus } from "lucide-react";
import { useToast } from "@/components/toast";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const [form, setForm] = useState({ email: "", password: "" });
  const next = searchParams.get("next") || "/minha-conta";

  async function submit(event) {
    event.preventDefault();
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error || "Não foi possível entrar.");
      return;
    }
    window.dispatchEvent(new Event("auth-updated"));
    router.push(next);
  }

  return (
    <form className="auth-card" onSubmit={submit}>
      <h1>Entrar</h1>
      <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></label>
      <label>Senha<input type="password" required value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></label>
      <button className="button button-primary" type="submit"><LockKeyhole size={18} /> Entrar</button>
      <p>Ainda não tem conta? <Link href={`/cadastro?next=${encodeURIComponent(next)}`}>Cadastre-se</Link></p>
    </form>
  );
}

export function RegisterForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { showToast } = useToast();
  const next = searchParams.get("next") || "/minha-conta";
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    phone: "",
    cpf: "",
    cep: "",
    street: "",
    number: "",
    complement: "",
    neighborhood: "",
    city: "",
    state: "",
  });

  function update(field, value) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  async function submit(event) {
    event.preventDefault();
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await response.json();
    if (!response.ok) {
      showToast(data.error || "Não foi possível cadastrar.");
      return;
    }
    window.dispatchEvent(new Event("auth-updated"));
    router.push(next);
  }

  return (
    <form className="auth-card auth-card-wide" onSubmit={submit}>
      <h1>Criar conta</h1>
      <div className="auth-grid">
        <label>Nome completo<input required value={form.fullName} onChange={(e) => update("fullName", e.target.value)} /></label>
        <label>Email<input type="email" required value={form.email} onChange={(e) => update("email", e.target.value)} /></label>
        <label>Senha<input type="password" required minLength={6} value={form.password} onChange={(e) => update("password", e.target.value)} /></label>
        <label>Telefone<input required value={form.phone} onChange={(e) => update("phone", e.target.value)} /></label>
        <label>CPF opcional<input value={form.cpf} onChange={(e) => update("cpf", e.target.value)} /></label>
        <label>CEP<input required value={form.cep} onChange={(e) => update("cep", e.target.value)} /></label>
        <label>Rua<input required value={form.street} onChange={(e) => update("street", e.target.value)} /></label>
        <label>Número<input required value={form.number} onChange={(e) => update("number", e.target.value)} /></label>
        <label>Complemento<input value={form.complement} onChange={(e) => update("complement", e.target.value)} /></label>
        <label>Bairro<input required value={form.neighborhood} onChange={(e) => update("neighborhood", e.target.value)} /></label>
        <label>Cidade<input required value={form.city} onChange={(e) => update("city", e.target.value)} /></label>
        <label>Estado<input required maxLength={2} value={form.state} onChange={(e) => update("state", e.target.value.toUpperCase())} /></label>
      </div>
      <button className="button button-primary" type="submit"><UserPlus size={18} /> Cadastrar</button>
      <p>Já tem conta? <Link href={`/login?next=${encodeURIComponent(next)}`}>Entrar</Link></p>
    </form>
  );
}

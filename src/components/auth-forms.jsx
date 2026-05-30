"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { LockKeyhole, UserPlus } from "lucide-react";
import { useToast } from "@/components/toast";

export function FormularioLogin() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { exibirToast } = useToast();
  const [formulario, setFormulario] = useState({ email: "", password: "" });
  const [carregando, setCarregando] = useState(false);
  const proximo = searchParams.get("next") || "/minha-conta";

  async function enviarFormulario(event) {
    event.preventDefault();
    if (carregando) return;
    setCarregando(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formulario),
      });
      const data = await response.json();
      if (!response.ok) {
        exibirToast(data.error || "Não foi possível entrar.");
        return;
      }
      window.dispatchEvent(new Event("auth-updated"));
      router.push(proximo);
    } finally {
      setCarregando(false);
    }
  }

  return (
    <form className="auth-card" onSubmit={enviarFormulario}>
      <h1>Entrar</h1>
      <label>Email<input type="email" required value={formulario.email} onChange={(e) => setFormulario({ ...formulario, email: e.target.value })} /></label>
      <label>Senha<input type="password" required value={formulario.password} onChange={(e) => setFormulario({ ...formulario, password: e.target.value })} /></label>
      <button className="button button-primary" type="submit" disabled={carregando}>
        <LockKeyhole size={18} /> {carregando ? "Entrando..." : "Entrar"}
      </button>
      <p>Ainda não tem conta? <Link href={`/cadastro?next=${encodeURIComponent(proximo)}`}>Cadastre-se</Link></p>
    </form>
  );
}

export function FormularioCadastro() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { exibirToast } = useToast();
  const proximo = searchParams.get("next") || "/minha-conta";
  const [formulario, setFormulario] = useState({
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

  function atualizarCampo(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  async function enviarFormulario(event) {
    event.preventDefault();
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formulario),
    });
    const data = await response.json();
    if (!response.ok) {
      exibirToast(data.error || "Não foi possível cadastrar.");
      return;
    }
    window.dispatchEvent(new Event("auth-updated"));
    router.push(proximo);
  }

  return (
    <form className="auth-card auth-card-wide" onSubmit={enviarFormulario}>
      <h1>Criar conta</h1>
      <div className="auth-grid">
        <label>Nome completo<input required value={formulario.fullName} onChange={(e) => atualizarCampo("fullName", e.target.value)} /></label>
        <label>Email<input type="email" required value={formulario.email} onChange={(e) => atualizarCampo("email", e.target.value)} /></label>
        <label>Senha<input type="password" required minLength={6} value={formulario.password} onChange={(e) => atualizarCampo("password", e.target.value)} /></label>
        <label>Telefone<input required value={formulario.phone} onChange={(e) => atualizarCampo("phone", e.target.value)} /></label>
        <label>CPF opcional<input value={formulario.cpf} onChange={(e) => atualizarCampo("cpf", e.target.value)} /></label>
        <label>CEP<input required value={formulario.cep} onChange={(e) => atualizarCampo("cep", e.target.value)} /></label>
        <label>Rua<input required value={formulario.street} onChange={(e) => atualizarCampo("street", e.target.value)} /></label>
        <label>Número<input required value={formulario.number} onChange={(e) => atualizarCampo("number", e.target.value)} /></label>
        <label>Complemento<input value={formulario.complement} onChange={(e) => atualizarCampo("complement", e.target.value)} /></label>
        <label>Bairro<input required value={formulario.neighborhood} onChange={(e) => atualizarCampo("neighborhood", e.target.value)} /></label>
        <label>Cidade<input required value={formulario.city} onChange={(e) => atualizarCampo("city", e.target.value)} /></label>
        <label>Estado<input required maxLength={2} value={formulario.state} onChange={(e) => atualizarCampo("state", e.target.value.toUpperCase())} /></label>
      </div>
      <button className="button button-primary" type="submit"><UserPlus size={18} /> Cadastrar</button>
      <p>Já tem conta? <Link href={`/login?next=${encodeURIComponent(proximo)}`}>Entrar</Link></p>
    </form>
  );
}

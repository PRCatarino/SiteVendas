"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

const duracaoOfertaSegundos = (2 * 24 * 60 * 60) + (15 * 60 * 60) + (34 * 60) + 42;
const chaveArmazenamentoOferta = "catarino_offer_ends_at";

function obterTempoRestante(totalSegundos) {
  const s = Math.max(0, totalSegundos);
  return [
    [Math.floor(s / 86400), "Dias"],
    [Math.floor((s % 86400) / 3600), "Horas"],
    [Math.floor((s % 3600) / 60), "Min"],
    [s % 60, "Seg"],
  ];
}

function lerFimOferta() {
  if (typeof window === "undefined") return Date.now() + duracaoOfertaSegundos * 1000;
  const salvo = Number(window.localStorage.getItem(chaveArmazenamentoOferta));
  const agora = Date.now();
  if (Number.isFinite(salvo) && salvo > agora) return salvo;
  const proximo = agora + duracaoOfertaSegundos * 1000;
  window.localStorage.setItem(chaveArmazenamentoOferta, String(proximo));
  return proximo;
}

export function SecoesConfiancaHome() {
  const [segundosRestantes, setSegundosRestantes] = useState(duracaoOfertaSegundos);

  useEffect(() => {
    function atualizar() {
      const terminaEm = lerFimOferta();
      const restante = Math.ceil((terminaEm - Date.now()) / 1000);
      if (restante <= 0) {
        const proximo = Date.now() + duracaoOfertaSegundos * 1000;
        window.localStorage.setItem(chaveArmazenamentoOferta, String(proximo));
        setSegundosRestantes(duracaoOfertaSegundos);
        return;
      }
      setSegundosRestantes(restante);
    }
    atualizar();
    const timer = window.setInterval(atualizar, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const contagem = useMemo(() => obterTempoRestante(segundosRestantes), [segundosRestantes]);

  return (
    <section className="conversion container" aria-label="Ofertas e depoimentos">
      <article className="weekly-offer">
        <h2>Ofertas da semana</h2>
        <p>Descontos especiais por tempo limitado.</p>
        <div className="offer-timer" aria-label="Contagem regressiva">
          {contagem.map(([valor, rotulo]) => (
            <span key={rotulo}>
              <strong>{String(valor).padStart(2, "0")}</strong>
              {rotulo}
            </span>
          ))}
        </div>
        <Link className="offer-btn" href="/produtos?ofertas=true">
          Aproveitar ofertas
        </Link>
      </article>

      <article className="review-card">
        <h2>O que nossos clientes dizem</h2>
        <div className="review-score">
          ★★★★★ <strong>4,9/5</strong>
        </div>
        <p>Produtos de excelente qualidade e entrega muito rapida. Loja confiavel, recomendo!</p>
        <strong>Carlos M.</strong>
      </article>
    </section>
  );
}

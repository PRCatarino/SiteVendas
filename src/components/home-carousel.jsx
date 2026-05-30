/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const slidesCarrossel = [
  { src: "/banners/banner-1.png", href: "/produtos", label: "Ferramentas profissionais" },
  { src: "/banners/banner-2.png", href: "/produtos?ofertas=true", label: "Ofertas da semana" },
  { src: "/banners/banner-3.png", href: "/produtos", label: "Qualidade e durabilidade" },
];

export function CarrosselHome() {
  const [ativo, setAtivo] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setAtivo((atual) => (atual + 1) % slidesCarrossel.length);
    }, 5500);
    return () => window.clearInterval(timer);
  }, []);

  function irPara(indice) {
    setAtivo((indice + slidesCarrossel.length) % slidesCarrossel.length);
  }

  return (
    <section className="hero-slider" aria-label="Destaques da loja">
      <div className="slides">
        {slidesCarrossel.map((slide, i) => (
          <article key={slide.src} className={`slide${i === ativo ? " active" : ""}`}>
            <Link href={slide.href} style={{ display: "block", width: "100%", height: "100%" }}>
              <img src={slide.src} alt={slide.label} />
            </Link>
          </article>
        ))}
      </div>

      <button className="slider-btn prev" type="button" onClick={() => irPara(ativo - 1)} aria-label="Banner anterior">
        &#8249;
      </button>
      <button className="slider-btn next" type="button" onClick={() => irPara(ativo + 1)} aria-label="Proximo banner">
        &#8250;
      </button>

      <div className="dots" aria-label="Selecionar banner">
        {slidesCarrossel.map((slide, i) => (
          <button
            key={slide.src}
            className={i === ativo ? "active" : ""}
            type="button"
            onClick={() => irPara(i)}
            aria-label={`Banner ${i + 1}`}
            aria-current={i === ativo}
          />
        ))}
      </div>
    </section>
  );
}

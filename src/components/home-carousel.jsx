"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { ChevronRight } from "lucide-react";

const slides = [
  {
    title: "Qualidade que você pode confiar",
    text: "Ferramentas profissionais para quem exige desempenho, segurança e durabilidade.",
    image: "/products/hero-tools.svg",
    href: "/produto/furadeira-de-impacto-650w",
  },
  {
    title: "Kits completos para sua oficina",
    text: "Organização, resistência e peças essenciais para o trabalho render mais.",
    image: "/products/hero-kit.svg",
    href: "/produto/kit-oficina-150-pecas",
  },
  {
    title: "Precisão em cada detalhe",
    text: "Chaves, alicates e instrumentos de medição com padrão profissional.",
    image: "/products/hero-measure.svg",
    href: "/produto/jogo-de-chaves-de-fenda-6-pecas",
  },
];

export function HomeCarousel() {
  const [active, setActive] = useState(0);
  const slide = slides[active];

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setActive((current) => (current + 1) % slides.length);
    }, 3000);
    return () => window.clearTimeout(timer);
  }, [active]);

  return (
    <section className="hero-carousel" aria-label="Destaques da loja">
      <div className="container hero-slide" key={slide.title}>
        <div className="hero-copy">
          <h1>{slide.title}</h1>
          <p>{slide.text}</p>
          <Link className="button button-primary hero-button" href={slide.href}>
            Comprar agora <ChevronRight size={21} />
          </Link>
        </div>
        <div className="hero-product" aria-hidden="true">
          <Image src={slide.image} alt="" width={900} height={650} priority />
        </div>
      </div>
      <div className="carousel-dots" aria-label="Selecionar destaque">
        {slides.map((item, index) => (
          <button
            key={item.title}
            className={index === active ? "active" : ""}
            type="button"
            onClick={() => setActive(index)}
            aria-label={`Ver destaque ${index + 1}`}
          />
        ))}
      </div>
    </section>
  );
}

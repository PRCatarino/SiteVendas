/* eslint-disable @next/next/no-img-element */
import Image from "next/image";

export function ImagemProduto({ product, src, className = "", large = false }) {
  const srcImagem = src || product?.image_url || `/products/${product?.image_key || "hammer"}.svg`;
  const rotulo = product?.name || "Imagem do produto";
  const remota = /^https?:\/\//i.test(srcImagem);

  return (
    <div className={`product-photo ${large ? "product-photo-large" : ""} ${className}`}>
      {remota ? <img src={srcImagem} alt={rotulo} /> : <Image src={srcImagem} alt={rotulo} width={900} height={650} />}
    </div>
  );
}

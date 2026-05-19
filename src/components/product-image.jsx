import Image from "next/image";

export function ProductImage({ product, src, className = "", large = false }) {
  const imageSrc = src || product?.image_url || `/products/${product?.image_key || "hammer"}.svg`;
  const label = product?.name || "Imagem do produto";

  return (
    <div className={`product-photo ${large ? "product-photo-large" : ""} ${className}`}>
      <Image src={imageSrc} alt={label} width={900} height={650} />
    </div>
  );
}

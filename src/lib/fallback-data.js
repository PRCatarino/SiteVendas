export const produtosFallback = [];

export const cuponsFallback = [
  {
    code: "PRIME10",
    description: "10% de desconto em ferramentas Catarino Prime",
    type: "percent",
    value: 10,
    min_total: 100,
    active: true,
  },
  {
    code: "FRETE199",
    description: "Frete gratis acima de R$199,00",
    type: "fixed",
    value: 0,
    min_total: 199,
    active: true,
  },
];

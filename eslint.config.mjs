import nextVitals from "eslint-config-next/core-web-vitals";

const config = [
  {
    ignores: [".next/**", ".open-next/**", ".wrangler/**", "node_modules/**", "public/**"],
  },
  ...nextVitals,
];

export default config;

# Catarino Prime Ferramentas

Loja funcional em Next.js com PostgreSQL. As imagens de `modelo` foram usadas como referência visual e como sprites de produtos, sem transformar a página em uma imagem estática.

## Rodar o projeto

```bash
npm install
copy .env.example .env
docker compose up -d
npm run db:init
npm run dev
```

Abra `http://localhost:3000`.

## Banco de dados

O PostgreSQL usa a variável `DATABASE_URL`:

```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/catarino_prime"
PGSSL="false"
```

O schema e os dados iniciais ficam em:

- `database/schema.sql`
- `database/seed.sql`

## Funcionalidades

- Home, produto e carrinho em Next.js.
- Produtos, usuários, endereços, cupons, carrinhos e pedidos modelados para PostgreSQL.
- Carrinho persistido por cookie.
- Login e cadastro com senha criptografada e sessão HTTP-only.
- Cálculo de frete.
- Cupom `PRIME10`.
- Finalização de pedido exige login e grava em `orders` e `order_items`.

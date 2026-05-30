# Catarino Prime Ferramentas

Loja funcional em Next.js com PostgreSQL, Mercado Pago e esteira de importacao de produtos por links/CSV para dropshipping sem depender da API oficial do AliExpress.

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

O PostgreSQL usa a variavel `DATABASE_URL`:

```env
DATABASE_URL="postgres://postgres:postgres@localhost:5432/catarino_prime"
PGSSL="false"
ADMIN_EMAILS="seu-email@dominio.com"
```

O schema e os dados iniciais ficam em:

- `database/schema.sql`
- `database/seed.sql`

## Funcionalidades

- Home, produto e carrinho em Next.js.
- Catalogo inicial com 20 produtos de ferramentas.
- Produtos, usuarios, enderecos, cupons, carrinhos e pedidos modelados para PostgreSQL.
- Carrinho persistido por cookie.
- Login e cadastro com senha criptografada e sessao HTTP-only.
- Calculo de frete.
- Cupom `PRIME10`.
- Finalizacao de pedido exige login e grava em `orders` e `order_items`.
- Admin protegido por `ADMIN_EMAILS` em `/admin/aliexpress`.
- Importa produtos por links/CSV, tenta puxar dados do fornecedor e baixa imagens para `public/products/imported`.
- Produtos importados entram em revisao e precisam ser publicados antes de aparecer na loja.

## Deploy Cloudflare

O projeto esta preparado para Cloudflare Workers com OpenNext:

```bash
npm run build:cloudflare
npm run deploy:cloudflare
```

Arquivos principais:

- `open-next.config.ts`
- `wrangler.jsonc`

Para usar `catarinoprime.com.br`, adicione o dominio na Cloudflare primeiro. Quando a Cloudflare mostrar os dois nameservers, coloque-os no Registro.br em `Alterar servidores DNS`. Depois que a zona estiver ativa, descomente o bloco `routes` em `wrangler.jsonc` e rode `npm run deploy:cloudflare` novamente.

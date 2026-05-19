insert into products
  (id, slug, name, brand, category, sku, code, description, price, stock, rating, review_count, image_key, is_featured, is_kit, specs)
values
  (
    'hammer',
    'martelo-unha-27mm-cabo-fibra',
    'Martelo Unha 27mm Cabo Fibra',
    'Catarino Prime',
    'Martelos',
    'MT2701',
    '7891234567890',
    'Martelo profissional com cabo em fibra, cabeça polida e pegada emborrachada para uso intenso.',
    49.90,
    42,
    5.0,
    128,
    'hammer',
    true,
    false,
    '["Cabeça em aço carbono", "Cabo de fibra emborrachado", "Balanceamento profissional"]'::jsonb
  ),
  (
    'screwdrivers',
    'jogo-de-chaves-de-fenda-6-pecas',
    'Jogo de Chaves de Fenda 6 Peças',
    'Catarino Prime',
    'Chaves',
    'CV0602',
    '7891234567891',
    'Kit com seis chaves de fenda para manutenção doméstica e profissional.',
    59.90,
    38,
    5.0,
    96,
    'screwdrivers',
    true,
    false,
    '["Pontas imantadas", "Cabos anatômicos", "Aço cromo vanádio"]'::jsonb
  ),
  (
    'pliers',
    'alicate-universal-8-isolado',
    'Alicate Universal 8" Isolado',
    'Catarino Prime',
    'Alicates',
    'AL0803',
    '7891234567894',
    'Alicate universal com isolamento e corte preciso para trabalhos elétricos e mecânicos.',
    39.90,
    31,
    5.0,
    87,
    'pliers',
    true,
    false,
    '["Isolamento de segurança", "Corte lateral reforçado", "Pegada ergonômica"]'::jsonb
  ),
  (
    'wrench',
    'chave-ajustavel-10-profissional',
    'Chave Ajustável 10" Profissional',
    'Catarino Prime',
    'Chaves',
    'CA1004',
    '7891234567895',
    'Chave ajustável profissional com abertura precisa e acabamento resistente.',
    64.90,
    26,
    5.0,
    74,
    'wrench',
    true,
    false,
    '["Abertura milimétrica", "Acabamento fosfatizado", "Uso profissional"]'::jsonb
  ),
  (
    'tape',
    'trena-emborrachada-5m-x-19mm',
    'Trena Emborrachada 5m x 19mm',
    'Catarino Prime',
    'Medição',
    'TR0505',
    '7891234567892',
    'Trena compacta de 5 metros com caixa emborrachada e trava de lâmina.',
    29.90,
    60,
    5.0,
    112,
    'tape',
    true,
    false,
    '["Lâmina de 19mm", "Trava lateral", "Caixa emborrachada"]'::jsonb
  ),
  (
    'sockets',
    'jogo-de-soquetes-40-pecas-com-catraca',
    'Jogo de Soquetes 40 Peças com Catraca',
    'Catarino Prime',
    'Kits',
    'SQ4006',
    '7891234567896',
    'Jogo completo de soquetes com catraca e maleta organizadora.',
    299.90,
    18,
    5.0,
    65,
    'sockets',
    true,
    false,
    '["40 peças", "Catraca reversível", "Maleta rígida"]'::jsonb
  ),
  (
    'drill',
    'furadeira-de-impacto-650w',
    'Furadeira de Impacto 650W',
    'Catarino Prime',
    'Ferramentas Elétricas',
    'FP650I',
    '7891234567893',
    'A Furadeira de Impacto 650W Catarino Prime combina potência, eficiência e durabilidade para facilitar qualquer tipo de trabalho. Seu motor de alta performance oferece perfurações rápidas e precisas em diferentes materiais, enquanto o design ergonômico garante mais conforto e controle durante o uso.',
    259.90,
    22,
    5.0,
    128,
    'drill',
    false,
    false,
    '["Potência: 650W", "Impactos por minuto: 0 - 48.000 ipm", "Rotação: 0 - 2.800 rpm", "Mandril de 13mm com chave", "Função impacto com e sem impacto", "Cabo de 2 metros"]'::jsonb
  ),
  (
    'kit110',
    'kit-ferramentas-110-pecas',
    'Kit Ferramentas 110 Peças',
    'Catarino Prime',
    'Kits',
    'KT1107',
    '7891234567897',
    'Kit completo para qualquer desafio, com peças organizadas em maleta reforçada.',
    259.90,
    15,
    5.0,
    44,
    'kit110',
    false,
    true,
    '["110 peças", "Maleta organizadora", "Uso residencial e profissional"]'::jsonb
  ),
  (
    'kit85',
    'kit-manutencao-85-pecas',
    'Kit Manutenção 85 Peças',
    'Catarino Prime',
    'Kits',
    'KT8508',
    '7891234567898',
    'Kit ideal para manutenção residencial e profissional com peças essenciais.',
    189.90,
    20,
    5.0,
    52,
    'kit85',
    false,
    true,
    '["85 peças", "Chaves e soquetes", "Organização compacta"]'::jsonb
  ),
  (
    'kit150',
    'kit-oficina-150-pecas',
    'Kit Oficina 150 Peças',
    'Catarino Prime',
    'Kits',
    'KT1509',
    '7891234567899',
    'Kit de oficina com performance e organização para rotinas exigentes.',
    349.90,
    12,
    5.0,
    37,
    'kit150',
    false,
    true,
    '["150 peças", "Soquetes, pontas e chaves", "Maleta rígida"]'::jsonb
  )
on conflict (id) do update set
  slug = excluded.slug,
  name = excluded.name,
  brand = excluded.brand,
  category = excluded.category,
  sku = excluded.sku,
  code = excluded.code,
  description = excluded.description,
  price = excluded.price,
  stock = excluded.stock,
  rating = excluded.rating,
  review_count = excluded.review_count,
  image_key = excluded.image_key,
  is_featured = excluded.is_featured,
  is_kit = excluded.is_kit,
  specs = excluded.specs;

update products set
  image_url = '/products/hammer.jpg',
  gallery_images = '["/products/hammer.jpg", "/products/kit110.svg", "/products/wrench.svg"]'::jsonb
where id = 'hammer';

update products set
  image_url = '/products/screwdrivers.jpg',
  gallery_images = '["/products/screwdrivers.jpg", "/products/kit150.svg", "/products/sockets.svg"]'::jsonb
where id = 'screwdrivers';

update products set
  image_url = '/products/pliers.svg',
  gallery_images = '["/products/pliers.svg", "/products/wrench.svg", "/products/kit85.jpg"]'::jsonb
where id = 'pliers';

update products set
  image_url = '/products/wrench.svg',
  gallery_images = '["/products/wrench.svg", "/products/pliers.svg", "/products/kit85.jpg"]'::jsonb
where id = 'wrench';

update products set
  image_url = '/products/tape.svg',
  gallery_images = '["/products/tape.svg", "/products/hammer.jpg", "/products/kit110.svg"]'::jsonb
where id = 'tape';

update products set
  image_url = '/products/sockets.svg',
  gallery_images = '["/products/sockets.svg", "/products/kit85.jpg", "/products/kit150.svg"]'::jsonb
where id = 'sockets';

update products set
  image_url = '/products/drill.svg',
  gallery_images = '["/products/drill.svg", "/products/drill-detail.svg", "/products/drill-case.svg", "/products/kit85.jpg"]'::jsonb
where id = 'drill';

update products set
  image_url = '/products/kit110.svg',
  gallery_images = '["/products/kit110.svg", "/products/hammer.jpg", "/products/screwdrivers.jpg"]'::jsonb
where id = 'kit110';

update products set
  image_url = '/products/kit85.jpg',
  gallery_images = '["/products/kit85.jpg", "/products/sockets.svg", "/products/pliers.svg"]'::jsonb
where id = 'kit85';

update products set
  image_url = '/products/kit150.svg',
  gallery_images = '["/products/kit150.svg", "/products/sockets.svg", "/products/screwdrivers.jpg"]'::jsonb
where id = 'kit150';

insert into coupons (code, description, type, value, min_total, active)
values
  ('PRIME10', '10% de desconto em ferramentas Catarino Prime', 'percent', 10, 100, true),
  ('FRETE199', 'Frete grátis acima de R$199,00', 'fixed', 0, 199, true)
on conflict (code) do update set
  description = excluded.description,
  type = excluded.type,
  value = excluded.value,
  min_total = excluded.min_total,
  active = excluded.active;

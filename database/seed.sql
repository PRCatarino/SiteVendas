insert into products
  (
    id, slug, name, brand, category, sku, code, description, price, stock, rating, review_count,
    image_key, image_url, gallery_images, is_featured, is_kit, specs, source, supplier_cost,
    supplier_currency, markup_percent, sync_status, product_status
  )
values
  ('drill-driver-21v','parafusadeira-furadeira-21v-com-maleta','Parafusadeira Furadeira 21V com Maleta','Catarino Prime','Ferramentas Eletricas','FE2101','CP-FE2101','Parafusadeira e furadeira sem fio para montagem, manutencao e uso residencial intenso.',199.90,25,5.0,142,'drillDriver','/assets-site/13_produto_parafusadeira.png','["/assets-site/13_produto_parafusadeira.png"]'::jsonb,true,false,'["Bateria recarregavel","Controle de torque","Maleta de transporte"]'::jsonb,'curated',142.79,'BRL',40,'published','published'),
  ('impact-drill-650w','furadeira-de-impacto-650w','Furadeira de Impacto 650W','Catarino Prime','Ferramentas Eletricas','FE6502','CP-FE6502','Furadeira de impacto para madeira, metal e alvenaria leve, com pegada firme e chave de mandril.',159.90,22,5.0,128,'impactDrill','/assets-site/14_produto_furadeira_impacto.png','["/assets-site/14_produto_furadeira_impacto.png"]'::jsonb,true,false,'["Potencia 650W","Funcao impacto","Mandril de 13mm"]'::jsonb,'curated',114.21,'BRL',40,'published','published'),
  ('kit-tools-110','kit-ferramentas-110-pecas','Kit Ferramentas 110 Pecas com Maleta','Catarino Prime','Kits','KT1103','CP-KT1103','Kit completo para reparos domesticos, instalacao de moveis e pequenas manutencoes.',259.90,18,5.0,96,'kit110','/assets-site/15_produto_kit_110_pecas.png','["/assets-site/15_produto_kit_110_pecas.png"]'::jsonb,true,true,'["110 pecas","Maleta organizadora","Uso residencial e profissional"]'::jsonb,'curated',185.64,'BRL',40,'published','published'),
  ('kit-tools-150','kit-oficina-150-pecas','Kit Oficina 150 Pecas','Catarino Prime','Kits','KT1504','CP-KT1504','Maleta robusta com soquetes, pontas, chaves e acessorios para oficina e casa.',349.90,14,5.0,83,'kit150','/assets-site/16_produto_kit_oficina_150_pecas.png','["/assets-site/16_produto_kit_oficina_150_pecas.png"]'::jsonb,true,true,'["150 pecas","Soquetes e bits","Maleta rigida"]'::jsonb,'curated',249.93,'BRL',40,'published','published'),
  ('socket-set-46','jogo-de-soquetes-46-pecas','Jogo de Soquetes 46 Pecas com Catraca','Catarino Prime','Kits','SQ4605','CP-SQ4605','Jogo compacto de soquetes com catraca reversivel para manutencao mecanica e montagem.',89.90,30,5.0,71,'sockets','/assets-site/17_produto_soquetes_46_pecas.png','["/assets-site/17_produto_soquetes_46_pecas.png"]'::jsonb,true,true,'["46 pecas","Catraca reversivel","Encaixe compacto"]'::jsonb,'curated',64.21,'BRL',40,'published','published'),
  ('precision-screwdriver-115','kit-chave-precisao-115-pecas','Kit Chaves de Precisao 115 Pecas','Catarino Prime','Chaves','CV1156','CP-CV1156','Kit de precisao para celular, notebook, console, oculos e eletronicos em geral.',69.90,42,5.0,119,'screwdrivers','/products/screwdrivers.jpg','["/products/screwdrivers.jpg","/products/sockets.svg","/products/kit150.svg"]'::jsonb,true,false,'["115 pecas","Pontas magneticas","Estojo compacto"]'::jsonb,'curated',49.93,'BRL',40,'published','published'),
  ('crimping-plier-kit','alicate-crimpador-com-terminais','Alicate Crimpador com Kit de Terminais','Catarino Prime','Alicates','ALC707','CP-ALC707','Alicate para crimpar terminais eletricos, ideal para reparos automotivos e instalacoes.',79.90,28,5.0,64,'pliers','/products/pliers.svg','["/products/pliers.svg","/products/wrench.svg","/products/kit85.jpg"]'::jsonb,true,false,'["Crimpagem firme","Kit de terminais","Cabo ergonomico"]'::jsonb,'curated',57.07,'BRL',40,'published','published'),
  ('digital-multimeter-pro','multimetro-digital-portatil','Multimetro Digital Portatil','Catarino Prime','Medicao','MD8308','CP-MD8308','Multimetro para medir tensao, corrente, resistencia e continuidade em trabalhos eletricos.',59.90,40,5.0,88,'tape','/products/tape.svg','["/products/tape.svg","/products/drill.svg","/products/pliers.svg"]'::jsonb,true,false,'["Display digital","Teste de continuidade","Uso residencial e tecnico"]'::jsonb,'curated',42.79,'BRL',40,'published','published'),
  ('laser-tape-40m','trena-profissional-5m-x-25mm','Trena Profissional 5m x 25mm','Catarino Prime','Medicao','TL4009','CP-TL4009','Trena emborrachada para medicao rapida em obras, reformas, marcenaria e instalacoes.',39.90,24,5.0,64,'tapePro','/assets-site/18_produto_trena_profissional.png','["/assets-site/18_produto_trena_profissional.png"]'::jsonb,true,false,'["Fita de 5 metros","Corpo emborrachado","Trava de seguranca"]'::jsonb,'curated',28.50,'BRL',40,'published','published'),
  ('green-laser-level','nivel-laser-verde-360','Nivel Laser Verde 360 Graus','Catarino Prime','Medicao','NL36010','CP-NL36010','Nivel laser para alinhar pisos, quadros, prateleiras, revestimentos e instalacoes.',169.90,16,5.0,47,'tape','/products/tape.svg','["/products/tape.svg","/products/kit110.svg","/products/drill.svg"]'::jsonb,true,false,'["Linha verde visivel","Base ajustavel","Nivelamento pratico"]'::jsonb,'curated',121.36,'BRL',40,'published','published'),
  ('rotary-tool-kit','mini-retifica-com-acessorios','Mini Retifica com Acessorios','Catarino Prime','Ferramentas Eletricas','MR12011','CP-MR12011','Ferramenta rotativa para corte, lixamento, gravacao e acabamento em pequenos projetos.',139.90,20,5.0,61,'drill','/products/drill.svg','["/products/drill.svg","/products/sockets.svg","/products/screwdrivers.jpg"]'::jsonb,false,false,'["Velocidade ajustavel","Acessorios inclusos","Uso em acabamento"]'::jsonb,'curated',99.93,'BRL',40,'published','published'),
  ('soldering-station-60w','estacao-de-solda-60w','Estacao de Solda 60W','Catarino Prime','Solda','SD6012','CP-SD6012','Estacao de solda compacta para reparos eletronicos, fios, conectores e placas simples.',119.90,18,5.0,69,'screwdrivers','/products/screwdrivers.jpg','["/products/screwdrivers.jpg","/products/pliers.svg","/products/tape.svg"]'::jsonb,false,false,'["Controle de temperatura","Ponta substituivel","Aquecimento rapido"]'::jsonb,'curated',85.64,'BRL',40,'published','published'),
  ('titanium-drill-bit-set','kit-brocas-titanio-99-pecas','Kit Brocas Titanio 99 Pecas','Catarino Prime','Acessorios','BR9913','CP-BR9913','Kit de brocas e pontas para madeira, metal e manutencao geral.',49.90,35,5.0,77,'sockets','/products/sockets.svg','["/products/sockets.svg","/products/drill.svg","/products/kit150.svg"]'::jsonb,false,false,'["99 pecas","Estojo organizador","Brocas variadas"]'::jsonb,'curated',35.64,'BRL',40,'published','published'),
  ('magnetic-bit-set-50','jogo-bits-magneticos-50-pecas','Jogo de Bits Magneticos 50 Pecas','Catarino Prime','Acessorios','BT5014','CP-BT5014','Conjunto de bits magneticos para parafusadeiras e trabalhos de montagem.',39.90,50,5.0,102,'screwdrivers','/products/screwdrivers.jpg','["/products/screwdrivers.jpg","/products/drill.svg","/products/sockets.svg"]'::jsonb,false,false,'["50 pecas","Pontas magneticas","Estojo compacto"]'::jsonb,'curated',28.50,'BRL',40,'published','published'),
  ('wall-scanner-detector','detector-de-parede-3-em-1','Detector de Parede 3 em 1','Catarino Prime','Medicao','DP3015','CP-DP3015','Detector para localizar metais, madeira e fios antes de furar paredes.',99.90,18,5.0,46,'tape','/products/tape.svg','["/products/tape.svg","/products/drill.svg","/products/hammer.jpg"]'::jsonb,false,false,'["Detecta metal e fios","Alerta visual","Evita furos errados"]'::jsonb,'curated',71.36,'BRL',40,'published','published'),
  ('portable-air-compressor','compressor-de-ar-portatil-digital','Compressor de Ar Portatil Digital','Catarino Prime','Ferramentas Eletricas','CPD016','CP-CPD016','Calibrador portatil para pneus, bicicletas, motos, bolas e emergencias no carro.',179.90,15,5.0,53,'drill','/products/drill.svg','["/products/drill.svg","/products/kit85.jpg","/products/tape.svg"]'::jsonb,false,false,'["Display digital","Desligamento automatico","Uso automotivo"]'::jsonb,'curated',128.50,'BRL',40,'published','published'),
  ('staple-gun-3in1','grampeador-manual-3-em-1','Grampeador Manual 3 em 1','Catarino Prime','Acessorios','GM3017','CP-GM3017','Grampeador manual para tapeceiro, marcenaria leve, artesanato e fixacoes rapidas.',69.90,24,5.0,38,'hammer','/products/hammer.jpg','["/products/hammer.jpg","/products/wrench.svg","/products/pliers.svg"]'::jsonb,false,false,'["3 tipos de grampo","Regulagem de pressao","Corpo reforcado"]'::jsonb,'curated',49.93,'BRL',40,'published','published'),
  ('rivet-gun-kit','rebitador-manual-com-rebites','Rebitador Manual com Rebites','Catarino Prime','Alicates','RB4018','CP-RB4018','Rebitador para fixar chapas, suportes e pecas metalicas com rapidez.',74.90,21,5.0,42,'pliers','/products/pliers.svg','["/products/pliers.svg","/products/wrench.svg","/products/hammer.jpg"]'::jsonb,false,false,'["Bicos intercambiaveis","Rebites inclusos","Cabo emborrachado"]'::jsonb,'curated',53.50,'BRL',40,'published','published'),
  ('parts-organizer-case','maleta-organizadora-de-pecas','Maleta Organizadora de Pecas','Catarino Prime','Acessorios','MO2419','CP-MO2419','Organizador para parafusos, buchas, bits, brocas, terminais e pecas pequenas.',59.90,36,5.0,57,'kit85','/products/kit85.jpg','["/products/kit85.jpg","/products/sockets.svg","/products/screwdrivers.jpg"]'::jsonb,false,false,'["Divisorias internas","Fecho seguro","Leve e resistente"]'::jsonb,'curated',42.79,'BRL',40,'published','published'),
  ('home-maintenance-kit-85','kit-manutencao-residencial-85-pecas','Kit Manutencao Residencial 85 Pecas','Catarino Prime','Kits','KT8520','CP-KT8520','Kit essencial para casa com chaves, alicate, trena, martelo e acessorios.',189.90,20,5.0,73,'kit85','/products/kit85.jpg','["/products/kit85.jpg","/products/hammer.jpg","/products/pliers.svg"]'::jsonb,false,true,'["85 pecas","Ferramentas essenciais","Maleta compacta"]'::jsonb,'curated',135.64,'BRL',40,'published','published')
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
  image_url = excluded.image_url,
  gallery_images = excluded.gallery_images,
  is_featured = excluded.is_featured,
  is_kit = excluded.is_kit,
  specs = excluded.specs,
  source = excluded.source,
  supplier_cost = excluded.supplier_cost,
  supplier_currency = excluded.supplier_currency,
  markup_percent = excluded.markup_percent,
  sync_status = excluded.sync_status,
  product_status = excluded.product_status;

insert into coupons (code, description, type, value, min_total, active)
values
  ('PRIME10', '10% de desconto em ferramentas Catarino Prime', 'percent', 10, 100, true),
  ('FRETE199', 'Frete gratis acima de R$199,00', 'fixed', 0, 199, true)
on conflict (code) do update set
  description = excluded.description,
  type = excluded.type,
  value = excluded.value,
  min_total = excluded.min_total,
  active = excluded.active;

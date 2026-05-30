"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Bookmark, CheckCircle2, DollarSign, EyeOff, FileUp, RefreshCw, Save, Trash2, UploadCloud, Video, X } from "lucide-react";
import { formatarDinheiro } from "@/lib/format";

const BOOKMARKLET = `javascript:(function(){try{
var t=(document.querySelector('[data-pl="product-title"]')||document.querySelector('h1[class*="title"]')||document.querySelector('[class*="product-title"]'))?.textContent?.trim()||document.title.replace(/\\s*[-|]\\s*AliExpress.*/i,'').trim();
var price='';
var priceSelectors=['[class*="price-default--current"]','[class*="price--current"]','[class*="uniform-banner-box-price"]','[class*="pdp-comp-price"] [class*="current"]','[class*="activityPrice"]','[class*="sale-price"]','[class*="priceText"]','[itemprop=price]'];
for(var si=0;si<priceSelectors.length;si++){var pe=document.querySelector(priceSelectors[si]);if(pe&&pe.textContent.includes('R$')){price=pe.textContent;break;}}
if(!price){var els=document.querySelectorAll('*');for(var ei=0;ei<els.length;ei++){if(els[ei].children.length===0){var tx=els[ei].textContent.trim();if(/^R\\$[\\s\\d,\\.]+$/.test(tx)){price=tx;break;}}}}
price=price.replace(/[^0-9,]/g,'').replace(',','.');
var seen={};var imgs=[];
document.querySelectorAll('[class*=thumb] img,[class*=slide] img,[class*=Thumbnail] img,[class*=ImageShow] img,[class*=SquareImage] img').forEach(function(i){var s=(i.src||i.getAttribute('data-src')||'').replace(/_\\d+x\\d+q\\d+\\.[a-z]+_\\.[a-z]+$/,'').replace(/\\?has_lang[^"']*/,'').replace(/\\?.*$/,'');if(s&&/^https/.test(s)&&/alicdn|aliexpress-media/.test(s)&&!seen[s]){seen[s]=1;imgs.push(s);}});
var video='';
try{var rp=window.runParams||window.pageConfig;video=rp?.data?.videoComponent?.videoUrl||rp?.videoComponent?.videoUrl||'';}catch(e){}
if(!video){document.querySelectorAll('video').forEach(function(v){if(!video){var s=v.src||v.currentSrc||v.getAttribute('data-src')||'';if(s&&/^https/.test(s))video=s;}});}
var url='https://catarinoprime.com.br/admin/aliexpress?pf=1&name='+encodeURIComponent(t)+'&cost='+encodeURIComponent(price)+'&imgs='+encodeURIComponent(imgs.slice(0,6).join('\\n'))+'&src='+encodeURIComponent(location.href)+'&video='+encodeURIComponent(video);
window.open(url,'_blank');
}catch(e){alert('Erro: '+e.message);}})();`;

const DEFAULT_FORMULARIO = {
  productInput: "",
  markupPercent: 40,
  name: "",
  cost: "",
  imagesRaw: "",
  description: "",
  category: "Ferramentas Eletricas",
  videoUrl: "",
};

function criarProdutoManualId() {
  return `manual-${Date.now()}`;
}

export function AdminAliExpress({ initialProducts, initialOrders }) {
  const searchParams = useSearchParams();
  const temPrefill = searchParams.get("pf") === "1";
  const [produtos, setProdutos] = useState(initialProducts);
  const [mensagem, setMensagem] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [editandoPreco, setEditandoPreco] = useState(null);
  const [formPreco, setFormPreco] = useState({ supplierCost: "", markupPercent: 40 });
  const [editandoVideo, setEditandoVideo] = useState(null);
  const [formVideo, setFormVideo] = useState({ url: "" });
  const [importacaoLink, setImportacaoLink] = useState({
    input: "",
    markupPercent: 40,
  });
  const [formulario, setFormulario] = useState(() => (
    temPrefill
      ? {
        ...DEFAULT_FORMULARIO,
        name: searchParams.get("name") || "",
        cost: searchParams.get("cost") || "",
        imagesRaw: searchParams.get("imgs") || "",
        productInput: searchParams.get("src") || "",
        videoUrl: searchParams.get("video") || "",
      }
      : DEFAULT_FORMULARIO
  ));

  useEffect(() => {
    if (temPrefill) {
      window.history.replaceState({}, "", "/admin/aliexpress");
    }
  }, [temPrefill]);

  function atualizarCampo(campo, valor) {
    setFormulario((atual) => ({ ...atual, [campo]: valor }));
  }

  function atualizarImportacaoLink(campo, valor) {
    setImportacaoLink((atual) => ({ ...atual, [campo]: valor }));
  }

  async function lerArquivo(event) {
    const arquivo = event.target.files?.[0];
    if (!arquivo) return;
    atualizarImportacaoLink("input", await arquivo.text());
  }

  async function importarLinks(event) {
    event.preventDefault();
    setCarregando(true);
    setMensagem("");

    const response = await fetch("/api/admin/products/import-links", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        input: importacaoLink.input,
        markupPercent: Number(importacaoLink.markupPercent || 40),
      }),
    });
    const data = await response.json();
    setCarregando(false);

    if (!response.ok) {
      setMensagem(data.error || "Nao foi possivel importar os links.");
      return;
    }

    setProdutos((atual) => [
      ...data.products,
      ...atual.filter((produto) => !data.products.some((entry) => entry.id === produto.id)),
    ]);
    setMensagem(`${data.products.length} produto(s) importado(s) para revisao.`);
  }

  const precoVenda = (() => {
    const custo = Number(formulario.cost || 0);
    const margem = Number(formulario.markupPercent || 0);
    return custo > 0 ? Math.round((custo * (1 + margem / 100)) * 100) / 100 : 0;
  })();

  const imagensArray = formulario.imagesRaw
    .split(/[\n,]+/)
    .map((u) => u.trim())
    .filter((u) => /^https?:\/\//i.test(u));

  async function importarProduto(event) {
    event.preventDefault();
    if (!formulario.name.trim()) { setMensagem("Informe o nome do produto."); return; }
    if (!formulario.cost || Number(formulario.cost) <= 0) { setMensagem("Informe o custo do fornecedor."); return; }
    setCarregando(true);
    setMensagem("");

    const response = await fetch("/api/admin/aliexpress/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productInput: formulario.productInput || criarProdutoManualId(),
        manual: true,
        name: formulario.name,
        cost: Number(formulario.cost || 0),
        markupPercent: Number(formulario.markupPercent || 40),
        images: imagensArray,
        imageUrl: imagensArray[0] || "",
        description: formulario.description,
        category: formulario.category,
        videoUrl: formulario.videoUrl || "",
      }),
    });
    const data = await response.json();
    setCarregando(false);

    if (!response.ok) {
      setMensagem(data.error || "Nao foi possivel salvar o produto.");
      return;
    }

    setProdutos((atual) => [data.product, ...atual.filter((produto) => produto.id !== data.product.id)]);
    setFormulario(DEFAULT_FORMULARIO);
    setMensagem("Produto salvo no catalogo para revisao.");
  }

  async function sincronizarProduto(produtoId) {
    setMensagem("");
    const response = await fetch(`/api/admin/aliexpress/products/${produtoId}/sync`, { method: "POST" });
    const data = await response.json();

    if (!response.ok) {
      setMensagem(data.error || "Nao foi possivel sincronizar.");
      return;
    }

    setProdutos((atual) => atual.map((produto) => (produto.id === produtoId ? data.product : produto)));
    setMensagem("Produto sincronizado.");
  }

  async function removerProduto(produtoId) {
    if (!window.confirm("Remover este produto permanentemente?")) return;
    setMensagem("");
    const response = await fetch(`/api/admin/products/${produtoId}`, { method: "DELETE" });
    if (!response.ok) {
      const data = await response.json();
      setMensagem(data.error || "Erro ao remover produto.");
      return;
    }
    setProdutos((atual) => atual.filter((p) => p.id !== produtoId));
    setMensagem("Produto removido.");
  }

  function abrirEditarPreco(produto) {
    setEditandoPreco(produto.id);
    setFormPreco({ supplierCost: produto.supplier_cost || "", markupPercent: produto.markup_percent || 40 });
  }

  async function salvarPreco(produtoId) {
    setMensagem("");
    const response = await fetch(`/api/admin/products/${produtoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ supplierCost: Number(formPreco.supplierCost || 0), markupPercent: Number(formPreco.markupPercent || 40) }),
    });
    const data = await response.json();
    if (!response.ok) { setMensagem(data.error || "Erro ao salvar preço."); return; }
    setProdutos((atual) => atual.map((p) => (p.id === produtoId ? data.product : p)));
    setEditandoPreco(null);
    setMensagem("Preço atualizado.");
  }

  function youtubeEmbedUrl(url) {
    const text = String(url || "").trim();
    const matchShort = text.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    const matchLong = text.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/);
    const id = matchShort?.[1] || matchLong?.[1];
    return id ? `https://www.youtube.com/embed/${id}` : text;
  }

  function youtubePoster(url) {
    const text = String(url || "").trim();
    const matchShort = text.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    const matchLong = text.match(/youtube\.com\/watch\?.*v=([a-zA-Z0-9_-]{11})/);
    const id = matchShort?.[1] || matchLong?.[1];
    return id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : "";
  }

  function abrirEditarVideo(produto) {
    setEditandoVideo(produto.id);
    const atual = produto.videos?.[0];
    setFormVideo({ url: atual?.url || "" });
  }

  async function salvarVideo(produtoId) {
    setMensagem("");
    const urlOriginal = formVideo.url.trim();
    const videos = urlOriginal
      ? [{ url: youtubeEmbedUrl(urlOriginal), poster: youtubePoster(urlOriginal) }]
      : [];
    const response = await fetch(`/api/admin/products/${produtoId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videos }),
    });
    const data = await response.json();
    if (!response.ok) { setMensagem(data.error || "Erro ao salvar vídeo."); return; }
    setProdutos((atual) => atual.map((p) => (p.id === produtoId ? data.product : p)));
    setEditandoVideo(null);
    setMensagem(videos.length ? "Vídeo salvo." : "Vídeo removido.");
  }

  async function definirPublicacao(produtoId, status) {
    setMensagem("");
    const response = await fetch(`/api/admin/products/${produtoId}/publication`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const data = await response.json();

    if (!response.ok) {
      setMensagem(data.error || "Nao foi possivel atualizar a publicacao.");
      return;
    }

    setProdutos((atual) => atual.map((produto) => (produto.id === produtoId ? data.product : produto)));
    setMensagem(status === "published" ? "Produto publicado na loja." : "Produto voltou para revisao.");
  }

  return (
    <main className="admin-main">
      <section className="container admin-heading">
        <div>
          <span>Catalogo real de drop</span>
          <h1>Produtos por link + Mercado Pago</h1>
        </div>
        <p>Importe links por planilha, revise os rascunhos e publique somente o que estiver pronto para vender.</p>
      </section>

      <section className="container admin-bookmarklet">
        <Bookmark size={16} />
        <strong>Importar do AliExpress com 1 clique:</strong>
        <span>Na página do produto no AliExpress, cole o código abaixo na barra de endereços e pressione Enter.</span>
        <button
          type="button"
          className="bookmarklet-btn"
          onClick={() => {
            navigator.clipboard.writeText(BOOKMARKLET).then(() => {
              setMensagem("Código copiado! Cole na barra de endereços do Chrome enquanto estiver na página do AliExpress.");
            });
          }}
        >
          <Bookmark size={14} /> Copiar código
        </button>
        <small>ou arraste para a barra de favoritos (Ctrl+Shift+B para mostrar)</small>
      </section>

      <section className="container admin-grid">
        <form className="admin-panel admin-form" onSubmit={importarLinks}>
          <h2>Importar planilha de links</h2>
          <label>
            CSV ou links, um por linha
            <textarea
              className="admin-textarea"
              value={importacaoLink.input}
              onChange={(event) => atualizarImportacaoLink("input", event.target.value)}
              placeholder={"url\nhttps://pt.aliexpress.com/item/...\nhttps://..."}
            />
          </label>
          <label>
            Margem padrao (%)
            <input
              type="number"
              min="0"
              step="0.01"
              value={importacaoLink.markupPercent}
              onChange={(event) => atualizarImportacaoLink("markupPercent", event.target.value)}
            />
          </label>
          <label className="file-import-button">
            <FileUp size={18} />
            Escolher CSV
            <input type="file" accept=".csv,text/csv,text/plain" onChange={lerArquivo} />
          </label>
          <button className="button button-primary" type="submit" disabled={carregando}>
            <UploadCloud size={18} />
            {carregando ? "Importando..." : "Importar para revisao"}
          </button>
          {mensagem && <p className="admin-message">{mensagem}</p>}
        </form>

        <form className="admin-panel admin-form" onSubmit={importarProduto}>
          <h2>Cadastrar produto manualmente</h2>
          <p className="admin-form-hint">
            Cole o link do AliExpress abaixo. Como o site do AliExpress carrega via JavaScript, preencha o nome, custo e imagens manualmente.
          </p>
          <label>
            Link AliExpress (opcional)
            <input
              value={formulario.productInput}
              onChange={(event) => atualizarCampo("productInput", event.target.value)}
              placeholder="https://pt.aliexpress.com/item/..."
            />
          </label>
          <label>
            Nome do produto <span className="admin-required">*</span>
            <input
              required
              value={formulario.name}
              onChange={(event) => atualizarCampo("name", event.target.value)}
              placeholder="Ex: Furadeira de Impacto 220W 3/8&quot; com Maleta"
            />
          </label>
          <label>
            Categoria
            <select value={formulario.category} onChange={(event) => atualizarCampo("category", event.target.value)}>
              <option>Ferramentas Eletricas</option>
              <option>Kits</option>
              <option>Alicates</option>
              <option>Medicao</option>
              <option>Solda</option>
              <option>Acessorios</option>
              <option>AliExpress</option>
            </select>
          </label>
          <label>
            Descrição (opcional)
            <textarea
              className="admin-textarea admin-textarea-sm"
              value={formulario.description}
              onChange={(event) => atualizarCampo("description", event.target.value)}
              placeholder="Descreva o produto brevemente..."
            />
          </label>
          <div className="admin-price-row">
            <label>
              Custo fornecedor (R$) <span className="admin-required">*</span>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={formulario.cost}
                onChange={(event) => atualizarCampo("cost", event.target.value)}
                placeholder="0,00"
              />
            </label>
            <label>
              Margem (%)
              <input
                type="number"
                min="0"
                step="1"
                value={formulario.markupPercent}
                onChange={(event) => atualizarCampo("markupPercent", event.target.value)}
              />
            </label>
            {precoVenda > 0 && (
              <div className="admin-price-preview-inline">
                Venda: <strong>{precoVenda.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
              </div>
            )}
          </div>
          <label>
            URLs das imagens
            <textarea
              className="admin-textarea admin-textarea-sm"
              value={formulario.imagesRaw}
              onChange={(event) => atualizarCampo("imagesRaw", event.target.value)}
              placeholder={"Cole as URLs das imagens, uma por linha ou separadas por vírgula:\nhttps://ae01.alicdn.com/kf/...\nhttps://ae01.alicdn.com/kf/..."}
            />
          </label>
          {imagensArray.length > 0 && (
            <div className="admin-image-preview-row">
              {imagensArray.slice(0, 4).map((src, i) => (
                <img key={i} src={src} alt="" className="admin-image-thumb" onError={(e) => { e.target.style.display = "none"; }} />
              ))}
            </div>
          )}
          <label>
            URL do vídeo (opcional)
            <input
              value={formulario.videoUrl}
              onChange={(event) => atualizarCampo("videoUrl", event.target.value)}
              placeholder="https://video.aliexpress-media.com/play/... ou link do YouTube"
            />
          </label>
          <button className="button button-primary" type="submit" disabled={carregando}>
            <Save size={18} />
            {carregando ? "Salvando..." : "Salvar produto"}
          </button>
          {mensagem && <p className="admin-message">{mensagem}</p>}
        </form>

        <section className="admin-panel">
          <h2>Pedidos drop</h2>
          <div className="admin-table">
            <div className="admin-table-head order-head">
              <span>Pedido</span>
              <span>Total</span>
              <span>Pagamento</span>
              <span>Fulfillment</span>
            </div>
            {initialOrders.length === 0 && <p className="admin-empty">Nenhum pedido de drop ainda.</p>}
            {initialOrders.map((pedido) => (
              <div className="admin-row order-head" key={pedido.id}>
                <span>{pedido.id.slice(0, 8)}</span>
                <strong>{formatarDinheiro(pedido.total)}</strong>
                <span>{pedido.payment_status || pedido.status}</span>
                <span>{pedido.fulfillment_status || "aguardando"}</span>
              </div>
            ))}
          </div>
        </section>
      </section>

      <section className="container admin-panel products-admin-panel">
        <h2>Produtos importados e publicados</h2>
        <div className="admin-table">
          <div className="admin-table-head products-head">
            <span>Produto</span>
            <span>Custo</span>
            <span>Venda</span>
            <span>Estoque</span>
            <span>Status</span>
            <span />
          </div>
          {produtos.length === 0 && <p className="admin-empty">Nenhum produto importado.</p>}
          {produtos.map((produto) => (
            <div key={produto.id}>
              <div className="admin-row products-head">
                <span>
                  {produto.name}
                  {produto.scrape_error && <small>{produto.scrape_error}</small>}
                </span>
                <span>{produto.supplier_cost ? formatarDinheiro(produto.supplier_cost) : "-"}</span>
                <strong className={produto.price === 0 ? "admin-price-zero" : ""}>{formatarDinheiro(produto.price)}</strong>
                <span>{produto.stock}</span>
                <span>{produto.product_status || produto.sync_status}</span>
                <span className="admin-row-actions">
                  <button className={`icon-button${produto.price === 0 ? " icon-button-warn" : ""}`} type="button" onClick={() => abrirEditarPreco(produto)} aria-label="Editar preço" title={produto.price === 0 ? "Preço não definido — clique para configurar" : "Editar preço"}>
                    <DollarSign size={18} />
                  </button>
                  <button className={`icon-button${produto.videos?.length ? " icon-button-active" : ""}`} type="button" onClick={() => abrirEditarVideo(produto)} aria-label="Editar vídeo" title="Editar vídeo">
                    <Video size={18} />
                  </button>
                  {produto.product_status === "published" ? (
                    <button className="icon-button" type="button" onClick={() => definirPublicacao(produto.id, "review")} aria-label="Voltar para revisao">
                      <EyeOff size={18} />
                    </button>
                  ) : (
                    <button className="icon-button" type="button" onClick={() => definirPublicacao(produto.id, "published")} aria-label="Publicar">
                      <CheckCircle2 size={18} />
                    </button>
                  )}
                  {produto.source === "aliexpress" && (
                    <button className="icon-button" type="button" onClick={() => sincronizarProduto(produto.id)} aria-label="Sincronizar">
                      <RefreshCw size={18} />
                    </button>
                  )}
                  <button className="icon-button icon-button-danger" type="button" onClick={() => removerProduto(produto.id)} aria-label="Remover produto" title="Remover produto">
                    <Trash2 size={18} />
                  </button>
                </span>
              </div>
              {editandoPreco === produto.id && (
                <div className="admin-price-editor">
                  <label>
                    Custo (R$)
                    <input type="number" min="0" step="0.01" value={formPreco.supplierCost}
                      onChange={(e) => setFormPreco((f) => ({ ...f, supplierCost: e.target.value }))} />
                  </label>
                  <label>
                    Margem (%)
                    <input type="number" min="0" step="1" value={formPreco.markupPercent}
                      onChange={(e) => setFormPreco((f) => ({ ...f, markupPercent: e.target.value }))} />
                  </label>
                  <span className="admin-price-preview">
                    Venda: <strong>{formatarDinheiro(Number(formPreco.supplierCost || 0) * (1 + Number(formPreco.markupPercent || 0) / 100))}</strong>
                  </span>
                  <button className="button button-primary" type="button" onClick={() => salvarPreco(produto.id)}>
                    <Save size={15} /> Salvar
                  </button>
                  <button className="icon-button" type="button" onClick={() => setEditandoPreco(null)}>
                    <X size={16} />
                  </button>
                </div>
              )}
              {editandoVideo === produto.id && (
                <div className="admin-price-editor">
                  <label style={{ flex: 1 }}>
                    URL do vídeo (YouTube ou MP4 direto)
                    <input
                      type="url"
                      placeholder="https://youtu.be/... ou https://.../video.mp4"
                      value={formVideo.url}
                      onChange={(e) => setFormVideo({ url: e.target.value })}
                    />
                  </label>
                  <button className="button button-primary" type="button" onClick={() => salvarVideo(produto.id)}>
                    <Save size={15} /> Salvar
                  </button>
                  <button className="icon-button" type="button" onClick={() => setEditandoVideo(null)}>
                    <X size={16} />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}

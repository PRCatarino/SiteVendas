import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const IMPORT_DIR = path.join(process.cwd(), "public", "products", "imported");
const PUBLIC_IMPORT_PATH = "/products/imported";

function stripHtml(value) {
  return String(value || "")
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function decodeEntities(value) {
  return String(value || "")
    .replace(/&quot;/g, '"')
    .replace(/&#34;/g, '"')
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'");
}

function metaContent(html, names) {
  for (const name of names) {
    const patterns = [
      new RegExp(`<meta[^>]+property=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+name=["']${name}["'][^>]+content=["']([^"']+)["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+property=["']${name}["'][^>]*>`, "i"),
      new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+name=["']${name}["'][^>]*>`, "i"),
    ];
    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match?.[1]) return decodeEntities(match[1]);
    }
  }
  return "";
}

function parseJsonLd(html) {
  const blocks = [...html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)];
  for (const block of blocks) {
    try {
      const parsed = JSON.parse(decodeEntities(block[1]).trim());
      const items = Array.isArray(parsed) ? parsed : [parsed, ...(parsed["@graph"] || [])];
      const product = items.find((item) => String(item?.["@type"] || "").toLowerCase().includes("product"));
      if (product) return product;
    } catch {
      // Ignore invalid embedded JSON from supplier pages.
    }
  }
  return null;
}

function numberFromText(value) {
  const text = String(value || "").replace(/[^\d.,-]/g, "");
  if (!text) return 0;
  const normalized = text.includes(",") ? text.replace(/\./g, "").replace(",", ".") : text;
  const number = Number(normalized);
  return Number.isFinite(number) ? number : 0;
}

function extractAliExpressPrice(html) {
  const patterns = [
    /"minActivityAmount"\s*:\s*\{\s*"value"\s*:\s*"?([\d.]+)"?/i,
    /"activityAmount"\s*:\s*\{\s*"currency"\s*:\s*"BRL"\s*,\s*"value"\s*:\s*"?([\d.]+)"?/i,
    /"activityAmount"\s*:\s*\{\s*"value"\s*:\s*"?([\d.]+)"?\s*,\s*"currency"\s*:\s*"BRL"/i,
    /"salePrice"\s*:\s*\{\s*"minAmount"\s*:\s*\{\s*"value"\s*:\s*"?([\d.]+)"?/i,
    /"minAmount"\s*:\s*\{\s*"value"\s*:\s*"?([\d.]+)"?/i,
    /"formattedPrice"\s*:\s*"R\$\s*([\d.,]+)"/i,
    /"price"\s*:\s*"R\$\s*([\d.,]+)"/i,
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match?.[1]) {
      const value = numberFromText(match[1]);
      if (value > 0) return value;
    }
  }
  return 0;
}

function absoluteUrl(url, baseUrl) {
  try {
    return new URL(url, baseUrl).toString();
  } catch {
    return "";
  }
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function categoryFromTitle(title) {
  const text = String(title || "").toLowerCase();
  if (/furadeira|parafusadeira|retifica|serra|esmerilhadeira/.test(text)) return "Ferramentas Eletricas";
  if (/kit|maleta|jogo|conjunto/.test(text)) return "Kits";
  if (/alicate|crimpador|rebitador/.test(text)) return "Alicates";
  if (/trena|nivel|laser|multimetro|detector/.test(text)) return "Medicao";
  if (/solda|ferro/.test(text)) return "Solda";
  if (/broca|bit|bits|disco|acessorio/.test(text)) return "Acessorios";
  return "Ferramentas Eletricas";
}

function productIdFromUrl(url) {
  const aliId = String(url || "").match(/\/item\/(\d+)\.html/i)?.[1];
  if (aliId) return aliId;
  return crypto.createHash("sha1").update(String(url)).digest("hex").slice(0, 12);
}

function extensionFromContentType(contentType) {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("gif")) return "gif";
  return "jpg";
}

export function parseProductLinks(input) {
  const lines = String(input || "")
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  return unique(
    lines.flatMap((line, index) => {
      if (index === 0 && /^url([,;]|\s*$)/i.test(line)) return [];
      return line
        .split(/[,;]/)
        .map((cell) => cell.trim())
        .filter((cell) => /^https?:\/\//i.test(cell));
    })
  );
}

function cleanAliCdnUrl(src) {
  if (!src) return "";
  // Remove thumbnail size suffixes like _220x220q75.jpg_.avif, ?has_lang=1&ver=2_960x960q75.jpg_.avif
  return src
    .replace(/\?has_lang=\d+&ver=\d+_\d+x\d+q\d+\.[a-z]+_\.[a-z]+$/, "")
    .replace(/_\d+x\d+q\d+\.[a-z]+_\.[a-z]+$/, "")
    .replace(/\?.*$/, "");
}

function cleanVideoUrl(src) {
  if (!src) return "";
  // Remove ?from=chrome and other tracking params, keep base URL
  return src.replace(/\?.*$/, "");
}

function isWorkerRuntime() {
  // Cloudflare Workers: no child_process, no filesystem, no NEXT_RUNTIME="edge"
  // Detect by absence of full Node.js APIs
  try {
    return typeof process === "undefined" || process.versions?.node === undefined;
  } catch {
    return true;
  }
}

async function scrapeAliExpressWithBrowser(url) {
  if (isWorkerRuntime()) return null;
  try {
    const { spawn } = await import("node:child_process");
    const scriptPath = [process.cwd(), "src", "lib", "browser" + "-scrape.cjs"].join(path.sep);
    return new Promise((resolve) => {
      let stdout = "";
      let stderr = "";
      let settled = false;
      let child;
      try {
        child = spawn("node", [scriptPath, url]);
      } catch {
        resolve(null);
        return;
      }
      child.stdout.on("data", (chunk) => { stdout += chunk.toString(); });
      child.stderr.on("data", (chunk) => { stderr += chunk.toString(); });
      function finish() {
        if (settled) return;
        settled = true;
        if (stderr) console.warn("[scrapeAliExpressWithBrowser] stderr:", stderr.slice(0, 300));
        try {
          const data = JSON.parse(stdout);
          if (data.error) { resolve(null); }
          else resolve(data);
        } catch {
          resolve(null);
        }
      }
      child.on("close", () => finish());
      child.on("error", () => { settled = true; resolve(null); });
      setTimeout(() => { if (!settled) { child.kill(); resolve(null); } }, 65000);
    });
  } catch {
    return null;
  }
}

export async function scrapeProductPage(url) {
  const response = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125 Safari/537.36",
      Accept: "text/html,application/xhtml+xml",
    },
  });

  if (!response.ok) {
    throw new Error(`Fornecedor retornou HTTP ${response.status}.`);
  }

  // Capture the resolved URL after redirect chain (e.g., short affiliate links).
  // Strip affiliate tracking params so the browser scraper gets a clean product URL.
  const rawResolvedUrl = response.url || url;
  const resolvedUrl = (() => {
    try {
      const u = new URL(rawResolvedUrl);
      // AliExpress item pages: strip all query params, keep only origin + path
      if (/aliexpress\.com/i.test(u.hostname) && /\/item\//i.test(u.pathname)) {
        return `${u.origin}${u.pathname}`;
      }
    } catch { /* fall through */ }
    return rawResolvedUrl;
  })();

  const html = await response.text();
  const jsonLd = parseJsonLd(html);
  const title =
    jsonLd?.name ||
    metaContent(html, ["og:title", "twitter:title"]) ||
    stripHtml(html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const description =
    jsonLd?.description ||
    metaContent(html, ["og:description", "description", "twitter:description"]) ||
    title;
  const offer = Array.isArray(jsonLd?.offers) ? jsonLd.offers[0] : jsonLd?.offers;
  const priceFromMeta = numberFromText(offer?.price || metaContent(html, ["product:price:amount", "og:price:amount"]));
  let price = priceFromMeta > 0 ? priceFromMeta : extractAliExpressPrice(html);
  const imageCandidates = [
    ...(Array.isArray(jsonLd?.image) ? jsonLd.image : [jsonLd?.image]),
    metaContent(html, ["og:image", "twitter:image"]),
    ...[...html.matchAll(/https?:\/\/[^"']+\.(?:jpg|jpeg|png|webp)(?:\?[^"']*)?/gi)].slice(0, 8).map((match) => match[0]),
  ];
  let images = unique(imageCandidates.map((image) => absoluteUrl(image, resolvedUrl))).slice(0, 6);

  if (!title) {
    throw new Error("Nao foi possivel identificar o titulo do produto.");
  }

  // For AliExpress (CSR), attempt browser scrape for video + full gallery + real price
  let browserVideo = null;
  if (/aliexpress\.com/i.test(resolvedUrl)) {
    let browserData = null;
    try { browserData = await scrapeAliExpressWithBrowser(resolvedUrl); } catch {}
    if (browserData) {
      if (browserData.videoUrl) {
        browserVideo = { url: browserData.videoUrl, poster: browserData.videoPoster || "" };
      }
      if (browserData.galleryImages?.length > images.length) {
        images = unique([...images, ...browserData.galleryImages]).slice(0, 8);
      }
      // Browser price is authoritative for AliExpress (HTML has no real price data)
      if (browserData.priceText) {
        const browserPrice = numberFromText(browserData.priceText);
        if (browserPrice > 0) price = browserPrice;
      }
    }
  }

  return {
    title,
    description,
    supplierCost: price,
    category: categoryFromTitle(title),
    images,
    video: browserVideo,
  };
}

export async function downloadProductImages(images, productId) {
  // Cloudflare Workers has no filesystem — return external URLs directly
  if (isWorkerRuntime()) return images.slice(0, 6).filter(Boolean);
  try { await fs.mkdir(IMPORT_DIR, { recursive: true }); } catch { return images.slice(0, 6).filter(Boolean); }
  const saved = [];

  for (const [index, image] of images.slice(0, 6).entries()) {
    try {
      const response = await fetch(image, {
        headers: { "User-Agent": "Mozilla/5.0", Accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8" },
      });
      if (!response.ok) continue;
      const contentType = response.headers.get("content-type") || "";
      if (!contentType.startsWith("image/")) continue;
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length || buffer.length > 8 * 1024 * 1024) continue;
      const ext = extensionFromContentType(contentType);
      const filename = `${productId}-${index + 1}.${ext}`;
      await fs.writeFile(path.join(IMPORT_DIR, filename), buffer);
      saved.push(`${PUBLIC_IMPORT_PATH}/${filename}`);
    } catch {
      // Keep importing the product even when one image fails.
    }
  }

  return saved;
}

function cleanTitle(title) {
  return String(title || "")
    .replace(/\s*[-–|]\s*AliExpress\s*\d*/gi, "")
    .replace(/\s*[-–|]\s*Aliexpress\.com\s*/gi, "")
    .replace(/\s*\(AliExpress\)\s*/gi, "")
    .trim();
}

export function draftFromLink(url, scraped = {}, markupPercent = 40, errorMessage = "") {
  const externalProductId = productIdFromUrl(url);
  const rawTitle = scraped.title || `Produto ${externalProductId}`;
  const title = cleanTitle(rawTitle);
  const supplierCost = Number(scraped.supplierCost || 0);
  const price = Math.round((supplierCost + supplierCost * (Number(markupPercent || 0) / 100) + Number.EPSILON) * 100) / 100;

  const videos = scraped.video ? [scraped.video] : [];

  return {
    productId: `imp-${externalProductId}`,
    externalProductId,
    title,
    description: scraped.description && !/aliexpress|smarter shopping/i.test(scraped.description)
      ? scraped.description
      : title,
    category: scraped.category || categoryFromTitle(title),
    supplierCost,
    price,
    images: scraped.localImages?.length ? scraped.localImages : ["/products/hammer.svg"],
    videos,
    sourceUrl: url,
    scrapeStatus: errorMessage ? "error" : "scraped",
    scrapeError: errorMessage,
  };
}

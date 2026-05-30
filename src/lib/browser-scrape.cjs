// Standalone Playwright scraper — runs as a child process to bypass Next.js bundling.
// Usage: node browser-scrape.cjs <url>
// Output: JSON to stdout

const { chromium } = require("playwright");

function cleanAliCdnUrl(src) {
  if (!src) return "";
  return src
    .replace(/\?has_lang=\d+&ver=\d+_\d+x\d+q\d+\.[a-z]+_\.[a-z]+$/, "")
    .replace(/_\d+x\d+q\d+\.[a-z]+_\.[a-z]+$/, "")
    .replace(/\?.*$/, "");
}

function cleanVideoUrl(src) {
  if (!src) return "";
  return src.replace(/\?.*$/, "");
}

(async () => {
  const url = process.argv[2];
  if (!url) {
    process.stdout.write(JSON.stringify({ error: "No URL provided" }));
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  try {
    const ctx = await browser.newContext({
      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
      locale: "pt-BR",
      extraHTTPHeaders: { "Accept-Language": "pt-BR,pt;q=0.9" },
    });
    const page = await ctx.newPage();

    const videoUrls = [];
    page.on("response", (res) => {
      const resUrl = res.url();
      if (/video\.aliexpress-media\.com.*\.mp4/i.test(resUrl) || /alivideo\.alicdn.*\.mp4/i.test(resUrl)) {
        videoUrls.push(resUrl);
      }
    });

    await page.goto(url, { waitUntil: "networkidle", timeout: 30000 });

    // Click first thumbnail to trigger video load
    const firstThumb = await page
      .$("[class*=thumb]:first-child, [class*=slide]:first-child, [class*=SquareImage]:first-child")
      .catch(() => null);
    if (firstThumb) {
      await firstThumb.click().catch(() => {});
      await page.waitForTimeout(3000);
    }

    // Extract video element data
    const videoData = await page
      .evaluate(() => {
        const v = document.querySelector("video");
        if (!v) return null;
        return { src: v.currentSrc || v.src || "", poster: v.poster || "" };
      })
      .catch(() => null);

    // Extract gallery thumbnails
    const rawThumbs = await page
      .evaluate(() => {
        const imgs = document.querySelectorAll("[class*=thumb] img, [class*=slide] img, [class*=Thumbnail] img");
        return Array.from(imgs)
          .map((i) => i.src || i.getAttribute("data-src") || "")
          .filter((s) => /^https?/.test(s) && !/placeholder|spinner/.test(s));
      })
      .catch(() => []);

    const galleryImages = [...new Set(rawThumbs.map(cleanAliCdnUrl))].filter(Boolean).slice(0, 8);

    // Extract price — try specific selectors first, then scan all leaf elements for R$
    const priceText = await page
      .evaluate(() => {
        const selectors = [
          "[class*=price-default--current]",
          "[class*=price--current]",
          "[class*=uniform-banner-box-price]",
          ".product-price-value",
          "[class*=pdp-comp-price] [class*=current]",
          "[itemprop=price]",
        ];
        for (const sel of selectors) {
          const el = document.querySelector(sel);
          if (el && el.textContent.includes("R$")) return el.textContent.trim();
        }
        // Fallback: scan all childless elements for "R$X,XX" pattern
        for (const el of document.querySelectorAll("*")) {
          if (el.children.length === 0) {
            const t = el.textContent.trim();
            if (/^R\$\s*[\d,]+$/.test(t)) return t;
          }
        }
        return "";
      })
      .catch(() => "");

    const videoUrl = videoData?.src ? cleanVideoUrl(videoData.src) : videoUrls[0] ? cleanVideoUrl(videoUrls[0]) : null;
    const videoPoster = videoData?.poster ? cleanAliCdnUrl(videoData.poster) : null;

    process.stdout.write(
      JSON.stringify({ videoUrl, videoPoster, galleryImages, priceText })
    );
  } catch (err) {
    process.stdout.write(JSON.stringify({ error: err.message }));
  } finally {
    await browser.close().catch(() => {});
  }
})();

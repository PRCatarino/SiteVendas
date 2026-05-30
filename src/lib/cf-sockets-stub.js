// Build-time stub for cloudflare:sockets.
// At runtime in Cloudflare Workers, the real module is imported via dynamic
// import() inside db.js. This stub only exists so Turbopack doesn't fail.
export function connect() {
  throw new Error("cloudflare:sockets is only available in Cloudflare Workers.");
}

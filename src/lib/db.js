import postgres from "postgres";

// Cloudflare Workers does not support Node.js STARTTLS (upgrading a TCP socket
// to TLS via tls.connect({ socket: existing })). We work around this by using
// the Workers-native `cloudflare:sockets` which has first-class startTls().
// In local Node.js dev we fall back to a standard net.Socket + postgres.js TLS.

const SSL_REQUEST = (() => {
  const buf = new Uint8Array(8);
  const view = new DataView(buf.buffer);
  view.setInt32(0, 8, false);        // total length = 8 bytes
  view.setInt32(4, 80877103, false); // SSLRequest magic number
  return buf;
})();

// Minimal EventEmitter bridge between cloudflare:sockets and postgres.js.
class CfSocketAdapter {
  constructor() {
    this._h = {}; // event handlers
    this._writer = null;
    this._open = false;
  }

  attach(cfSocket) {
    this._open = true;
    // Hold the writer open for the life of the connection.
    this._writer = cfSocket.writable.getWriter();

    // Pump the readable stream to fire 'data' events.
    (async () => {
      const reader = cfSocket.readable.getReader();
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          this._fire("data", Buffer.from(value));
        }
      } catch (err) {
        if (this._open) this._fire("error", err);
      } finally {
        this._open = false;
        this._fire("close");
      }
    })();
  }

  _fire(event, ...args) {
    (this._h[event] || []).forEach((h) => { try { h(...args); } catch {} });
  }

  on(event, fn) {
    (this._h[event] = this._h[event] || []).push(fn);
    return this;
  }

  removeAllListeners(ev) {
    if (ev) delete this._h[ev]; else this._h = {};
    return this;
  }

  write(chunk, cb) {
    if (!this._writer || !this._open) { cb?.(new Error("closed")); return false; }
    const buf = chunk instanceof Uint8Array ? chunk : Buffer.from(chunk);
    this._writer.write(buf)
      .then(() => { this._fire("drain"); cb?.(); })
      .catch((e) => { this._fire("error", e); cb?.(e); });
    return true;
  }

  setKeepAlive() { return this; }

  destroy() {
    this._open = false;
    this._writer?.close().catch(() => {});
    this._writer = null;
  }
}

// Custom socket factory.
// - In Cloudflare Workers: uses cloudflare:sockets (+ STARTTLS for SSL).
// - In local Node.js dev: falls back to a plain connected net.Socket so
//   postgres.js can apply its own TLS logic via connect_timeout / SSL opts.
async function socketFactory(pgOpts) {
  const hostname = Array.isArray(pgOpts.host) ? pgOpts.host[0] : pgOpts.host;
  const port = Array.isArray(pgOpts.port) ? pgOpts.port[0] : Number(pgOpts.port);
  const useSsl = process.env.PGSSL === "true";

  // Try cloudflare:sockets (Workers environment).
  // Using new Function to bypass bundler static analysis — this module only
  // exists at runtime in Cloudflare Workers and must not be resolved at build.
  let cfConnect;
  try {
    const dynImport = new Function("s", "return import(s)");
    cfConnect = (await dynImport("cloudflare:sockets")).connect;
  } catch {
    // ── Local Node.js dev fallback ──────────────────────────────────────────
    // Return a plain connected net.Socket; postgres.js will apply TLS itself
    // based on its own ssl option (we set ssl: false for Workers mode but we
    // need TLS here, so switch back to standard behaviour).
    const { Socket } = await import("net");
    const sock = new Socket();
    await new Promise((ok, fail) => {
      sock.once("connect", ok);
      sock.once("error", fail);
      sock.connect(port, hostname);
    });
    return sock;
  }

  // ── Cloudflare Workers path ─────────────────────────────────────────────
  let cfSocket = cfConnect({ hostname, port });

  if (useSsl) {
    // STARTTLS: send SSLRequest, wait for 'S', then upgrade to TLS.
    const w = cfSocket.writable.getWriter();
    await w.write(SSL_REQUEST);
    w.releaseLock();

    const r = cfSocket.readable.getReader();
    const { value } = await r.read();
    r.releaseLock();

    if (!value || value[0] !== 0x53 /* 'S' */) {
      throw new Error("PostgreSQL server rejected SSL.");
    }
    cfSocket = cfSocket.startTls({ expectedServerHostname: hostname });
  }

  const adapter = new CfSocketAdapter();
  adapter.attach(cfSocket);
  return adapter;
}

// postgres.js options for Workers (ssl:false because TLS is in socketFactory).
// In local dev the net.Socket fallback path uses postgres.js's own SSL when needed.
function makeOptions() {
  return {
    ssl: false,
    socket: socketFactory,
    max: 1,
    idle_timeout: 5,
    connect_timeout: 15,
    prepare: false,
    fetch_types: false,
  };
}

export function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

export async function query(text, params = []) {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL não configurada.");
  }
  const sql = postgres(process.env.DATABASE_URL, makeOptions());
  try {
    const rows = await sql.unsafe(text, params);
    return { rows: Array.from(rows) };
  } finally {
    await sql.end({ timeout: 2 }).catch(() => {});
  }
}

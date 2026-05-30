import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

export const COOKIE_SESSAO = "catarino_session";
const DIAS_SESSAO = 30;

const memoria = globalThis.__catarinoAuthMemory ?? {
  users: new Map(),
  sessions: new Map(),
};

globalThis.__catarinoAuthMemory = memoria;

function hasharToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function usuarioPublico(user, address = null) {
  if (!user) return null;
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    cpf: user.cpf || "",
    is_admin: emailEhAdmin(user.email),
    address,
  };
}

export function emailEhAdmin(email) {
  const admins = String(process.env.ADMIN_EMAILS || "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean);
  return admins.includes(String(email || "").trim().toLowerCase());
}

export async function exigirAdminDaRequisicao(request) {
  const token = request.cookies.get(COOKIE_SESSAO)?.value;
  const user = token ? await obterUsuarioPorToken(token) : null;
  if (!user?.is_admin) {
    const error = new Error("Acesso restrito ao administrador.");
    error.status = user ? 403 : 401;
    throw error;
  }
  return user;
}

function calcularExpiracao() {
  return new Date(Date.now() + DIAS_SESSAO * 24 * 60 * 60 * 1000);
}

async function comFallback(trabalho, fallback) {
  try {
    return await trabalho();
  } catch {
    return fallback();
  }
}

export async function registrarUsuario(entrada) {
  const email = String(entrada.email || "").trim().toLowerCase();
  const senha = String(entrada.password || "");

  if (!entrada.fullName || !email || senha.length < 6 || !entrada.phone) {
    throw new Error("Preencha nome, email, telefone e senha com pelo menos 6 caracteres.");
  }

  const senhaHash = await bcrypt.hash(senha, 12);
  const endereco = {
    cep: entrada.cep,
    street: entrada.street,
    number: entrada.number,
    complement: entrada.complement || "",
    neighborhood: entrada.neighborhood,
    city: entrada.city,
    state: entrada.state,
  };

  if (!endereco.cep || !endereco.street || !endereco.number || !endereco.neighborhood || !endereco.city || !endereco.state) {
    throw new Error("Preencha o endereço completo para envio.");
  }

  return comFallback(
    async () => {
      const { rows } = await query(
        `insert into users (full_name, email, password_hash, phone, cpf)
         values ($1, $2, $3, $4, $5)
         returning id, full_name, email, phone, cpf`,
        [entrada.fullName, email, senhaHash, entrada.phone, entrada.cpf || null]
      );
      const user = rows[0];

      await query(
        `insert into addresses (user_id, cep, street, number, complement, neighborhood, city, state)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [user.id, endereco.cep, endereco.street, endereco.number, endereco.complement || null, endereco.neighborhood, endereco.city, endereco.state]
      );

      return usuarioPublico(user, endereco);
    },
    () => {
      if ([...memoria.users.values()].some((user) => user.email === email)) {
        throw new Error("Este email já está cadastrado.");
      }
      const user = {
        id: crypto.randomUUID(),
        full_name: entrada.fullName,
        email,
        password_hash: senhaHash,
        phone: entrada.phone,
        cpf: entrada.cpf || "",
        address: endereco,
      };
      memoria.users.set(user.id, user);
      return usuarioPublico(user, endereco);
    }
  );
}

export async function logarUsuario(emailEntrada, senha) {
  const email = String(emailEntrada || "").trim().toLowerCase();

  let dbUser = null;
  let dbError = null;

  try {
    const { rows } = await query("select * from users where email = $1 limit 1", [email]);
    dbUser = rows[0] || null;
  } catch (err) {
    dbError = err;
    console.warn("[auth] DB error on login:", err.message);
  }

  if (dbUser) {
    const senhaOk = await bcrypt.compare(senha, dbUser.password_hash);
    if (!senhaOk) throw new Error("Email ou senha inválidos.");
    let endereco = null;
    try { endereco = await obterEnderecoDoUsuario(dbUser.id); } catch {}
    return usuarioPublico(dbUser, endereco);
  }

  if (dbError) {
    const user = [...memoria.users.values()].find((entry) => entry.email === email);
    if (!user || !(await bcrypt.compare(senha, user.password_hash))) {
      throw new Error("Email ou senha inválidos.");
    }
    return usuarioPublico(user, user.address);
  }

  throw new Error("Email ou senha inválidos.");
}

export async function criarSessao(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hasharToken(token);
  const expira = calcularExpiracao();

  await comFallback(
    async () => {
      await query("insert into user_sessions (token_hash, user_id, expires_at) values ($1, $2, $3)", [
        tokenHash,
        userId,
        expira,
      ]);
    },
    () => {
      memoria.sessions.set(tokenHash, { user_id: userId, expires_at: expira });
    }
  );

  return { token, expires: expira };
}

export async function obterUsuarioAtual() {
  const cookieStore = await cookies();
  const token = cookieStore.get(COOKIE_SESSAO)?.value;
  if (!token) return null;

  return obterUsuarioPorToken(token);
}

export async function obterUsuarioPorToken(token) {
  const tokenHash = hasharToken(token);

  let dbUser = null;
  let dbFailed = false;

  try {
    const { rows } = await query(
      `select u.id, u.full_name, u.email, u.phone, u.cpf
       from user_sessions s
       join users u on u.id = s.user_id
       where s.token_hash = $1 and s.expires_at > now()
       limit 1`,
      [tokenHash]
    );
    dbUser = rows[0] || null;
  } catch {
    dbFailed = true;
  }

  if (!dbFailed) {
    if (!dbUser) return null;
    let endereco = null;
    try { endereco = await obterEnderecoDoUsuario(dbUser.id); } catch {}
    return usuarioPublico(dbUser, endereco);
  }

  const sessao = memoria.sessions.get(tokenHash);
  if (!sessao || sessao.expires_at <= new Date()) return null;
  const user = memoria.users.get(sessao.user_id);
  return user ? usuarioPublico(user, user.address) : null;
}

export async function excluirSessao(token) {
  if (!token) return;
  const tokenHash = hasharToken(token);
  await comFallback(
    async () => {
      await query("delete from user_sessions where token_hash = $1", [tokenHash]);
    },
    () => {
      memoria.sessions.delete(tokenHash);
    }
  );
}

export async function obterEnderecoDoUsuario(userId) {
  const { rows } = await query(
    "select cep, street, number, complement, neighborhood, city, state from addresses where user_id = $1 order by created_at desc limit 1",
    [userId]
  );
  return rows[0] || null;
}

export async function obterPedidosDoUsuario(userId) {
  return comFallback(
    async () => {
      const { rows } = await query(
        "select id, subtotal, discount, freight, total, status, created_at from orders where user_id = $1 order by created_at desc",
        [userId]
      );
      return rows.map((order) => ({
        ...order,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        freight: Number(order.freight),
        total: Number(order.total),
      }));
    },
    () => []
  );
}

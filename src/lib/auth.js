import crypto from "node:crypto";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import { query } from "@/lib/db";

export const SESSION_COOKIE = "catarino_session";
const SESSION_DAYS = 30;

const memory = globalThis.__catarinoAuthMemory ?? {
  users: new Map(),
  sessions: new Map(),
};

globalThis.__catarinoAuthMemory = memory;

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function publicUser(user, address = null) {
  if (!user) return null;
  return {
    id: user.id,
    full_name: user.full_name,
    email: user.email,
    phone: user.phone,
    cpf: user.cpf || "",
    address,
  };
}

function expiresAt() {
  return new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
}

async function withFallback(work, fallback) {
  try {
    return await work();
  } catch {
    return fallback();
  }
}

export async function registerUser(input) {
  const email = String(input.email || "").trim().toLowerCase();
  const password = String(input.password || "");

  if (!input.fullName || !email || password.length < 6 || !input.phone) {
    throw new Error("Preencha nome, email, telefone e senha com pelo menos 6 caracteres.");
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const address = {
    cep: input.cep,
    street: input.street,
    number: input.number,
    complement: input.complement || "",
    neighborhood: input.neighborhood,
    city: input.city,
    state: input.state,
  };

  if (!address.cep || !address.street || !address.number || !address.neighborhood || !address.city || !address.state) {
    throw new Error("Preencha o endereço completo para envio.");
  }

  return withFallback(
    async () => {
      const { rows } = await query(
        `insert into users (full_name, email, password_hash, phone, cpf)
         values ($1, $2, $3, $4, $5)
         returning id, full_name, email, phone, cpf`,
        [input.fullName, email, passwordHash, input.phone, input.cpf || null]
      );
      const user = rows[0];

      await query(
        `insert into addresses (user_id, cep, street, number, complement, neighborhood, city, state)
         values ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [user.id, address.cep, address.street, address.number, address.complement || null, address.neighborhood, address.city, address.state]
      );

      return publicUser(user, address);
    },
    () => {
      if ([...memory.users.values()].some((user) => user.email === email)) {
        throw new Error("Este email já está cadastrado.");
      }
      const user = {
        id: crypto.randomUUID(),
        full_name: input.fullName,
        email,
        password_hash: passwordHash,
        phone: input.phone,
        cpf: input.cpf || "",
        address,
      };
      memory.users.set(user.id, user);
      return publicUser(user, address);
    }
  );
}

export async function loginUser(emailInput, password) {
  const email = String(emailInput || "").trim().toLowerCase();

  return withFallback(
    async () => {
      const { rows } = await query("select * from users where email = $1 limit 1", [email]);
      const user = rows[0];
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw new Error("Email ou senha inválidos.");
      }
      return publicUser(user, await getAddressForUser(user.id));
    },
    async () => {
      const user = [...memory.users.values()].find((entry) => entry.email === email);
      if (!user || !(await bcrypt.compare(password, user.password_hash))) {
        throw new Error("Email ou senha inválidos.");
      }
      return publicUser(user, user.address);
    }
  );
}

export async function createSession(userId) {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expires = expiresAt();

  await withFallback(
    async () => {
      await query("insert into user_sessions (token_hash, user_id, expires_at) values ($1, $2, $3)", [
        tokenHash,
        userId,
        expires,
      ]);
    },
    () => {
      memory.sessions.set(tokenHash, { user_id: userId, expires_at: expires });
    }
  );

  return { token, expires };
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  return getUserBySessionToken(token);
}

export async function getUserBySessionToken(token) {
  const tokenHash = hashToken(token);

  return withFallback(
    async () => {
      const { rows } = await query(
        `select u.id, u.full_name, u.email, u.phone, u.cpf
         from user_sessions s
         join users u on u.id = s.user_id
         where s.token_hash = $1 and s.expires_at > now()
         limit 1`,
        [tokenHash]
      );
      const user = rows[0];
      return user ? publicUser(user, await getAddressForUser(user.id)) : null;
    },
    () => {
      const session = memory.sessions.get(tokenHash);
      if (!session || session.expires_at <= new Date()) return null;
      const user = memory.users.get(session.user_id);
      return user ? publicUser(user, user.address) : null;
    }
  );
}

export async function deleteSession(token) {
  if (!token) return;
  const tokenHash = hashToken(token);
  await withFallback(
    async () => {
      await query("delete from user_sessions where token_hash = $1", [tokenHash]);
    },
    () => {
      memory.sessions.delete(tokenHash);
    }
  );
}

export async function getAddressForUser(userId) {
  const { rows } = await query(
    "select cep, street, number, complement, neighborhood, city, state from addresses where user_id = $1 order by created_at desc limit 1",
    [userId]
  );
  return rows[0] || null;
}

export async function getOrdersForUser(userId) {
  return withFallback(
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

export const SESSION_COOKIE_NAME = "admin_session";

export type AdminRole = "admin" | "editor";
export type Session = { userId: number; role: AdminRole };

export async function hashPassword(password: string): Promise<string> {
  const data = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sign(payload: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(process.env.AUTH_SECRET || ""),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// セッションCookieの値は "userId.role.署名" というステートレスなHMAC署名文字列。
// セッションテーブルを持たず、AUTH_SECRETの秘密性のみで改ざんを防ぐ簡易実装。
export async function createSessionToken(userId: number, role: AdminRole): Promise<string> {
  const payload = `${userId}.${role}`;
  const signature = await sign(payload);
  return `${payload}.${signature}`;
}

export async function verifySessionToken(token: string | undefined | null): Promise<Session | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const [userIdRaw, role, signature] = parts;
  if (role !== "admin" && role !== "editor") return null;

  const expected = await sign(`${userIdRaw}.${role}`);
  if (expected !== signature) return null;

  const userId = Number(userIdRaw);
  if (!Number.isInteger(userId)) return null;

  return { userId, role };
}

// role階層: adminはeditor向けの操作もすべて行える。
export function roleSatisfies(session: Session, required: AdminRole): boolean {
  if (required === "editor") return session.role === "editor" || session.role === "admin";
  return session.role === "admin";
}

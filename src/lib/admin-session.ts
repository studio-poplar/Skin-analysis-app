import { cookies } from "next/headers";
import { SESSION_COOKIE_NAME, verifySessionToken, type Session } from "@/lib/admin-auth";

// Server Component / Server Action 専用(next/headersに依存するため proxy.ts では使わない)。
export async function getCurrentSession(): Promise<Session | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
  return verifySessionToken(token);
}

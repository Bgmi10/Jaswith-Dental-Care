import { cookies } from "next/headers";

/**
 * Every /api/whatsapp/* route calls this.
 *
 * Your logout() deletes the "session" cookie, so this checks that cookie exists.
 * If you have a real session verification (JWT verify / DB lookup), call it here instead,
 * because "cookie exists" alone is not proof the session is valid.
 */
export async function requireAdmin(): Promise<boolean> {
  const store = await cookies();
  return Boolean(store.get("session")?.value);
}
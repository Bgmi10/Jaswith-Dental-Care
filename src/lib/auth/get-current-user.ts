import { cookies } from "next/headers";
import { verifySession } from "@/src/lib/auth/session";

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const token = cookieStore.get("session")?.value;

  if (!token) return null;

  const session = await verifySession(token);
  return session; // { userId, email } or null
}
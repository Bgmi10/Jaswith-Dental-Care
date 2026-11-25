import { NextResponse } from "next/server";

import { requireAdmin } from "../../../lib/adminGuard";
import { connectWa, getStatus, WaError } from "../../../lib/whatsapp";


export const dynamic = "force-dynamic";

export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(await getStatus());
}
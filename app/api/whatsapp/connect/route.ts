import { NextResponse } from "next/server";
import { requireAdmin } from "../../../lib/adminGuard";
import { connectWa, WaError } from "../../../lib/whatsapp";

export async function POST() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  try {
    return NextResponse.json(await connectWa());
  } catch (e) {
    const err = e as WaError;
    return NextResponse.json({ error: err.message, code: err.code }, { status: err.status || 500 });
  }
}
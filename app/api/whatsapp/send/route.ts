import { NextRequest, NextResponse } from "next/server";
import prisma from "@/prisma";

import { requireAdmin } from "../../../lib/adminGuard";
import { connectWa, getStatus, invoiceMessage, reminderMessage, sendDocument, sendText, thanksMessage, WaError } from "../../../lib/whatsapp";


export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

type SendType = "THANKS" | "REMINDER" | "INVOICE";

// Warn before re-sending the same thing within this window (minutes)
const DUPLICATE_WINDOW_MIN: Record<SendType, number> = {
  THANKS: 360,
  REMINDER: 120,
  INVOICE: 10,
};

class HttpError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 400, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

const fullName = (p: { firstName: string; lastName: string | null }) =>
  [p.firstName, p.lastName].filter(Boolean).join(" ");

const todayIST = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }); // YYYY-MM-DD

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const type = body.type as SendType;
    const id = String(body.id || "");
    const force = Boolean(body.force);

    if (!["THANKS", "REMINDER", "INVOICE"].includes(type) || !id) {
      throw new HttpError("Invalid request");
    }

    // 1. Is WhatsApp linked?
    const status = await getStatus();
    if (status.state === "offline") {
      throw new HttpError(
        "WhatsApp service is not reachable. Please contact the administrator.",
        503,
        "OFFLINE"
      );
    }
    if (status.state !== "ready") {
      throw new HttpError(
        "WhatsApp is not linked. Open the WhatsApp tab and scan the QR code first.",
        409,
        "NOT_CONNECTED"
      );
    }

    // 2. Duplicate guard
    if (!force) {
      const windowMin = DUPLICATE_WINDOW_MIN[type];
      const recent = await prisma.auditLog.findFirst({
        where: {
          action: `WHATSAPP_${type}`,
          entityId: id,
          createdAt: { gte: new Date(Date.now() - windowMin * 60_000) },
        },
        orderBy: { createdAt: "desc" },
      });
      if (recent) {
        const mins = Math.max(1, Math.round((Date.now() - recent.createdAt.getTime()) / 60_000));
        throw new HttpError(`This was already sent ${mins} minute(s) ago.`, 409, "DUPLICATE");
      }
    }

    // 3. Build + send
    let to = "";
    let phone = "";
    let entityType = "Patient";

    if (type === "THANKS") {
      const patient = await prisma.patient.findUnique({ where: { id } });
      if (!patient) throw new HttpError("Patient not found", 404);
      if (!patient.phone) throw new HttpError("This patient has no phone number");
      const clinic = await prisma.clinic.findUnique({ where: { id: patient.clinicId } });

      to = fullName(patient);
      phone = patient.phone;
      await sendText(phone, thanksMessage(to, clinic?.name || "Jaswith Dental Care"));
    }

    if (type === "REMINDER") {
      entityType = "Appointment";
      const appt = await prisma.appointment.findUnique({
        where: { id },
        include: { patient: true, clinic: true },
      });
      if (!appt) throw new HttpError("Appointment not found", 404);

      if (["CANCELLED", "COMPLETED", "NO_SHOW"].includes(appt.status)) {
        throw new HttpError(`Cannot send a reminder for a ${appt.status.toLowerCase().replace("_", "-")} appointment.`);
      }
      if (appt.date.toISOString().slice(0, 10) < todayIST()) {
        throw new HttpError("This appointment date has already passed.");
      }

      phone = appt.patient?.phone || appt.phone;
      if (!phone) throw new HttpError("No phone number on this appointment");
      to = appt.patient ? fullName(appt.patient) : appt.patientName;

      await sendText(
        phone,
        reminderMessage({
          patientName: to,
          clinic: appt.clinic.name,
          date: appt.date,
          time: appt.time,
          reason: appt.reason || appt.treatment,
          address: appt.clinic.address,
          mapsUrl: appt.clinic.mapsUrl,
        })
      );
    }

    if (type === "INVOICE") {
      entityType = "Invoice";
      const invoice = await prisma.invoice.findUnique({
        where: { id },
        include: { patient: true, clinic: true, payments: true },
      });
      if (!invoice) throw new HttpError("Bill not found", 404);
      if (invoice.status === "CANCELLED") throw new HttpError("This bill is cancelled.");
      if (!invoice.patient.phone) throw new HttpError("This patient has no phone number");

      // Reuse your existing PDF route, forwarding the admin's cookie.
      const origin = process.env.APP_INTERNAL_URL || new URL(req.url).origin;
      const pdfRes = await fetch(`${origin}/api/invoices/${invoice.id}/pdf`, {
        headers: { cookie: req.headers.get("cookie") || "" },
        cache: "no-store",
      });
      if (!pdfRes.ok) throw new HttpError("Could not generate the invoice PDF", 502);

      const buf = Buffer.from(await pdfRes.arrayBuffer());
      if (buf.length < 100 || buf.subarray(0, 4).toString() !== "%PDF") {
        throw new HttpError("The invoice PDF came back invalid", 502);
      }

      phone = invoice.patient.phone;
      to = fullName(invoice.patient);
      const paid = invoice.payments.reduce((s, p) => s + Number(p.amount), 0);

      await sendDocument(
        phone,
        invoiceMessage({
          patientName: to,
          clinic: invoice.clinic.name,
          invoiceNumber: invoice.invoiceNumber,
          total: Number(invoice.total),
          paid,
        }),
        `Invoice-${invoice.invoiceNumber}.pdf`,
        buf.toString("base64")
      );
    }

    // 4. Record it (non-fatal if this fails)
    try {
      await prisma.auditLog.create({
        data: {
          action: `WHATSAPP_${type}`,
          entityType,
          entityId: id,
          metadata: { to, phone, sentFrom: status.me?.number ?? null },
        },
      });
    } catch (e) {
      console.error("audit log failed:", e);
    }

    return NextResponse.json({ ok: true, to });
  } catch (e) {
    if (e instanceof HttpError || e instanceof WaError) {
      return NextResponse.json(
        { error: e.message, code: e.code },
        { status: e.status || 500 }
      );
    }
    console.error("whatsapp send error:", e);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}
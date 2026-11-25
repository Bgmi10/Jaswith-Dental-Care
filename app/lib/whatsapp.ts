/* Server-only helpers for talking to the wa-service. */

const BASE = process.env.WA_SERVICE_URL || "http://127.0.0.1:4001";
const KEY = process.env.WA_SERVICE_KEY || "";

export const GOOGLE_REVIEW_URL =
  process.env.GOOGLE_REVIEW_URL ||
  "https://search.google.com/local/writereview?placeid=ChIJV1pNUDllUjoRPI7fQ8ce0Pw";

export type WaState =
  | "offline"
  | "disconnected"
  | "starting"
  | "qr"
  | "authenticated"
  | "ready";

export type WaStatus = {
  state: WaState;
  qr?: string | null;
  me?: { name: string; number: string } | null;
  error?: string | null;
};

export class WaError extends Error {
  status: number;
  code?: string;
  constructor(message: string, status = 500, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

async function call(path: string, init: RequestInit = {}, timeoutMs = 60000) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${BASE}${path}`, {
      ...init,
      headers: {
        "content-type": "application/json",
        "x-api-key": KEY,
        ...(init.headers || {}),
      },
      signal: ctrl.signal,
      cache: "no-store",
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new WaError(
        data.error || `WhatsApp service error (${res.status})`,
        res.status,
        data.code
      );
    }
    return data;
  } catch (e) {
    if (e instanceof WaError) throw e;
    throw new WaError(
      "WhatsApp service is not reachable. Make sure it is running.",
      503,
      "OFFLINE"
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function getStatus(): Promise<WaStatus> {
  try {
    return (await call("/status", {}, 8000)) as WaStatus;
  } catch (e) {
    return {
      state: "offline",
      error: e instanceof Error ? e.message : "Service offline",
    };
  }
}

export const connectWa = () => call("/connect", { method: "POST" }, 10000);
export const logoutWa = () => call("/logout", { method: "POST" }, 30000);

export const sendText = (phone: string, message: string) =>
  call("/send-text", { method: "POST", body: JSON.stringify({ phone, message }) });

export const sendDocument = (
  phone: string,
  message: string,
  filename: string,
  base64: string
) =>
  call("/send-document", {
    method: "POST",
    body: JSON.stringify({ phone, message, filename, mimetype: "application/pdf", base64 }),
  });

/* ------------------------------------------------------------
   Message templates
------------------------------------------------------------ */

// Dates are stored as UTC midnight (from <input type="date">), so format in UTC.
export const fmtDate = (d: Date | string) =>
  new Date(d).toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });

export const fmtTime = (t?: string | null) => {
  if (!t) return null;
  const [h, m] = t.split(":").map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return t;
  const suffix = h >= 12 ? "PM" : "AM";
  return `${h % 12 || 12}:${String(m).padStart(2, "0")} ${suffix}`;
};

export const inr = (n: number) =>
  "₹" + n.toLocaleString("en-IN", { maximumFractionDigits: 2 });

export const thanksMessage = (patientName: string, clinic: string) =>
  `Hi ${patientName}, thank you for visiting ${clinic}! 😊

We hope your visit was comfortable. If you have a minute, we'd really appreciate your feedback. It helps other patients find us.

⭐ Rate us on Google:
${GOOGLE_REVIEW_URL}

Take care of your smile!
— ${clinic}`;

export const reminderMessage = (a: {
  patientName: string;
  clinic: string;
  date: Date | string;
  time?: string | null;
  reason?: string | null;
  address?: string | null;
  mapsUrl?: string | null;
}) => {
  const lines = [
    `Hello ${a.patientName}, this is a friendly reminder of your appointment at ${a.clinic}.`,
    "",
    `📅 Date: ${fmtDate(a.date)}`,
  ];
  const t = fmtTime(a.time);
  if (t) lines.push(`🕒 Time: ${t}`);
  if (a.reason) lines.push(`🦷 Reason: ${a.reason}`);
  if (a.address) lines.push(`📍 ${a.address}`);
  if (a.mapsUrl) lines.push(a.mapsUrl);
  lines.push("", "Please reply to this message if you need to reschedule. See you soon!");
  return lines.join("\n");
};

export const invoiceMessage = (i: {
  patientName: string;
  clinic: string;
  invoiceNumber: string;
  total: number;
  paid: number;
}) => {
  const balance = Math.max(0, i.total - i.paid);
  return `Hello ${i.patientName}, thank you for visiting ${i.clinic}.

Please find your bill ${i.invoiceNumber} attached.

Total: ${inr(i.total)}
Paid: ${inr(i.paid)}
Balance: ${inr(balance)}

Thank you!`;
};
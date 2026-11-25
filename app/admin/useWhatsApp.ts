"use client";

import { useCallback, useEffect, useState } from "react";

export type WaStatus = {
  state: "loading" | "offline" | "disconnected" | "starting" | "qr" | "authenticated" | "ready";
  qr?: string | null;
  me?: { name: string; number: string } | null;
  error?: string | null;
};

export type WaType = "THANKS" | "REMINDER" | "INVOICE";

export function useWhatsApp(fast: boolean) {
  const [status, setStatus] = useState<WaStatus>({ state: "loading" });

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/whatsapp/status", { cache: "no-store" });
      if (res.status === 401) {
        setStatus({ state: "offline", error: "Session expired. Please log in again." });
        return;
      }
      setStatus(await res.json());
    } catch {
      setStatus({ state: "offline", error: "Cannot reach the server." });
    }
  }, []);

  // Poll quickly on the WhatsApp tab (QR changes / scan detection), slowly elsewhere
  useEffect(() => {
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, fast ? 2500 : 20000);
    return () => clearInterval(timer);
  }, [fast, refresh]);

  const connect = useCallback(async () => {
    setStatus((s) => ({ ...s, state: "starting", error: null }));
    await fetch("/api/whatsapp/connect", { method: "POST" }).catch(() => {});
    refresh();
  }, [refresh]);

  const logout = useCallback(async () => {
    await fetch("/api/whatsapp/logout", { method: "POST" }).catch(() => {});
    refresh();
  }, [refresh]);

  return { status, refresh, connect, logout };
}

/** Returns true if the message was sent. */
export async function sendWhatsApp(
  type: WaType,
  id: string,
  onNotConnected?: () => void
): Promise<boolean> {
  const post = async (force: boolean) => {
    const res = await fetch("/api/whatsapp/send", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ type, id, force }),
    });
    return { status: res.status, data: await res.json().catch(() => ({} as any)) };
  };

  try {
    let { status, data } = await post(false);

    if (status === 409 && data.code === "DUPLICATE") {
      if (!confirm(`${data.error}\n\nSend again anyway?`)) return false;
      ({ status, data } = await post(true));
    }

    if (status === 409 && data.code === "NOT_CONNECTED") {
      alert(data.error);
      onNotConnected?.();
      return false;
    }

    if (status < 200 || status >= 300) {
      alert(data.error || "Failed to send WhatsApp message");
      return false;
    }

    alert(`WhatsApp message sent to ${data.to}`);
    return true;
  } catch {
    alert("Network error while sending. Please try again.");
    return false;
  }
}
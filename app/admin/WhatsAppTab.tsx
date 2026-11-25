"use client";

import type { WaStatus } from "./usewhatsapp";

type Props = {
  status: WaStatus;
  onConnect: () => void;
  onLogout: () => void;
};

export default function WhatsAppTab({ status, onConnect, onLogout }: Props) {
  const { state, qr, me, error } = status;

  return (
    <div className="card">
      <div className="section-title">
        <h2>WhatsApp</h2>
        <span>Link the clinic's WhatsApp to send thank-you messages, reminders and bills</span>
      </div>

      {state === "loading" && <p className="muted">Checking WhatsApp connection…</p>}

      {state === "offline" && (
        <div className="info-box" style={{ background: "#fdecea", borderColor: "#f5c2c0", color: "#8a1c14" }}>
          <span>
            <b>WhatsApp service is offline.</b> {error || ""} Start the <code>wa-service</code> process on the
            server and refresh this page.
          </span>
        </div>
      )}

      {state === "disconnected" && (
        <>
          {error && (
            <div className="info-box" style={{ marginBottom: 12 }}>
              <span>{error}</span>
            </div>
          )}
          <p className="muted">No WhatsApp account is linked right now.</p>
          <button onClick={onConnect}>Link WhatsApp</button>
        </>
      )}

      {state === "starting" && (
        <p className="muted">Starting WhatsApp… this can take 20–40 seconds. A QR code will appear here.</p>
      )}

      {state === "qr" && (
        <div style={{ display: "flex", gap: 24, flexWrap: "wrap", alignItems: "center" }}>
          {qr ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={qr} alt="WhatsApp QR code" width={280} height={280} style={{ border: "1px solid var(--line)", borderRadius: 8 }} />
          ) : (
            <p className="muted">Generating QR code…</p>
          )}
          <ol style={{ lineHeight: 1.8, margin: 0, paddingLeft: 18 }}>
            <li>Open WhatsApp on the clinic phone</li>
            <li>
              Go to <b>Settings → Linked devices</b>
            </li>
            <li>
              Tap <b>Link a device</b> and scan this QR code
            </li>
            <li className="muted">The code refreshes automatically</li>
          </ol>
        </div>
      )}

      {state === "authenticated" && <p className="muted">QR scanned. Loading your WhatsApp, please wait…</p>}

      {state === "ready" && (
        <>
          <div className="info-box">
            <span>
              <span className="badge ok">Connected</span>
              &nbsp; Logged in as <b>{me?.name || "WhatsApp user"}</b>
              {me?.number ? <> (+{me.number})</> : null}
            </span>
            <button
              className="danger"
              onClick={() => {
                if (confirm("Log out of WhatsApp? Messages cannot be sent until you link again.")) onLogout();
              }}
            >
              Log out
            </button>
          </div>

          <p className="muted" style={{ marginTop: 14 }}>
            Use the <b>Thanks + review</b> button in Patients, <b>Remind</b> in Appointments and{" "}
            <b>Send WhatsApp</b> in Billing. Messages go out one at a time with a short gap, from the number above.
          </p>
        </>
      )}
    </div>
  );
}
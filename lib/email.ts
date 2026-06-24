import { Resend } from "resend";

// Gracefully disabled when key is not configured
const resend = process.env.RESEND_API_KEY
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM = process.env.EMAIL_FROM ?? "AutoAce Support <tickets@autoace.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://autoace.com";

const SLA_LABELS: Record<string, string> = {
  P1: "Critical — response within 4 hours",
  P2: "High — response within 8 hours",
  P3: "Medium — response within 24 hours",
  P4: "Low — best effort",
};

const STATUS_LABELS: Record<string, string> = {
  NEW: "Received",
  TRIAGED: "Triaged — being assessed",
  IN_PROGRESS: "In Progress — engineer is working on it",
  BLOCKED: "Blocked — awaiting more information",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
};

export async function sendTicketConfirmation({
  to,
  submitterName,
  shortId,
  title,
  severity,
}: {
  to: string;
  submitterName: string;
  shortId: number;
  title: string;
  severity: string;
}) {
  if (!resend) return;
  const ticketNum = `#${String(shortId).padStart(3, "0")}`;
  const slaLabel = SLA_LABELS[severity] ?? "Response pending";

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Ticket ${ticketNum} received — AutoAce Support`,
    html: `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#111;max-width:560px;margin:0 auto;padding:24px">
<div style="background:#1e293b;border-radius:12px;padding:24px 28px;margin-bottom:24px">
  <p style="color:#94a3b8;font-size:12px;margin:0 0 4px">AutoAce Support</p>
  <h1 style="color:#fff;font-size:22px;margin:0">Your ticket is in the queue</h1>
</div>
<p>Hi <strong>${submitterName}</strong>,</p>
<p>We received your support request and have created <strong>Ticket ${ticketNum}</strong>.</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
  <p style="font-weight:600;margin:0 0 6px">${title}</p>
  <p style="color:#64748b;font-size:13px;margin:0">🎯 Priority: ${slaLabel}</p>
</div>
<p>We will follow up at <strong>${to}</strong> as soon as we have an update.</p>
<p style="color:#64748b;font-size:13px">— AutoAce Engineering Support</p>
</body></html>`.trim(),
  }).catch((err) => console.error("Email send failed:", err));
}

export async function sendStatusUpdateEmail({
  to,
  submitterName,
  shortId,
  title,
  newStatus,
}: {
  to: string;
  submitterName: string;
  shortId: number;
  title: string;
  newStatus: string;
}) {
  if (!resend) return;
  const ticketNum = `#${String(shortId).padStart(3, "0")}`;
  const statusLabel = STATUS_LABELS[newStatus] ?? newStatus;
  const isResolved = ["RESOLVED", "CLOSED"].includes(newStatus);

  await resend.emails.send({
    from: FROM,
    to,
    subject: `Update on Ticket ${ticketNum} — ${statusLabel}`,
    html: `
<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;color:#111;max-width:560px;margin:0 auto;padding:24px">
<div style="background:${isResolved ? "#16a34a" : "#1e293b"};border-radius:12px;padding:24px 28px;margin-bottom:24px">
  <p style="color:#d1fae5;font-size:12px;margin:0 0 4px">AutoAce Support · Ticket ${ticketNum}</p>
  <h1 style="color:#fff;font-size:22px;margin:0">${isResolved ? "Your issue is resolved ✓" : "Status update on your ticket"}</h1>
</div>
<p>Hi <strong>${submitterName}</strong>,</p>
<p>There is an update on your support ticket.</p>
<div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0">
  <p style="font-weight:600;margin:0 0 6px">${title}</p>
  <p style="font-size:13px;margin:0">New status: <strong>${statusLabel}</strong></p>
</div>
${isResolved
  ? `<p>If the issue comes back, please submit a new ticket at <a href="${APP_URL}/submit">${APP_URL}/submit</a>.</p>`
  : `<p>You will receive another email when there is a further update.</p>`
}
<p style="color:#64748b;font-size:13px">— AutoAce Engineering Support</p>
</body></html>`.trim(),
  }).catch((err) => console.error("Email send failed:", err));
}

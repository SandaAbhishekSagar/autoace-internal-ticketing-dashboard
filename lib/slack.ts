const WEBHOOK = process.env.SLACK_WEBHOOK_URL;

const SEV_EMOJI: Record<string, string> = {
  P1: "🔴",
  P2: "🟠",
  P3: "🟡",
  P4: "⚪",
};

const STATUS_EMOJI: Record<string, string> = {
  NEW: "🆕",
  TRIAGED: "🔍",
  IN_PROGRESS: "⚙️",
  BLOCKED: "🚫",
  RESOLVED: "✅",
  CLOSED: "🔒",
};

async function post(body: object) {
  if (!WEBHOOK) return;
  await fetch(WEBHOOK, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  }).catch((err) => console.error("Slack webhook error:", err));
}

export async function notifyNewTicket({
  shortId,
  title,
  severity,
  submitterName,
  customerName,
  issueType,
  ticketUrl,
}: {
  shortId: number;
  title: string;
  severity: string;
  submitterName: string;
  customerName?: string | null;
  issueType: string;
  ticketUrl: string;
}) {
  // Only alert on P1/P2 to avoid noise
  if (!["P1", "P2"].includes(severity)) return;

  const emoji = SEV_EMOJI[severity] ?? "⚪";
  const ticketNum = `#${String(shortId).padStart(3, "0")}`;

  await post({
    text: `${emoji} *New ${severity} ticket* — ${ticketNum}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${emoji} *New ${severity} ticket* — <${ticketUrl}|${ticketNum}>\n*${title}*`,
        },
      },
      {
        type: "section",
        fields: [
          { type: "mrkdwn", text: `*Submitted by:*\n${submitterName}` },
          { type: "mrkdwn", text: `*Type:*\n${issueType.replace(/_/g, " ")}` },
          ...(customerName
            ? [{ type: "mrkdwn", text: `*Customer:*\n${customerName}` }]
            : []),
        ],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "View Ticket" },
            url: ticketUrl,
            style: "primary",
          },
        ],
      },
    ],
  });
}

export async function notifyStatusChange({
  shortId,
  title,
  severity,
  newStatus,
  changedByName,
  ticketUrl,
}: {
  shortId: number;
  title: string;
  severity: string;
  newStatus: string;
  changedByName: string;
  ticketUrl: string;
}) {
  // Only notify status changes for P1/P2 tickets
  if (!["P1", "P2"].includes(severity)) return;

  const sevEmoji = SEV_EMOJI[severity] ?? "⚪";
  const statusEmoji = STATUS_EMOJI[newStatus] ?? "📋";
  const ticketNum = `#${String(shortId).padStart(3, "0")}`;
  const statusLabel = newStatus.replace(/_/g, " ");

  await post({
    text: `${statusEmoji} Ticket ${ticketNum} → ${statusLabel}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `${statusEmoji} ${sevEmoji} <${ticketUrl}|${ticketNum}> moved to *${statusLabel}*\n${title}`,
        },
      },
      {
        type: "context",
        elements: [
          { type: "mrkdwn", text: `Changed by *${changedByName}*` },
        ],
      },
    ],
  });
}

export async function notifyAssignment({
  shortId,
  title,
  severity,
  assigneeName,
  ticketUrl,
}: {
  shortId: number;
  title: string;
  severity: string;
  assigneeName: string;
  ticketUrl: string;
}) {
  const emoji = SEV_EMOJI[severity] ?? "⚪";
  const ticketNum = `#${String(shortId).padStart(3, "0")}`;

  await post({
    text: `👤 Ticket ${ticketNum} assigned to ${assigneeName}`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `👤 ${emoji} <${ticketUrl}|${ticketNum}> assigned to *${assigneeName}*\n${title}`,
        },
      },
    ],
  });
}

export async function notifySlaEscalation({
  shortId,
  title,
  severity,
  onCallName,
  ticketUrl,
}: {
  shortId: number;
  title: string;
  severity: string;
  onCallName: string | null;
  ticketUrl: string;
}) {
  const emoji = SEV_EMOJI[severity] ?? "🔴";
  const ticketNum = `#${String(shortId).padStart(3, "0")}`;
  const onCallLine = onCallName
    ? `On-call engineer: *${onCallName}*`
    : "No on-call engineer is currently set";

  await post({
    text: `⏰ SLA BREACH — ${ticketNum} needs immediate response`,
    blocks: [
      {
        type: "section",
        text: {
          type: "mrkdwn",
          text: `⏰ *SLA BREACH* ${emoji} <${ticketUrl}|${ticketNum}> — *${title}*\n${severity} ticket has no first response past SLA threshold.`,
        },
      },
      {
        type: "context",
        elements: [{ type: "mrkdwn", text: onCallLine }],
      },
      {
        type: "actions",
        elements: [
          {
            type: "button",
            text: { type: "plain_text", text: "Respond Now" },
            url: ticketUrl,
            style: "danger",
          },
        ],
      },
    ],
  });
}

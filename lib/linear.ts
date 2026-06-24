import type { Status } from "@prisma/client";

const API_KEY = process.env.LINEAR_API_KEY;
const TEAM_ID_OR_KEY = process.env.LINEAR_TEAM_ID;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

interface LinearGraphQLError {
  message: string;
  extensions?: {
    userPresentableMessage?: string;
    validationErrors?: unknown[];
  };
}

async function linearQuery<T>(
  query: string,
  variables?: Record<string, unknown>
): Promise<T | null> {
  if (!API_KEY) return null;

  const res = await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: API_KEY,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    console.error("Linear API error:", await res.text());
    return null;
  }

  const json = await res.json();
  if (json.errors?.length) {
    const errors = json.errors as LinearGraphQLError[];
    for (const err of errors) {
      const detail =
        err.extensions?.userPresentableMessage ?? err.message;
      console.error("Linear GraphQL error:", detail, err.extensions?.validationErrors);
    }
    return null;
  }
  return json.data as T;
}

/** LINEAR_TEAM_ID must be a team UUID, or a team key like ENG (resolved via API). */
async function resolveTeamId(): Promise<string | null> {
  if (!TEAM_ID_OR_KEY) return null;

  if (UUID_RE.test(TEAM_ID_OR_KEY)) {
    return TEAM_ID_OR_KEY;
  }

  const data = await linearQuery<{
    teams: { nodes: { id: string; key: string; name: string }[] };
  }>(`query { teams { nodes { id key name } } }`);

  const match = data?.teams?.nodes?.find(
    (t) => t.key.toLowerCase() === TEAM_ID_OR_KEY.toLowerCase()
  );

  if (match) {
    console.info(
      `Linear: resolved team key "${TEAM_ID_OR_KEY}" → ${match.name} (${match.id})`
    );
    return match.id;
  }

  console.error(
    `Linear: LINEAR_TEAM_ID "${TEAM_ID_OR_KEY}" is not a UUID and no team key matches. ` +
      `Set LINEAR_TEAM_ID to a UUID from: query { teams { nodes { id key name } } }`
  );
  return null;
}

export async function createLinearIssue({
  title,
  description,
  ticketUrl,
  shortId,
  severity,
}: {
  title: string;
  description: string;
  ticketUrl: string;
  shortId: number;
  severity: string;
}): Promise<{ id: string; identifier: string; url: string } | null> {
  if (!API_KEY || !TEAM_ID_OR_KEY) {
    console.error("Linear: LINEAR_API_KEY or LINEAR_TEAM_ID not configured");
    return null;
  }

  const teamId = await resolveTeamId();
  if (!teamId) return null;

  const ticketNum = `#${String(shortId).padStart(3, "0")}`;
  const body = `${description}\n\n---\nAutoAce Ticket: ${ticketUrl}\nSeverity: ${severity}`;

  const data = await linearQuery<{
    issueCreate: {
      success: boolean;
      issue: { id: string; identifier: string; url: string } | null;
    };
  }>(
    `mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
        issue { id identifier url }
      }
    }`,
    {
      input: {
        teamId,
        title: `${ticketNum} ${title}`,
        description: body,
      },
    }
  );

  if (!data?.issueCreate?.success || !data.issueCreate.issue) {
    console.error("Linear: issueCreate did not return an issue");
    return null;
  }
  return data.issueCreate.issue;
}

/** Map Linear workflow state types to AutoAce ticket statuses. */
export function mapLinearStateToStatus(stateType: string): Status | null {
  switch (stateType) {
    case "started":
      return "IN_PROGRESS";
    case "completed":
      return "RESOLVED";
    case "canceled":
      return "CLOSED";
    case "backlog":
    case "unstarted":
      return "TRIAGED";
    default:
      return null;
  }
}

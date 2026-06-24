import type { Status } from "@prisma/client";

const API_KEY = process.env.LINEAR_API_KEY;
const TEAM_ID = process.env.LINEAR_TEAM_ID;

async function linearQuery<T>(query: string, variables?: Record<string, unknown>): Promise<T | null> {
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
    console.error("Linear GraphQL errors:", json.errors);
    return null;
  }
  return json.data as T;
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
  if (!API_KEY || !TEAM_ID) return null;

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
        teamId: TEAM_ID,
        title: `${ticketNum} ${title}`,
        description: body,
      },
    }
  );

  if (!data?.issueCreate?.success || !data.issueCreate.issue) return null;
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

import { PrismaClient } from "@prisma/client";
import { subDays, subHours, subMinutes } from "date-fns";

const prisma = new PrismaClient();

const dealerships = [
  "Sunset Toyota",
  "Bay Area Ford",
  "Chevrolet of Sacramento",
  "Premier Honda",
  "Valley Nissan",
  "Desert Dodge",
];

const ticketData = [
  {
    title: "AI call dropped before appointment was confirmed — Sunset Toyota",
    description:
      "The AI call connected but dropped around the 2-minute mark before the customer could confirm their appointment. This happened on 3 separate calls today. Customer was left confused and had to call back manually.",
    issueType: "CALL_FAILURE" as const,
    severity: "P1" as const,
    dealershipName: "Sunset Toyota",
    status: "NEW" as const,
    hoursAgo: 13,
  },
  {
    title: "Transfer to human not triggering on escalation keyword 'manager'",
    description:
      "When customers say 'I want to speak to a manager' the AI is not transferring the call as configured. The AI instead continues trying to handle the appointment booking. This is causing customer frustration.",
    issueType: "BUG" as const,
    severity: "P1" as const,
    dealershipName: "Bay Area Ford",
    status: "NEW" as const,
    hoursAgo: 10,
  },
  {
    title: "Customer double-booked — AI scheduled two appointments same slot",
    description:
      "A customer called in to book a service appointment and was given a time slot. When she arrived, there was already another customer in that slot. Seems the availability check is not working correctly with Valley Nissan's DMS.",
    issueType: "INTEGRATION" as const,
    severity: "P1" as const,
    dealershipName: "Valley Nissan",
    status: "NEW" as const,
    hoursAgo: 6,
  },
  {
    title: "Voicemail detection failing intermittently — Bay Area Ford calls",
    description:
      "About 30% of calls to Bay Area Ford are landing on voicemail but the AI is not detecting this correctly. It leaves a full appointment-booking script on the voicemail instead of a brief message or hanging up.",
    issueType: "CALL_FAILURE" as const,
    severity: "P2" as const,
    dealershipName: "Bay Area Ford",
    status: "NEW" as const,
    hoursAgo: 9,
  },
  {
    title: "Dashboard showing wrong availability for Valley Nissan service bays",
    description:
      "The service bay availability shown to the AI is 2 days behind. When customers call, the AI is booking into slots that are already taken. The DMS sync seems to have stopped updating around 48 hours ago.",
    issueType: "INTEGRATION" as const,
    severity: "P2" as const,
    dealershipName: "Valley Nissan",
    status: "NEW" as const,
    hoursAgo: 11,
  },
  {
    title: "AI call transcript missing for 3 calls on June 14th — Premier Honda",
    description:
      "Call monitor flagged that transcripts for three calls on June 14th between 2pm and 4pm are not showing up in the dashboard. The calls did occur (confirmed in phone logs) but transcripts are missing.",
    issueType: "BUG" as const,
    severity: "P2" as const,
    dealershipName: "Premier Honda",
    status: "NEW" as const,
    hoursAgo: 5,
  },
  {
    title: "Customer reported AI was speaking over them during confirmation",
    description:
      "Customer called our support line to complain that the AI interrupted them multiple times while they were answering questions. This creates a very poor experience. Call recording attached.",
    issueType: "CUSTOMER_ISSUE" as const,
    severity: "P2" as const,
    customerName: "Robert Torres",
    status: "TRIAGED" as const,
    hoursAgo: 28,
  },
  {
    title: "Scheduling webhook returning 500 for Chevrolet of Sacramento",
    description:
      "Starting around 8am this morning, all scheduling webhooks to Chevrolet of Sacramento are returning HTTP 500. The dealership has not changed anything on their end. No appointments can be booked.",
    issueType: "INTEGRATION" as const,
    severity: "P1" as const,
    dealershipName: "Chevrolet of Sacramento",
    status: "TRIAGED" as const,
    hoursAgo: 20,
  },
  {
    title: "Call monitor flagged: AI gave wrong service hours to customer",
    description:
      "The AI told a customer that Desert Dodge's service department closes at 6pm on Saturdays. The actual hours are 8am-2pm. The customer showed up at 5pm and the service department was closed.",
    issueType: "CUSTOMER_ISSUE" as const,
    severity: "P2" as const,
    dealershipName: "Desert Dodge",
    status: "TRIAGED" as const,
    hoursAgo: 36,
  },
  {
    title: "Integration with DMS failing silently on appointment writes",
    description:
      "Appointments are being confirmed to customers but are not appearing in the DMS. The API call to the DMS returns 200 but records are not created. This has been happening for the last 6 hours.",
    issueType: "INTEGRATION" as const,
    severity: "P1" as const,
    dealershipName: "Sunset Toyota",
    status: "TRIAGED" as const,
    hoursAgo: 7,
  },
  {
    title: "AI not recognizing 'cancel' intent when spoken with heavy accent",
    description:
      "Multiple customers with non-native English accents have reported that the AI does not understand when they say they want to cancel. It keeps moving forward with booking instead of canceling.",
    issueType: "BUG" as const,
    severity: "P3" as const,
    dealershipName: "Premier Honda",
    status: "TRIAGED" as const,
    hoursAgo: 48,
  },
  {
    title: "Call flow for recalls not following script update from last week",
    description:
      "We updated the recall handling script last Tuesday but calls are still following the old flow. The AI is not directing customers to the recall team phone line. Need to verify the deployment went through.",
    issueType: "OPS_REQUEST" as const,
    severity: "P3" as const,
    dealershipName: "Bay Area Ford",
    status: "IN_PROGRESS" as const,
    hoursAgo: 72,
  },
  {
    title: "Duplicate confirmation texts being sent after appointments booked",
    description:
      "Customers are receiving 2 or 3 SMS confirmation texts after booking an appointment. Some customers are calling to ask if their appointment was double-booked. It was not — they're just getting duplicate messages.",
    issueType: "BUG" as const,
    severity: "P2" as const,
    dealershipName: "Valley Nissan",
    status: "IN_PROGRESS" as const,
    hoursAgo: 50,
  },
  {
    title: "After-hours call handling not routing to emergency line",
    description:
      "Calls to Sunset Toyota after 7pm are supposed to offer the option to reach an emergency line for active vehicle breakdowns. This option is not being presented — the AI just says to call back during business hours.",
    issueType: "CALL_FAILURE" as const,
    severity: "P2" as const,
    dealershipName: "Sunset Toyota",
    status: "IN_PROGRESS" as const,
    hoursAgo: 60,
  },
  {
    title: "Spanish language calls not transitioning back to English correctly",
    description:
      "When a Spanish-language call is transferred and the receiving agent speaks English, the AI should adjust. Currently it stays in Spanish mode even when the context clearly shifted to English.",
    issueType: "BUG" as const,
    severity: "P3" as const,
    dealershipName: "Desert Dodge",
    status: "IN_PROGRESS" as const,
    hoursAgo: 96,
  },
  {
    title: "CRM sync delay causing outdated customer info in AI responses",
    description:
      "When a customer updates their contact info in the CRM, the AI is still pulling the old data. This is causing the AI to confirm wrong phone numbers and email addresses during calls.",
    issueType: "INTEGRATION" as const,
    severity: "P3" as const,
    dealershipName: "Chevrolet of Sacramento",
    status: "IN_PROGRESS" as const,
    hoursAgo: 80,
  },
  {
    title: "AI confirming appointments outside configured hours — Premier Honda",
    description:
      "The AI booked several appointments on a Sunday morning when Premier Honda is closed. The hours configuration appears correct in our system but is not being enforced during booking.",
    issueType: "BUG" as const,
    severity: "P2" as const,
    dealershipName: "Premier Honda",
    status: "BLOCKED" as const,
    hoursAgo: 100,
  },
  {
    title: "Customer data not being written to follow-up queue after call",
    description:
      "Post-call follow-up tasks are not being created for calls where the customer requested a callback. Engineering is looking into whether this is a Zapier webhook issue or a backend queue issue.",
    issueType: "INTEGRATION" as const,
    severity: "P2" as const,
    dealershipName: "Bay Area Ford",
    status: "BLOCKED" as const,
    hoursAgo: 110,
  },
  {
    title: "AI reading out full VIN number unprompted during service check-in",
    description:
      "During service check-in calls, the AI is reading out the full 17-character VIN of the vehicle. This was not part of the agreed flow and customers find it confusing and unnecessarily long.",
    issueType: "OPS_REQUEST" as const,
    severity: "P3" as const,
    dealershipName: "Sunset Toyota",
    status: "BLOCKED" as const,
    hoursAgo: 120,
  },
  {
    title: "Callback number not being captured when customer speaks too fast",
    description:
      "When customers leave a callback number quickly, the AI is missing digits or capturing wrong numbers. This is causing failed callbacks. We need better digit-by-digit confirmation in the flow.",
    issueType: "CALL_FAILURE" as const,
    severity: "P3" as const,
    customerName: "Maria Gonzalez",
    status: "RESOLVED" as const,
    hoursAgo: 180,
  },
  {
    title: "Incorrect dealership name spoken during greeting — Desert Dodge",
    description:
      "The AI was greeting callers with 'Welcome to Desert Ford' instead of 'Desert Dodge' for about 4 hours. The issue was traced to a configuration file being overwritten during a deployment.",
    issueType: "BUG" as const,
    severity: "P2" as const,
    dealershipName: "Desert Dodge",
    status: "RESOLVED" as const,
    hoursAgo: 200,
  },
  {
    title: "Old Chevrolet inventory data being referenced by AI during upsell",
    description:
      "The AI is referencing inventory items that were sold weeks ago when doing soft upsells. The inventory feed needs to be refreshed more frequently or the AI needs to stop referencing specific inventory.",
    issueType: "INTEGRATION" as const,
    severity: "P3" as const,
    dealershipName: "Chevrolet of Sacramento",
    status: "RESOLVED" as const,
    hoursAgo: 250,
  },
  {
    title: "Customer complaint: AI was rude and dismissive during service call",
    description:
      "We received a written complaint from a customer at Premier Honda saying the AI was dismissive when they explained they had a tight schedule. The tone settings may have been off for this call.",
    issueType: "CUSTOMER_ISSUE" as const,
    severity: "P3" as const,
    dealershipName: "Premier Honda",
    status: "RESOLVED" as const,
    hoursAgo: 300,
  },
  {
    title: "Operator requesting new reporting metrics for weekly call review",
    description:
      "The operations team needs a weekly report that shows: total calls handled, average call duration, top 3 cancellation reasons, and NPS from post-call surveys. Requesting as a dashboard export or scheduled email.",
    issueType: "OPS_REQUEST" as const,
    severity: "P4" as const,
    status: "RESOLVED" as const,
    hoursAgo: 320,
  },
  {
    title: "AI pause too short between question and expected response",
    description:
      "The silence timeout before the AI re-prompts the customer seems too short — about 1.5 seconds. Elderly customers in particular are getting cut off. Recommend increasing to 3 seconds minimum.",
    issueType: "OPS_REQUEST" as const,
    severity: "P3" as const,
    dealershipName: "Valley Nissan",
    status: "RESOLVED" as const,
    hoursAgo: 360,
  },
  {
    title: "Service reminder calls going to wrong contact at Sunset Toyota fleet",
    description:
      "Fleet account service reminders are going to the fleet manager's personal cell instead of the fleet coordinator line. The contact record appears to be correct in the CRM.",
    issueType: "CUSTOMER_ISSUE" as const,
    severity: "P2" as const,
    dealershipName: "Sunset Toyota",
    status: "RESOLVED" as const,
    hoursAgo: 400,
  },
  {
    title: "All call recordings missing for Bay Area Ford on June 10th",
    description:
      "No call recordings exist for Bay Area Ford from June 10th. The calls were handled (confirmed by call logs) but the recordings were not saved to storage. Investigating storage bucket permissions.",
    issueType: "BUG" as const,
    severity: "P2" as const,
    dealershipName: "Bay Area Ford",
    status: "CLOSED" as const,
    hoursAgo: 500,
  },
  {
    title: "AI not handling 'I already have an appointment' response gracefully",
    description:
      "When a customer says they already have an appointment booked, the AI should offer to look it up or transfer. Currently it's continuing the booking flow as if the customer said nothing.",
    issueType: "CALL_FAILURE" as const,
    severity: "P3" as const,
    dealershipName: "Premier Honda",
    status: "CLOSED" as const,
    hoursAgo: 550,
  },
  {
    title: "Request to add new intent: 'I want to speak about a recall'",
    description:
      "We need to add a new top-level intent for recall inquiries. When a customer mentions a recall, we need to route them directly to the service manager rather than going through the standard service booking flow.",
    issueType: "OPS_REQUEST" as const,
    severity: "P4" as const,
    dealershipName: "Desert Dodge",
    status: "CLOSED" as const,
    hoursAgo: 600,
  },
  {
    title: "Call volume spike causing queue timeouts — Chevrolet of Sacramento",
    description:
      "During the lunch rush on Friday, Chevrolet of Sacramento experienced a call volume spike that caused some calls to time out before connecting to the AI. Need to investigate auto-scaling configuration.",
    issueType: "CALL_FAILURE" as const,
    severity: "P1" as const,
    dealershipName: "Chevrolet of Sacramento",
    status: "CLOSED" as const,
    hoursAgo: 700,
  },
];

async function main() {
  console.log("🌱 Seeding AutoAce Tickets...");

  // Clear existing data
  await prisma.statusHistory.deleteMany();
  await prisma.comment.deleteMany();
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  console.log("✅ Cleared existing data");

  // Create users (without Supabase auth - supabaseId will be null for now)
  const users = await Promise.all([
    prisma.user.create({
      data: {
        name: "Alex Rivera",
        email: "admin@autoace.com",
        role: "ADMIN",
      },
    }),
    prisma.user.create({
      data: {
        name: "Jordan Kim",
        email: "engineer1@autoace.com",
        role: "ENGINEER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Sam Patel",
        email: "engineer2@autoace.com",
        role: "ENGINEER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Chris Morgan",
        email: "engineer3@autoace.com",
        role: "ENGINEER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Taylor Brooks",
        email: "operator1@autoace.com",
        role: "OPERATOR",
      },
    }),
    prisma.user.create({
      data: {
        name: "Morgan Ellis",
        email: "operator2@autoace.com",
        role: "OPERATOR",
      },
    }),
    prisma.user.create({
      data: {
        name: "Dana Cooper",
        email: "submitter1@autoace.com",
        role: "SUBMITTER",
      },
    }),
    prisma.user.create({
      data: {
        name: "Jamie Walsh",
        email: "submitter2@autoace.com",
        role: "SUBMITTER",
      },
    }),
  ]);

  const [admin, eng1, eng2, eng3, op1, op2, sub1, sub2] = users;
  const engineers = [eng1, eng2, eng3];
  console.log(`✅ Created ${users.length} users`);

  // Create tickets
  const createdTickets = [];
  for (let i = 0; i < ticketData.length; i++) {
    const td = ticketData[i];
    const submitter = [sub1, sub2, op1, op2][i % 4];
    const engineer = engineers[i % 3];
    const createdAt = subHours(new Date(), td.hoursAgo);

    // Determine timestamps based on status
    const triagedAt = ["TRIAGED", "IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"].includes(
      td.status
    )
      ? subHours(createdAt, -Math.random() * 2)
      : null;
    const firstResponseAt = ["TRIAGED", "IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"].includes(
      td.status
    )
      ? subMinutes(createdAt, -(30 + Math.random() * 120))
      : null;
    const resolvedAt =
      td.status === "RESOLVED" || td.status === "CLOSED"
        ? subHours(createdAt, -(td.hoursAgo * 0.3))
        : null;
    const closedAt = td.status === "CLOSED" ? subHours(new Date(), Math.random() * 24) : null;

    const assigneeId =
      ["IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"].includes(td.status) ||
      (td.status === "TRIAGED" && Math.random() > 0.5)
        ? engineer.id
        : null;

    const ticket = await prisma.ticket.create({
      data: {
        title: td.title,
        description: td.description,
        issueType: td.issueType,
        severity: td.severity,
        status: td.status,
        submitterId: submitter.id,
        submitterName: submitter.name,
        submitterEmail: submitter.email,
        customerName: td.customerName,
        dealershipName: td.dealershipName,
        assigneeId,
        createdAt,
        updatedAt: createdAt,
        triagedAt,
        firstResponseAt,
        resolvedAt,
        closedAt,
        links: [],
        attachmentUrls: [],
      },
    });

    // Status history
    await prisma.statusHistory.create({
      data: {
        ticketId: ticket.id,
        fromStatus: null,
        toStatus: "NEW",
        changedById: submitter.id,
        changedAt: createdAt,
      },
    });

    if (triagedAt) {
      await prisma.statusHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus: "NEW",
          toStatus: "TRIAGED",
          changedById: engineer.id,
          changedAt: triagedAt,
        },
      });
    }

    if (["IN_PROGRESS", "BLOCKED", "RESOLVED", "CLOSED"].includes(td.status)) {
      await prisma.statusHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus: "TRIAGED",
          toStatus: "IN_PROGRESS",
          changedById: engineer.id,
          changedAt: subHours(createdAt, -(td.hoursAgo * 0.1)),
        },
      });
    }

    if (td.status === "BLOCKED") {
      await prisma.statusHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus: "IN_PROGRESS",
          toStatus: "BLOCKED",
          changedById: engineer.id,
          note: "Waiting on vendor response",
          changedAt: subHours(createdAt, -(td.hoursAgo * 0.15)),
        },
      });
    }

    if (resolvedAt) {
      await prisma.statusHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus: "IN_PROGRESS",
          toStatus: "RESOLVED",
          changedById: engineer.id,
          changedAt: resolvedAt,
        },
      });
    }

    if (closedAt) {
      await prisma.statusHistory.create({
        data: {
          ticketId: ticket.id,
          fromStatus: "RESOLVED",
          toStatus: "CLOSED",
          changedById: admin.id,
          changedAt: closedAt,
        },
      });
    }

    // Comments
    const commentAuthors = [engineer, eng2, admin];
    const numComments = 1 + Math.floor(Math.random() * 3);
    for (let c = 0; c < numComments; c++) {
      const author = commentAuthors[c % commentAuthors.length];
      const isInternal = c > 0 && Math.random() > 0.5;
      await prisma.comment.create({
        data: {
          ticketId: ticket.id,
          authorId: author.id,
          authorName: author.name,
          isInternal,
          createdAt: subHours(createdAt, -(td.hoursAgo * (0.1 * (c + 1)))),
          body: isInternal
            ? `[Internal] Investigating root cause. ${
                c === 0
                  ? "Reproduced the issue in staging."
                  : "Need to check vendor logs."
              }`
            : c === 0
            ? `Hi, we've received your report and are looking into this. We'll update you as soon as we have more information.`
            : `Update: We've identified the cause and are working on a fix. Expected resolution within a few hours.`,
        },
      });
    }

    createdTickets.push(ticket);
  }

  console.log(`✅ Created ${createdTickets.length} tickets with history and comments`);
  console.log("");
  console.log("Demo accounts (password: Password123! — create in Supabase Auth manually):");
  console.log("  admin@autoace.com        → Admin");
  console.log("  engineer1@autoace.com    → Engineer");
  console.log("  engineer2@autoace.com    → Engineer");
  console.log("  engineer3@autoace.com    → Engineer");
  console.log("  operator1@autoace.com    → Operator");
  console.log("  operator2@autoace.com    → Operator");
  console.log("  submitter1@autoace.com   → Submitter");
  console.log("  submitter2@autoace.com   → Submitter");
  console.log("");
  console.log("🎉 Seeding complete!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

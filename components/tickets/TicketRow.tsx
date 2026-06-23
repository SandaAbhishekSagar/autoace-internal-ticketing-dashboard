"use client";

import { formatDistanceToNow, format } from "date-fns";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { StatusBadge } from "./StatusBadge";
import { SeverityBadge } from "./SeverityBadge";
import { TypeBadge } from "./TypeBadge";
import type { TicketSummary } from "@/types";
import type { Status } from "@prisma/client";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface TicketRowProps {
  ticket: TicketSummary;
  selected: boolean;
  onSelect: (id: string, checked: boolean) => void;
  onClick: (id: string) => void;
  onStatusChange: (id: string, status: Status) => void;
  currentUserId?: string;
  onAssignToMe: (id: string) => void;
}

const statusOptions: { value: Status; label: string }[] = [
  { value: "NEW", label: "New" },
  { value: "TRIAGED", label: "Triaged" },
  { value: "IN_PROGRESS", label: "In Progress" },
  { value: "BLOCKED", label: "Blocked" },
  { value: "RESOLVED", label: "Resolved" },
  { value: "CLOSED", label: "Closed" },
];

export function TicketRow({
  ticket,
  selected,
  onSelect,
  onClick,
  onStatusChange,
  onAssignToMe,
}: TicketRowProps) {
  const rowClass = ticket.isSLABreached
    ? "bg-red-50 hover:bg-red-100"
    : ticket.isSLAAtRisk
    ? "bg-amber-50 hover:bg-amber-100"
    : "bg-white hover:bg-gray-50";

  const copyLink = () => {
    navigator.clipboard.writeText(`${window.location.origin}/tickets/${ticket.id}`);
    toast.success("Link copied");
  };

  const truncate = (s: string, n: number) =>
    s.length > n ? s.slice(0, n) + "…" : s;

  return (
    <tr className={cn("border-b transition-colors", rowClass)}>
      <td className="pl-4 pr-2 py-3 w-10">
        <Checkbox
          checked={selected}
          onCheckedChange={(c) => onSelect(ticket.id, !!c)}
        />
      </td>
      <td className="px-3 py-3 text-sm text-gray-400 font-mono w-16">
        #{String(ticket.shortId).padStart(3, "0")}
      </td>
      <td
        className="px-3 py-3 cursor-pointer max-w-xs"
        onClick={() => onClick(ticket.id)}
      >
        <span
          className="font-medium text-gray-900 hover:text-blue-600 text-sm"
          title={ticket.title}
        >
          {truncate(ticket.title, 55)}
        </span>
        {ticket._count && ticket._count.comments > 0 && (
          <span className="ml-2 text-xs text-gray-400">
            💬 {ticket._count.comments}
          </span>
        )}
      </td>
      <td className="px-3 py-3">
        <TypeBadge type={ticket.issueType} />
      </td>
      <td className="px-3 py-3">
        <SeverityBadge severity={ticket.severity} />
      </td>
      <td className="px-3 py-3">
        <StatusBadge status={ticket.status} />
      </td>
      <td className="px-3 py-3 text-sm">
        {ticket.assignee ? (
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs flex items-center justify-center font-medium">
              {ticket.assignee.name
                .split(" ")
                .map((n) => n[0])
                .join("")
                .slice(0, 2)
                .toUpperCase()}
            </div>
            <span className="text-gray-700 text-xs">{ticket.assignee.name}</span>
          </div>
        ) : (
          <span className="text-gray-400 italic text-xs">Unassigned</span>
        )}
      </td>
      <td className="px-3 py-3 text-sm text-gray-600 max-w-[120px]">
        <span title={ticket.dealershipName || ticket.customerName || ""}>
          {truncate(ticket.dealershipName || ticket.customerName || "—", 20)}
        </span>
      </td>
      <td
        className="px-3 py-3 text-xs text-gray-500"
        title={format(new Date(ticket.createdAt), "PPpp")}
      >
        {formatDistanceToNow(new Date(ticket.createdAt), { addSuffix: true })}
      </td>
      <td className="px-3 py-3">
        <DropdownMenu>
          <DropdownMenuTrigger
            render={<Button variant="ghost" size="sm" className="h-7 w-7 p-0" />}
          >
            <MoreHorizontal className="h-4 w-4" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => onAssignToMe(ticket.id)}>
              Assign to me
            </DropdownMenuItem>
            <DropdownMenuSub>
              <DropdownMenuSubTrigger>Change status</DropdownMenuSubTrigger>
              <DropdownMenuSubContent>
                {statusOptions.map((s) => (
                  <DropdownMenuItem
                    key={s.value}
                    onClick={() => onStatusChange(ticket.id, s.value)}
                    className={ticket.status === s.value ? "font-semibold" : ""}
                  >
                    {s.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuSubContent>
            </DropdownMenuSub>
            <DropdownMenuItem onClick={() => onClick(ticket.id)}>
              View detail
            </DropdownMenuItem>
            <DropdownMenuItem onClick={copyLink}>
              Copy ticket link
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </td>
    </tr>
  );
}

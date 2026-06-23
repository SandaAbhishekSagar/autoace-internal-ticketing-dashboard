"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { ChevronDown } from "lucide-react";
import { toast } from "sonner";
import type { Status, Severity, Priority, IssueType, Role } from "@prisma/client";

interface TicketActionsProps {
  ticket: {
    id: string;
    status: Status;
    severity: Severity;
    priority: Priority;
    assigneeId: string | null;
    issueType: IssueType;
  };
  engineers: { id: string; name: string }[];
  role: Role;
  currentUserId?: string;
}

export function TicketActions({ ticket, engineers, role }: TicketActionsProps) {
  const router = useRouter();
  const [status, setStatus] = useState<Status>(ticket.status);
  const [severity, setSeverity] = useState<Severity>(ticket.severity);
  const [priority, setPriority] = useState<Priority>(ticket.priority);
  const [assigneeId, setAssigneeId] = useState<string>(ticket.assigneeId ?? "");
  const [saving, setSaving] = useState(false);
  const [showDanger, setShowDanger] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");

  const isEngineerOrAdmin = ["ENGINEER", "ADMIN"].includes(role);
  const isAdmin = role === "ADMIN";

  if (!isEngineerOrAdmin) {
    return (
      <Card>
        <CardContent className="pt-5">
          <p className="text-sm text-gray-500">
            Only engineers can manage this ticket.
          </p>
        </CardContent>
      </Card>
    );
  }

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          severity,
          priority,
          assigneeId: assigneeId || null,
        }),
      });
      if (res.ok) {
        toast.success("Ticket updated");
        router.refresh();
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update");
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResolve = async () => {
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "RESOLVED" }),
    });
    if (res.ok) {
      toast.success("Ticket resolved");
      setStatus("RESOLVED");
      router.refresh();
    } else {
      toast.error("Failed to resolve ticket");
    }
  };

  const handleClose = async () => {
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "CLOSED" }),
    });
    if (res.ok) {
      toast.success("Ticket closed");
      setStatus("CLOSED");
      router.refresh();
    } else {
      toast.error("Failed to close ticket");
    }
  };

  const handleReopen = async () => {
    const res = await fetch(`/api/tickets/${ticket.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "IN_PROGRESS" }),
    });
    if (res.ok) {
      toast.success("Ticket reopened");
      setStatus("IN_PROGRESS");
      router.refresh();
    } else {
      toast.error("Failed to reopen ticket");
    }
  };

  const handleDelete = async () => {
    if (deleteInput !== "DELETE") return;
    const res = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Ticket deleted");
      router.push("/dashboard");
    } else {
      toast.error("Failed to delete ticket");
    }
  };

  const SelectField = ({
    label,
    value,
    onChange,
    options,
  }: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    options: { value: string; label: string }[];
  }) => (
    <div>
      <label className="text-xs font-medium text-gray-500 block mb-1">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-md px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </div>
  );

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm">Manage Ticket</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <SelectField
            label="Assignee"
            value={assigneeId}
            onChange={setAssigneeId}
            options={[
              { value: "", label: "Unassigned" },
              ...engineers.map((e) => ({ value: e.id, label: e.name })),
            ]}
          />
          <SelectField
            label="Status"
            value={status}
            onChange={(v) => setStatus(v as Status)}
            options={[
              { value: "NEW", label: "New" },
              { value: "TRIAGED", label: "Triaged" },
              { value: "IN_PROGRESS", label: "In Progress" },
              { value: "BLOCKED", label: "Blocked" },
              { value: "RESOLVED", label: "Resolved" },
              { value: "CLOSED", label: "Closed" },
            ]}
          />
          <SelectField
            label="Severity"
            value={severity}
            onChange={(v) => setSeverity(v as Severity)}
            options={[
              { value: "P1", label: "P1 — Critical" },
              { value: "P2", label: "P2 — High" },
              { value: "P3", label: "P3 — Medium" },
              { value: "P4", label: "P4 — Low" },
            ]}
          />
          <SelectField
            label="Priority"
            value={priority}
            onChange={(v) => setPriority(v as Priority)}
            options={[
              { value: "URGENT", label: "Urgent" },
              { value: "HIGH", label: "High" },
              { value: "MEDIUM", label: "Medium" },
              { value: "LOW", label: "Low" },
            ]}
          />
          <Button onClick={handleSave} disabled={saving} className="w-full">
            {saving ? "Saving..." : "Save Changes"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-5 space-y-2">
          {status !== "RESOLVED" && status !== "CLOSED" && (
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="outline" className="w-full text-green-700 border-green-200 hover:bg-green-50" />}
              >
                ✓ Mark Resolved
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Mark ticket as resolved?</AlertDialogTitle>
                  <AlertDialogDescription>
                    The submitter will be notified that this issue has been resolved.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleResolve} className="bg-green-600 hover:bg-green-700">
                    Resolve
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {status !== "CLOSED" && (
            <AlertDialog>
              <AlertDialogTrigger
                render={<Button variant="outline" className="w-full text-gray-600" />}
              >
                ✗ Close Ticket
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Close this ticket?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Closing the ticket marks it as done with no further action needed.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleClose}>Close Ticket</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}

          {(status === "RESOLVED" || status === "CLOSED") && (
            <Button
              variant="outline"
              className="w-full text-blue-700 border-blue-200 hover:bg-blue-50"
              onClick={handleReopen}
            >
              ↩ Reopen
            </Button>
          )}
        </CardContent>
      </Card>

      {isAdmin && (
        <Card className="border-red-200">
          <CardContent className="pt-5">
            <button
              className="flex items-center gap-2 text-sm text-red-600 font-medium w-full"
              onClick={() => setShowDanger(!showDanger)}
            >
              ⚠️ Advanced
              <ChevronDown
                className={`h-4 w-4 ml-auto transition-transform ${showDanger ? "rotate-180" : ""}`}
              />
            </button>
            {showDanger && (
              <div className="mt-4 space-y-3">
                <p className="text-xs text-gray-500">
                  Type <span className="font-mono font-bold">DELETE</span> to permanently delete this ticket.
                </p>
                <Input
                  value={deleteInput}
                  onChange={(e) => setDeleteInput(e.target.value)}
                  placeholder="DELETE"
                  className="border-red-300"
                />
                <Button
                  variant="destructive"
                  className="w-full"
                  disabled={deleteInput !== "DELETE"}
                  onClick={handleDelete}
                >
                  Delete Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

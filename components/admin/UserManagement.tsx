"use client";

import { useState, useEffect } from "react";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { UserPlus, Copy, Phone } from "lucide-react";
import { toast } from "sonner";
import type { Role } from "@prisma/client";

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  isOnCall: boolean;
  createdAt: string;
  _count: { submittedTickets: number };
}

const roleOptions: { value: Role; label: string }[] = [
  { value: "SUBMITTER", label: "Submitter" },
  { value: "OPERATOR", label: "Operator" },
  { value: "ENGINEER", label: "Engineer" },
  { value: "ADMIN", label: "Admin" },
];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    role: "SUBMITTER" as Role,
  });
  const [inviting, setInviting] = useState(false);
  const [tempPassword, setTempPassword] = useState<string | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleChange = async (userId: string, role: Role) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    if (res.ok) {
      toast.success("Role updated");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role } : u))
      );
    } else {
      toast.error("Failed to update role");
    }
  };

  const handleOnCallToggle = async (userId: string, isOnCall: boolean) => {
    const res = await fetch(`/api/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isOnCall }),
    });
    if (res.ok) {
      toast.success(isOnCall ? "On-call enabled" : "On-call removed");
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isOnCall } : u))
      );
    } else {
      toast.error("Failed to update on-call status");
    }
  };

  const handleDeactivate = async (userId: string) => {
    const res = await fetch(`/api/users/${userId}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("User removed");
      setUsers((prev) => prev.filter((u) => u.id !== userId));
    } else {
      const data = await res.json();
      toast.error(data.error || "Failed to remove user");
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to invite user");
        return;
      }
      setTempPassword(data.tempPassword);
      fetchUsers();
      setInviteForm({ name: "", email: "", role: "SUBMITTER" });
    } finally {
      setInviting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Dialog
          open={inviteOpen}
          onOpenChange={(open) => {
            setInviteOpen(open);
            if (!open) {
              setTempPassword(null);
            }
          }}
        >
          <DialogTrigger render={<Button className="gap-2" />}>
            <UserPlus className="h-4 w-4" />
            Invite User
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite a new team member</DialogTitle>
            </DialogHeader>

            {tempPassword ? (
              <div className="space-y-4">
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <p className="text-sm font-medium text-green-800 mb-2">
                    ✅ User created successfully!
                  </p>
                  <p className="text-sm text-green-700">
                    Share this temporary password with the user. It will not be
                    shown again.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 rounded-lg px-3 py-2 text-sm font-mono">
                    {tempPassword}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      navigator.clipboard.writeText(tempPassword);
                      toast.success("Copied!");
                    }}
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <Button className="w-full" onClick={() => setInviteOpen(false)}>
                  Done
                </Button>
              </div>
            ) : (
              <form onSubmit={handleInvite} className="space-y-4">
                <div>
                  <Label htmlFor="inv-name">Full name</Label>
                  <Input
                    id="inv-name"
                    value={inviteForm.name}
                    onChange={(e) =>
                      setInviteForm((f) => ({ ...f, name: e.target.value }))
                    }
                    placeholder="Jane Smith"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="inv-email">Email</Label>
                  <Input
                    id="inv-email"
                    type="email"
                    value={inviteForm.email}
                    onChange={(e) =>
                      setInviteForm((f) => ({ ...f, email: e.target.value }))
                    }
                    placeholder="jane@example.com"
                    className="mt-1"
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="inv-role">Role</Label>
                  <select
                    id="inv-role"
                    value={inviteForm.role}
                    onChange={(e) =>
                      setInviteForm((f) => ({ ...f, role: e.target.value as Role }))
                    }
                    className="mt-1 w-full border border-gray-300 rounded-md px-3 py-2 text-sm bg-white"
                    required
                  >
                    {roleOptions.map((r) => (
                      <option key={r.value} value={r.value}>
                        {r.label}
                      </option>
                    ))}
                  </select>
                </div>
                <Button type="submit" className="w-full" disabled={inviting}>
                  {inviting ? "Creating..." : "Create user"}
                </Button>
              </form>
            )}
          </DialogContent>
        </Dialog>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">Name</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">Email</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">Role</th>
              <th className="text-center px-4 py-3 text-xs text-gray-500 font-semibold">On-call</th>
              <th className="text-right px-4 py-3 text-xs text-gray-500 font-semibold">Tickets</th>
              <th className="text-left px-4 py-3 text-xs text-gray-500 font-semibold">Joined</th>
              <th className="px-4 py-3 w-20" />
            </tr>
          </thead>
          <tbody>
            {loading &&
              [1, 2, 3, 4, 5].map((i) => (
                <tr key={i} className="border-b">
                  <td colSpan={6} className="px-4 py-3">
                    <Skeleton className="h-4 w-full" />
                  </td>
                </tr>
              ))}
            {!loading &&
              users.map((user) => (
                <tr key={user.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{user.name}</td>
                  <td className="px-4 py-3 text-gray-500">{user.email}</td>
                  <td className="px-4 py-3">
                    <select
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, e.target.value as Role)
                      }
                      className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white"
                    >
                      {roleOptions.map((r) => (
                        <option key={r.value} value={r.value}>
                          {r.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {["ENGINEER", "ADMIN"].includes(user.role) ? (
                      <button
                        type="button"
                        onClick={() => handleOnCallToggle(user.id, !user.isOnCall)}
                        title={user.isOnCall ? "Remove on-call" : "Set as on-call"}
                        className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium transition-colors ${
                          user.isOnCall
                            ? "bg-green-100 text-green-800 hover:bg-green-200"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        <Phone className="h-3 w-3" />
                        {user.isOnCall ? "On-call" : "—"}
                      </button>
                    ) : (
                      <span className="text-gray-300 text-xs">N/A</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right text-gray-600">
                    {user._count.submittedTickets}
                  </td>
                  <td
                    className="px-4 py-3 text-gray-500 text-xs"
                    title={format(new Date(user.createdAt), "PPpp")}
                  >
                    {formatDistanceToNow(new Date(user.createdAt), {
                      addSuffix: true,
                    })}
                  </td>
                  <td className="px-4 py-3">
                    <AlertDialog>
                    <AlertDialogTrigger
                      render={<Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 hover:bg-red-50" />}
                    >
                      Remove
                    </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Remove {user.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            This will remove their account from the system. This action
                            cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeactivate(user.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            Remove
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

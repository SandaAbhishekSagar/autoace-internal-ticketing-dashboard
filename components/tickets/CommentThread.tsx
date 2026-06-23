"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Lock, Send, MessageCircle } from "lucide-react";
import type { CommentItem } from "@/types";
import type { Role } from "@prisma/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface CommentThreadProps {
  ticketId: string;
  comments: CommentItem[];
  role: Role | null;
  onCommentAdded?: () => void;
}

const roleColors: Record<string, string> = {
  ADMIN: "bg-purple-600",
  ENGINEER: "bg-blue-600",
  OPERATOR: "bg-green-600",
  SUBMITTER: "bg-gray-500",
};

const roleLabels: Record<string, string> = {
  ADMIN: "Admin",
  ENGINEER: "Engineer",
  OPERATOR: "Operator",
  SUBMITTER: "Submitter",
};

function CommentCard({ comment }: { comment: CommentItem }) {
  const initials = comment.authorName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const avatarColor = comment.author?.role
    ? roleColors[comment.author.role] ?? "bg-gray-500"
    : "bg-gray-400";

  return (
    <div
      className={cn(
        "rounded-xl p-4 border",
        comment.isInternal
          ? "bg-amber-50 border-amber-200"
          : "bg-white border-gray-100 shadow-sm"
      )}
    >
      <div className="flex items-start gap-3">
        <div
          className={cn(
            "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0",
            avatarColor
          )}
        >
          {initials}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1.5">
            <span className="text-sm font-semibold text-gray-900">{comment.authorName}</span>
            {comment.author?.role && (
              <span className="text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded-full">
                {roleLabels[comment.author.role]}
              </span>
            )}
            {comment.isInternal && (
              <span className="text-[10px] font-medium bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex items-center gap-1">
                <Lock className="h-2.5 w-2.5" />
                Internal
              </span>
            )}
            <time className="text-xs text-gray-400 ml-auto">
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </time>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {comment.body}
          </p>
        </div>
      </div>
    </div>
  );
}

function CommentInput({
  isInternal,
  body,
  setBody,
  onSubmit,
  isSubmitting,
}: {
  isInternal: boolean;
  body: string;
  setBody: (v: string) => void;
  onSubmit: () => void;
  isSubmitting: boolean;
}) {
  return (
    <div className="mt-4 space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={
          isInternal
            ? "Add an internal note — not visible to the submitter..."
            : "Add a public comment visible to the submitter..."
        }
        rows={3}
        className={cn(
          "resize-none text-sm",
          isInternal ? "bg-amber-50 border-amber-200 focus:ring-amber-300" : ""
        )}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) onSubmit();
        }}
      />
      <div className="flex items-center justify-between">
        <p className="text-xs text-gray-400">⌘ + Enter to submit</p>
        <Button
          onClick={onSubmit}
          disabled={isSubmitting || !body.trim()}
          size="sm"
          className={cn(
            "gap-1.5",
            isInternal ? "bg-amber-600 hover:bg-amber-700" : ""
          )}
        >
          <Send className="h-3.5 w-3.5" />
          {isSubmitting ? "Posting..." : "Post Comment"}
        </Button>
      </div>
    </div>
  );
}

export function CommentThread({ ticketId, comments, role, onCommentAdded }: CommentThreadProps) {
  const [body, setBody] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("public");

  const canSeeInternal = role === "ENGINEER" || role === "ADMIN";
  const publicComments = comments.filter((c) => !c.isInternal);
  const internalComments = comments.filter((c) => c.isInternal);

  const handleSubmit = async (isInternal: boolean) => {
    if (!body.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), isInternal }),
      });
      if (!res.ok) {
        const data = await res.json();
        toast.error(data.error || "Failed to post comment");
        return;
      }
      setBody("");
      toast.success("Comment posted");
      onCommentAdded?.();
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!canSeeInternal) {
    return (
      <div>
        <div className="flex items-center gap-2 mb-4">
          <MessageCircle className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-semibold text-gray-700">
            Comments
            {publicComments.length > 0 && (
              <span className="ml-1.5 text-xs text-gray-400 font-normal">
                ({publicComments.length})
              </span>
            )}
          </h3>
        </div>
        <div className="space-y-3">
          {publicComments.map((c) => (
            <CommentCard key={c.id} comment={c} />
          ))}
          {publicComments.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No replies yet.</p>
            </div>
          )}
        </div>
        {role && (
          <CommentInput
            isInternal={false}
            body={body}
            setBody={setBody}
            onSubmit={() => handleSubmit(false)}
            isSubmitting={isSubmitting}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        <MessageCircle className="h-4 w-4 text-gray-400" />
        <h3 className="text-sm font-semibold text-gray-700">Comments</h3>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="w-full">
          <TabsTrigger value="public" className="flex-1 gap-1.5">
            Public
            <span className="text-xs bg-gray-200 text-gray-600 rounded-full px-1.5 py-0.5">
              {publicComments.length}
            </span>
          </TabsTrigger>
          <TabsTrigger value="internal" className="flex-1 gap-1.5">
            <Lock className="h-3 w-3" />
            Internal
            <span className="text-xs bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5">
              {internalComments.length}
            </span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="mt-3 space-y-3">
          {publicComments.map((c) => (
            <CommentCard key={c.id} comment={c} />
          ))}
          {publicComments.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">No public comments yet.</p>
            </div>
          )}
          <CommentInput
            isInternal={false}
            body={body}
            setBody={setBody}
            onSubmit={() => handleSubmit(false)}
            isSubmitting={isSubmitting}
          />
        </TabsContent>

        <TabsContent value="internal" className="mt-3 space-y-3">
          <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <Lock className="h-3.5 w-3.5 text-amber-600 flex-shrink-0" />
            <p className="text-xs text-amber-800 font-medium">
              Internal notes are only visible to engineers and admins.
            </p>
          </div>
          {internalComments.map((c) => (
            <CommentCard key={c.id} comment={c} />
          ))}
          {internalComments.length === 0 && (
            <div className="text-center py-6 text-gray-400">
              <p className="text-sm">No internal notes yet.</p>
            </div>
          )}
          <CommentInput
            isInternal={true}
            body={body}
            setBody={setBody}
            onSubmit={() => handleSubmit(true)}
            isSubmitting={isSubmitting}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

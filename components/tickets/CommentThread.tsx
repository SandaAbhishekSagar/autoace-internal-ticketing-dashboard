"use client";

import { useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Lock } from "lucide-react";
import type { CommentItem } from "@/types";
import type { Role } from "@prisma/client";
import { toast } from "sonner";

interface CommentThreadProps {
  ticketId: string;
  comments: CommentItem[];
  role: Role | null;
  onCommentAdded?: () => void;
}

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

  return (
    <div
      className={`p-4 rounded-lg border ${
        comment.isInternal ? "bg-yellow-50 border-yellow-200" : "bg-white border-gray-200"
      }`}
    >
      <div className="flex items-start gap-3">
        <Avatar className="h-8 w-8 flex-shrink-0">
          <AvatarFallback className="text-xs font-medium bg-gray-200 text-gray-700">
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-medium text-sm">{comment.authorName}</span>
            {comment.author?.role && (
              <Badge variant="outline" className="text-xs py-0">
                {roleLabels[comment.author.role]}
              </Badge>
            )}
            <time
              className="text-xs text-gray-400 ml-auto"
              title={format(new Date(comment.createdAt), "PPpp")}
            >
              {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
            </time>
          </div>
          <p className="text-sm text-gray-700 mt-2 whitespace-pre-wrap">{comment.body}</p>
        </div>
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

  const CommentInput = ({ isInternal }: { isInternal: boolean }) => (
    <div className="mt-4 space-y-2">
      <Textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={isInternal ? "Add an internal note (not visible to submitter)..." : "Add a public comment..."}
        rows={3}
        className={isInternal ? "bg-yellow-50" : ""}
      />
      <Button
        onClick={() => handleSubmit(isInternal)}
        disabled={isSubmitting || !body.trim()}
        size="sm"
      >
        {isSubmitting ? "Posting..." : "Post Comment"}
      </Button>
    </div>
  );

  if (!canSeeInternal) {
    return (
      <div>
        <h3 className="text-sm font-semibold text-gray-700 mb-3">Comments</h3>
        <div className="space-y-3">
          {publicComments.map((c) => (
            <CommentCard key={c.id} comment={c} />
          ))}
          {publicComments.length === 0 && (
            <p className="text-sm text-gray-400">No comments yet.</p>
          )}
        </div>
        {role && <CommentInput isInternal={false} />}
      </div>
    );
  }

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-700 mb-3">Comments</h3>
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="public">
            Public Thread ({publicComments.length})
          </TabsTrigger>
          <TabsTrigger value="internal" className="gap-1">
            <Lock className="h-3 w-3" />
            Internal Notes ({internalComments.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="public" className="mt-3">
          <div className="space-y-3">
            {publicComments.map((c) => (
              <CommentCard key={c.id} comment={c} />
            ))}
            {publicComments.length === 0 && (
              <p className="text-sm text-gray-400">No public comments yet.</p>
            )}
          </div>
          <CommentInput isInternal={false} />
        </TabsContent>

        <TabsContent value="internal" className="mt-3">
          <div className="flex items-center gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-3">
            <Lock className="h-4 w-4 text-yellow-700" />
            <p className="text-xs text-yellow-800 font-medium">
              Internal — not visible to submitter or operators
            </p>
          </div>
          <div className="space-y-3">
            {internalComments.map((c) => (
              <CommentCard key={c.id} comment={c} />
            ))}
            {internalComments.length === 0 && (
              <p className="text-sm text-gray-400">No internal notes yet.</p>
            )}
          </div>
          <CommentInput isInternal={true} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

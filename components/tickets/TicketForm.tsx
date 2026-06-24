"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { SeveritySelector } from "./SeveritySelector";
import { Paperclip, X as XIcon, Loader2, AlertTriangle, ExternalLink, Phone } from "lucide-react";
import Link from "next/link";

type IssueTypeKey = "BUG" | "CALL_FAILURE" | "CUSTOMER_ISSUE" | "INTEGRATION" | "OPS_REQUEST";
type SeverityKey = "P1" | "P2" | "P3" | "P4";

interface FormState {
  submitterName: string;
  submitterEmail: string;
  title: string;
  description: string;
  issueType: IssueTypeKey | "";
  severity: SeverityKey | null;
  customerName: string;
  link: string;
  callRecordingUrl: string;
  callMonitorName: string;
}

interface FormErrors {
  submitterName?: string;
  submitterEmail?: string;
  title?: string;
  description?: string;
  issueType?: string;
  severity?: string;
}

interface SuccessInfo {
  shortId: number;
  email: string;
  trackingToken?: string;
}

interface DuplicateHint {
  shortId: number;
  title: string;
  status: string;
}

interface AttachedFile {
  file: File;
  status: "pending" | "uploading" | "done" | "error";
  url?: string;
  error?: string;
}

export function TicketForm() {
  const [form, setForm] = useState<FormState>({
    submitterName: "",
    submitterEmail: "",
    title: "",
    description: "",
    issueType: "",
    severity: null,
    customerName: "",
    link: "",
    callRecordingUrl: "",
    callMonitorName: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<SuccessInfo | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [duplicates, setDuplicates] = useState<DuplicateHint[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced duplicate detection
  const searchDuplicates = useCallback(async (title: string) => {
    if (title.length < 8) { setDuplicates([]); return; }
    try {
      const res = await fetch(`/api/tickets/duplicates?title=${encodeURIComponent(title)}`);
      if (res.ok) {
        const data = await res.json();
        setDuplicates(
          (data.tickets ?? []).map((t: { shortId: number; title: string; status: string }) => ({
            shortId: t.shortId,
            title: t.title,
            status: t.status,
          }))
        );
      }
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => searchDuplicates(form.title), 600);
    return () => clearTimeout(timer);
  }, [form.title, searchDuplicates]);

  const set = (field: keyof FormState, value: string | null) =>
    setForm((f) => ({ ...f, [field]: value }));

  const handleFilePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    if (!picked.length) return;
    const newItems: AttachedFile[] = picked
      .slice(0, 5 - attachedFiles.length)
      .map((file) => ({ file, status: "pending" }));
    setAttachedFiles((prev) => [...prev, ...newItems]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (idx: number) =>
    setAttachedFiles((prev) => prev.filter((_, i) => i !== idx));

  const uploadFiles = async (): Promise<string[]> => {
    const urls: string[] = [];
    const updated = [...attachedFiles];
    for (let i = 0; i < updated.length; i++) {
      const item = updated[i];
      if (item.status === "done" && item.url) { urls.push(item.url); continue; }
      updated[i] = { ...item, status: "uploading" };
      setAttachedFiles([...updated]);
      try {
        const fd = new FormData();
        fd.append("file", item.file);
        const res = await fetch("/api/upload", { method: "POST", body: fd });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "Upload failed");
        updated[i] = { ...item, status: "done", url: data.url };
        urls.push(data.url);
      } catch (err) {
        updated[i] = { ...item, status: "error", error: (err as Error).message };
      }
      setAttachedFiles([...updated]);
    }
    return urls;
  };

  const validate = (): boolean => {
    const errs: FormErrors = {};
    if (!form.submitterName.trim()) errs.submitterName = "Name is required";
    if (!form.submitterEmail.trim()) errs.submitterEmail = "Email is required";
    else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.submitterEmail))
      errs.submitterEmail = "Enter a valid email";
    if (!form.title.trim()) errs.title = "Please summarize the issue";
    else if (form.title.length < 3) errs.title = "Title too short";
    if (!form.description.trim()) errs.description = "Please describe what happened";
    else if (form.description.length < 10) errs.description = "Please provide more detail";
    if (!form.issueType) errs.issueType = "Please select an issue type";
    if (!form.severity) errs.severity = "Please select how urgent this is";
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    try {
      // Upload attachments first
      const attachmentUrls = attachedFiles.length > 0 ? await uploadFiles() : [];

      // Abort if any upload failed
      const hasUploadError = attachedFiles.some((f) => f.status === "error");
      if (hasUploadError) {
        setErrors({ description: "One or more file uploads failed. Please remove them and try again." });
        return;
      }

      const body: Record<string, unknown> = {
        submitterName: form.submitterName,
        submitterEmail: form.submitterEmail,
        title: form.title,
        description: form.description,
        issueType: form.issueType,
        severity: form.severity,
      };
      if (form.customerName) body.customerName = form.customerName;
      if (form.link) body.links = [form.link];
      if (attachmentUrls.length > 0) body.attachmentUrls = attachmentUrls;
      if (form.callRecordingUrl) body.callRecordingUrl = form.callRecordingUrl;
      if (form.callMonitorName) body.callMonitorName = form.callMonitorName;

      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json();
        setErrors({ description: data.error || "Something went wrong. Please try again." });
        return;
      }

      const data = await res.json();
      setSuccess({ shortId: data.shortId, email: form.submitterEmail, trackingToken: data.trackingToken });
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setForm({
      submitterName: "",
      submitterEmail: "",
      title: "",
      description: "",
      issueType: "",
      severity: null,
      customerName: "",
      link: "",
      callRecordingUrl: "",
      callMonitorName: "",
    });
    setErrors({});
    setSuccess(null);
    setAttachedFiles([]);
    setDuplicates([]);
  };

  if (success) {
    const trackUrl = success.trackingToken ? `/track/${success.trackingToken}` : null;
    return (
      <div className="text-center space-y-5 py-6">
        <div className="text-5xl">✅</div>
        <div>
          <h2 className="text-2xl font-bold text-gray-900">
            Issue submitted — Ticket #{String(success.shortId).padStart(3, "0")}
          </h2>
          <p className="text-gray-600 mt-2">
            We received your report and will follow up at{" "}
            <span className="font-medium">{success.email}</span>.
          </p>
        </div>
        {trackUrl && (
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200 text-left">
            <p className="text-sm font-semibold text-blue-900 mb-1">Track your ticket</p>
            <p className="text-xs text-blue-700 mb-2">Bookmark this link to check status anytime — no login required.</p>
            <Link
              href={trackUrl}
              target="_blank"
              className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline font-medium"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              View ticket status page
            </Link>
          </div>
        )}
        <div className="bg-gray-50 rounded-lg p-4 text-left space-y-2 border border-gray-200">
          <p className="text-sm font-medium text-gray-700">Expected response times:</p>
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>🔴</span> Critical issues: within 4 hours
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>🟠</span> High issues: within 8 hours
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <span>🟡</span> Medium issues: within 24 hours
            </div>
          </div>
        </div>
        <Button onClick={handleReset} className="w-full" variant="outline">
          Submit another issue
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div>
        <Label htmlFor="submitterName">Your name *</Label>
        <Input
          id="submitterName"
          value={form.submitterName}
          onChange={(e) => set("submitterName", e.target.value)}
          onBlur={() => {
            if (!form.submitterName.trim())
              setErrors((e) => ({ ...e, submitterName: "Name is required" }));
            else setErrors((e) => ({ ...e, submitterName: undefined }));
          }}
          placeholder="Jane Smith"
          className={`mt-1 ${errors.submitterName ? "border-red-400" : ""}`}
        />
        {errors.submitterName && (
          <p className="mt-1 text-sm text-red-600">{errors.submitterName}</p>
        )}
      </div>

      <div>
        <Label htmlFor="submitterEmail">Your email *</Label>
        <Input
          id="submitterEmail"
          type="email"
          value={form.submitterEmail}
          onChange={(e) => set("submitterEmail", e.target.value)}
          onBlur={() => {
            if (!form.submitterEmail.trim())
              setErrors((e) => ({ ...e, submitterEmail: "Email is required" }));
            else if (!/^[^@]+@[^@]+\.[^@]+$/.test(form.submitterEmail))
              setErrors((e) => ({ ...e, submitterEmail: "Enter a valid email" }));
            else setErrors((e) => ({ ...e, submitterEmail: undefined }));
          }}
          placeholder="jane@example.com"
          className={`mt-1 ${errors.submitterEmail ? "border-red-400" : ""}`}
        />
        <p className="mt-1 text-xs text-gray-500">We&apos;ll send updates here</p>
        {errors.submitterEmail && (
          <p className="mt-1 text-sm text-red-600">{errors.submitterEmail}</p>
        )}
      </div>

      <div>
        <div className="flex items-center justify-between">
          <Label htmlFor="title">What&apos;s the issue? *</Label>
          <span className="text-xs text-gray-400">{form.title.length}/120</span>
        </div>
        <Input
          id="title"
          value={form.title}
          onChange={(e) => set("title", e.target.value.slice(0, 120))}
          onBlur={() => {
            if (!form.title.trim())
              setErrors((e) => ({ ...e, title: "Please summarize the issue" }));
            else setErrors((e) => ({ ...e, title: undefined }));
          }}
          placeholder="Short summary — e.g. 'AI call dropped before scheduling'"
          className={`mt-1 ${errors.title ? "border-red-400" : ""}`}
          maxLength={120}
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-600">{errors.title}</p>
        )}
        {/* Duplicate detection warning */}
        {duplicates.length > 0 && (
          <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-semibold text-amber-800 mb-1">
                  Similar open tickets found — check before submitting:
                </p>
                <ul className="space-y-1">
                  {duplicates.map((d) => (
                    <li key={d.shortId} className="text-xs text-amber-700">
                      #{String(d.shortId).padStart(3, "0")} — {d.title}{" "}
                      <span className="text-amber-500">({d.status.replace(/_/g, " ")})</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      <div>
        <Label htmlFor="description">Tell us what happened *</Label>
        <Textarea
          id="description"
          value={form.description}
          onChange={(e) => set("description", e.target.value)}
          onBlur={() => {
            if (!form.description.trim())
              setErrors((e) => ({ ...e, description: "Please describe what happened" }));
            else setErrors((e) => ({ ...e, description: undefined }));
          }}
          rows={5}
          placeholder="Describe what went wrong, when it happened, and who was affected. The more detail, the faster we can help."
          className={`mt-1 ${errors.description ? "border-red-400" : ""}`}
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      <div>
        <Label htmlFor="issueType">What type of issue is this? *</Label>
        <select
          id="issueType"
          value={form.issueType}
          onChange={(e) => {
            set("issueType", e.target.value);
            setErrors((errs) => ({ ...errs, issueType: undefined }));
          }}
          className={`mt-1 w-full border rounded-md px-3 py-2 text-sm bg-white text-gray-900 ${
            errors.issueType ? "border-red-400" : "border-gray-300"
          }`}
        >
          <option value="">Select...</option>
          <option value="CALL_FAILURE">AI call problem</option>
          <option value="BUG">Something is broken (bug)</option>
          <option value="CUSTOMER_ISSUE">Customer complaint</option>
          <option value="INTEGRATION">System connection issue</option>
          <option value="OPS_REQUEST">Operational / process issue</option>
        </select>
        {errors.issueType && (
          <p className="mt-1 text-sm text-red-600">{errors.issueType}</p>
        )}
      </div>

      <div>
        <Label className="mb-2 block">How urgent is this? *</Label>
        <SeveritySelector
          value={form.severity}
          onChange={(v) => {
            set("severity", v);
            setErrors((e) => ({ ...e, severity: undefined }));
          }}
          error={errors.severity}
        />
      </div>

      <div>
        <Label htmlFor="customerName">Customer or dealership name</Label>
        <Input
          id="customerName"
          value={form.customerName}
          onChange={(e) => set("customerName", e.target.value)}
          placeholder="e.g. Sunset Toyota"
          className="mt-1"
        />
        <p className="mt-1 text-xs text-gray-500">
          Fill in if this is about a specific account
        </p>
      </div>

      <div>
        <Label htmlFor="link">Relevant link</Label>
        <Input
          id="link"
          type="url"
          value={form.link}
          onChange={(e) => set("link", e.target.value)}
          placeholder="Call recording URL, screenshot, or related link"
          className="mt-1"
        />
      </div>

      {/* Call context — shown for AI call problems */}
      {form.issueType === "CALL_FAILURE" && (
        <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 space-y-3">
          <div className="flex items-center gap-2 text-sm font-semibold text-blue-900">
            <Phone className="h-4 w-4" />
            Call context
          </div>
          <div>
            <Label htmlFor="callRecordingUrl" className="text-xs text-blue-800">
              Call recording URL
            </Label>
            <Input
              id="callRecordingUrl"
              type="url"
              value={form.callRecordingUrl}
              onChange={(e) => set("callRecordingUrl", e.target.value)}
              placeholder="https://..."
              className="mt-1 bg-white"
            />
          </div>
          <div>
            <Label htmlFor="callMonitorName" className="text-xs text-blue-800">
              Call monitor / reviewer name
            </Label>
            <Input
              id="callMonitorName"
              value={form.callMonitorName}
              onChange={(e) => set("callMonitorName", e.target.value)}
              placeholder="Who reviewed this call?"
              className="mt-1 bg-white"
            />
          </div>
        </div>
      )}

      {/* File attachments */}
      <div>
        <Label>Attachments</Label>
        <p className="text-xs text-gray-500 mt-0.5 mb-2">
          Images, PDFs, videos — up to 5 files, 10 MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*,.pdf,.txt,.csv,video/mp4,video/quicktime"
          className="hidden"
          onChange={handleFilePick}
        />
        {attachedFiles.length < 5 && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-blue-400 hover:text-blue-600 hover:bg-blue-50 transition-colors w-full justify-center"
          >
            <Paperclip className="h-4 w-4" />
            Attach files
          </button>
        )}
        {attachedFiles.length > 0 && (
          <ul className="mt-2 space-y-1.5">
            {attachedFiles.map((item, i) => (
              <li key={i} className="flex items-center gap-2 text-sm rounded-lg border border-gray-200 px-3 py-2 bg-gray-50">
                {item.status === "uploading" ? (
                  <Loader2 className="h-3.5 w-3.5 text-blue-500 animate-spin flex-shrink-0" />
                ) : item.status === "done" ? (
                  <span className="text-green-500 flex-shrink-0">✓</span>
                ) : item.status === "error" ? (
                  <span className="text-red-500 flex-shrink-0">✗</span>
                ) : (
                  <Paperclip className="h-3.5 w-3.5 text-gray-400 flex-shrink-0" />
                )}
                <span className="truncate flex-1 text-gray-700">{item.file.name}</span>
                {item.error && (
                  <span className="text-xs text-red-500 truncate max-w-[120px]">{item.error}</span>
                )}
                {item.status !== "uploading" && (
                  <button
                    type="button"
                    onClick={() => removeFile(i)}
                    className="text-gray-400 hover:text-red-500 flex-shrink-0"
                  >
                    <XIcon className="h-3.5 w-3.5" />
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>

      <Button type="submit" className="w-full" disabled={submitting}>
        {submitting ? (
          <span className="flex items-center gap-2">
            <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Submitting...
          </span>
        ) : (
          "Submit Issue →"
        )}
      </Button>
    </form>
  );
}

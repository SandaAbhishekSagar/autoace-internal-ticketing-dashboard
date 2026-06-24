import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServiceClient } from "@/lib/supabase/server";

const BUCKET = "ticket-attachments";
const MAX_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = [
  "image/jpeg", "image/png", "image/gif", "image/webp",
  "application/pdf",
  "text/plain", "text/csv",
  "video/mp4", "video/quicktime",
];

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: "File too large (max 10 MB)" }, { status: 400 });
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: `Unsupported file type: ${file.type}` },
        { status: 400 }
      );
    }

    const supabase = createSupabaseServiceClient();

    // Sanitise filename — keep extension, strip special chars
    const ext = file.name.split(".").pop()?.toLowerCase() ?? "bin";
    const safeName = file.name
      .replace(/\.[^.]+$/, "")
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 60);
    const path = `${Date.now()}_${safeName}.${ext}`;

    const buffer = Buffer.from(await file.arrayBuffer());

    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, buffer, { contentType: file.type, upsert: true });

    if (error) {
      console.error("Storage upload error:", {
        message: error.message,
        statusCode: (error as { statusCode?: string }).statusCode,
        name: error.name,
        path,
        size: file.size,
        type: file.type,
      });
      const msg = error.message ?? "Upload failed";
      const statusCode = (error as { statusCode?: string }).statusCode;
      if (
        statusCode === "404" ||
        msg.toLowerCase().includes("bucket not found") ||
        msg.includes("not found")
      ) {
        return NextResponse.json(
          {
            error:
              'Storage bucket "ticket-attachments" not found. ' +
              "Run supabase/storage-setup.sql in Supabase SQL Editor, or create the bucket in Storage.",
          },
          { status: 503 }
        );
      }
      if (
        msg.toLowerCase().includes("size") ||
        msg.toLowerCase().includes("too large") ||
        (error as { statusCode?: string }).statusCode === "413"
      ) {
        return NextResponse.json(
          {
            error:
              `File exceeds Supabase Storage size limit (${(file.size / 1024 / 1024).toFixed(1)} MB). ` +
              "In Supabase → Storage → Settings, raise the global or bucket file size limit.",
          },
          { status: 413 }
        );
      }
      if (msg.toLowerCase().includes("mime") || msg.toLowerCase().includes("content type")) {
        return NextResponse.json(
          {
            error:
              `Storage bucket rejected type "${file.type}". ` +
              "In Supabase → Storage → ticket-attachments → Settings, allow image/png or remove MIME restrictions.",
          },
          { status: 400 }
        );
      }
      return NextResponse.json({ error: msg }, { status: 400 });
    }

    const { data: urlData } = supabase.storage.from(BUCKET).getPublicUrl(path);

    return NextResponse.json({ url: urlData.publicUrl, name: file.name });
  } catch (err) {
    console.error("Upload route error:", err);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

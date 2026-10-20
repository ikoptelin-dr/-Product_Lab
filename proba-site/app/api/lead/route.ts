import { handleLead } from "@/lib/handle-lead";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BODY = 10 * 1024;

export async function POST(req: Request) {
  if (!req.headers.get("content-type")?.includes("application/json")) {
    return Response.json({ ok: false, error: "unsupported_media_type" }, { status: 415 });
  }
  const text = await req.text();
  if (text.length > MAX_BODY) return Response.json({ ok: false, error: "too_large" }, { status: 413 });

  let body: unknown;
  try {
    body = JSON.parse(text);
  } catch {
    return Response.json({ ok: false, error: "bad_json" }, { status: 400 });
  }

  try {
    const res = await handleLead(body, req.headers);
    return Response.json(res.body, { status: res.status });
  } catch (err) {
    console.error("[lead] необработанная ошибка:", err instanceof Error ? err.message : err);
    return Response.json({ ok: false, error: "internal" }, { status: 500 });
  }
}

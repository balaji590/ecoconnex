import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

function isAuthorized(req: Request): boolean {
  const token = req.headers.get("x-admin-token");
  return !!token && token === Netlify.env.get("ADMIN_TOKEN");
}

export default async (req: Request, context: Context) => {
  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const url = new URL(req.url);
  const runId = url.searchParams.get("runId");
  if (!runId) {
    return new Response(JSON.stringify({ error: "runId required" }), { status: 400 });
  }

  const store = getStore("bulk-runs");
  const status = await store.get(runId, { type: "json" });

  if (!status) {
    return new Response(JSON.stringify({ error: "Not found (or not started yet)" }), { status: 404 });
  }

  return new Response(JSON.stringify(status), {
    status: 200,
    headers: { "content-type": "application/json" },
  });
};

export const config: Config = {
  path: "/api/bulk-status",
};

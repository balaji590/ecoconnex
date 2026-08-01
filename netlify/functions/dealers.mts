import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// Simple shared-secret auth so random people can't hit this endpoint.
// Set ADMIN_TOKEN in Netlify env vars (Site configuration > Environment variables).
function isAuthorized(req: Request): boolean {
  const token = req.headers.get("x-admin-token");
  return !!token && token === Netlify.env.get("ADMIN_TOKEN");
}

export default async (req: Request, context: Context) => {
  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const store = getStore("dealers");

  if (req.method === "GET") {
    const dealers = (await store.get("list", { type: "json" })) || [];
    return new Response(JSON.stringify({ dealers }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  if (req.method === "POST") {
    // Body: { dealers: [{ name, phone }, ...] }  -- replaces the whole list
    // Phone numbers must be in international format, e.g. 918778657912 (no + or spaces)
    const body = await req.json();
    if (!Array.isArray(body.dealers)) {
      return new Response(JSON.stringify({ error: "dealers must be an array" }), { status: 400 });
    }

    const cleaned = body.dealers
      .map((d: any) => ({
        name: String(d.name || "").trim(),
        phone: String(d.phone || "").replace(/[^0-9]/g, ""),
      }))
      .filter((d: any) => d.phone.length >= 10);

    await store.setJSON("list", cleaned);
    return new Response(JSON.stringify({ dealers: cleaned }), {
      status: 200,
      headers: { "content-type": "application/json" },
    });
  }

  return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405 });
};

export const config: Config = {
  path: "/api/dealers",
};

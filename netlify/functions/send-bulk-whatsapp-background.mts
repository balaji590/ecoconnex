import type { Context, Config } from "@netlify/functions";
import { getStore } from "@netlify/blobs";

// Runs in the background (up to 15 min). Writes live progress to Blobs
// so the admin page can poll /api/bulk-status?runId=... for updates.

interface DealerMsg {
  name: string;
  phone: string;
}

async function sendOne(phone: string, templateName: string, languageCode: string, params: string[]) {
  const phoneNumberId = Netlify.env.get("WHATSAPP_PHONE_NUMBER_ID");
  const accessToken = Netlify.env.get("WHATSAPP_ACCESS_TOKEN");

  const components =
    params.length > 0
      ? [
          {
            type: "body",
            parameters: params.map((p) => ({ type: "text", text: p })),
          },
        ]
      : [];

  const res = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      messaging_product: "whatsapp",
      to: phone,
      type: "template",
      template: {
        name: templateName,
        language: { code: languageCode },
        ...(components.length ? { components } : {}),
      },
    }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || `HTTP ${res.status}`);
  }
  return data;
}

function isAuthorized(req: Request): boolean {
  const token = req.headers.get("x-admin-token");
  return !!token && token === Netlify.env.get("ADMIN_TOKEN");
}

export default async (req: Request, context: Context) => {
  if (!isAuthorized(req)) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401 });
  }

  const body = await req.json();
  const {
    runId,
    dealers, // [{ name, phone }]
    templateName,
    languageCode = "en",
    useDealerNameAsFirstParam = false,
    extraParams = [], // string[] applied to every message after the name param (if used)
  } = body as {
    runId: string;
    dealers: DealerMsg[];
    templateName: string;
    languageCode?: string;
    useDealerNameAsFirstParam?: boolean;
    extraParams?: string[];
  };

  const store = getStore("bulk-runs");

  const status = {
    runId,
    status: "running",
    total: dealers.length,
    sent: 0,
    failed: 0,
    errors: [] as { phone: string; error: string }[],
    startedAt: new Date().toISOString(),
    finishedAt: null as string | null,
  };
  await store.setJSON(runId, status);

  for (const dealer of dealers) {
    const params = useDealerNameAsFirstParam ? [dealer.name, ...extraParams] : [...extraParams];
    try {
      await sendOne(dealer.phone, templateName, languageCode, params);
      status.sent += 1;
    } catch (err: any) {
      status.failed += 1;
      status.errors.push({ phone: dealer.phone, error: String(err.message || err) });
    }
    // Small delay to stay well under Meta's rate limits
    await new Promise((r) => setTimeout(r, 300));
    await store.setJSON(runId, status);
  }

  status.status = "done";
  status.finishedAt = new Date().toISOString();
  await store.setJSON(runId, status);
};

export const config: Config = {
  path: "/api/send-bulk-whatsapp-background",
};

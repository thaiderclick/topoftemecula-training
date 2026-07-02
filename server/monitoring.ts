/**
 * Attribution-leak monitor (§10). The website emits a PostHog event
 * `ambassador_attribution_dropped` on the rare GIS-fallback path. Surface its
 * count so we know if attribution is leaking on live claims.
 *
 * Graceful: if PostHog isn't configured, returns { configured: false } instead
 * of failing — so nothing here requires setup to keep the CRM working.
 */
import { ENV } from "./_core/env";

export interface AttributionLeak {
  configured: boolean;
  count: number | null;
  note?: string;
}

export async function getAttributionLeakCount(): Promise<AttributionLeak> {
  if (!ENV.posthogApiKey || !ENV.posthogProjectId) {
    return {
      configured: false,
      count: null,
      note: "Set POSTHOG_API_KEY + POSTHOG_PROJECT_ID to surface ambassador_attribution_dropped counts.",
    };
  }
  try {
    const host = ENV.posthogHost || "https://us.posthog.com";
    const res = await fetch(`${host}/api/projects/${ENV.posthogProjectId}/query/`, {
      method: "POST",
      headers: { Authorization: `Bearer ${ENV.posthogApiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query: {
          kind: "HogQLQuery",
          query: "select count() from events where event = 'ambassador_attribution_dropped'",
        },
      }),
    });
    if (!res.ok) return { configured: true, count: null, note: `PostHog error ${res.status}` };
    const data = (await res.json()) as { results?: unknown[][] };
    const count = Number(data?.results?.[0]?.[0] ?? 0);
    return { configured: true, count };
  } catch (e) {
    return { configured: true, count: null, note: (e as Error).message };
  }
}

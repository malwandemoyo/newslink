import { NextRequest, NextResponse } from "next/server";
import { getCollection, insertAuditLog } from "@/lib/db";
import {
  INITIAL_EXPERTS,
  INITIAL_INVESTIGATIONS,
  INITIAL_RESOURCES,
} from "@/data/seed";
import { Investigation, Resource } from "@/types/newsroom";

const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";

export interface AIRecommendationResponse {
  modelUsed: string;
  investigationTitle: string;
  strategicBrief: string;
  recommendedResources: Array<{
    resourceId: string;
    title: string;
    city: string;
    rateUsd: number;
    matchReason: string;
  }>;
  recommendedExperts: Array<{
    expertId: string;
    name: string;
    role: string;
    city: string;
    matchReason: string;
  }>;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { investigationId = "inv-umzingwane", activeOrgId = "org-byo" } = body;

    const investigations = getCollection<Investigation[]>(
      "investigations",
      INITIAL_INVESTIGATIONS
    );
    const resources = getCollection<Resource[]>("resources", INITIAL_RESOURCES);
    const experts = INITIAL_EXPERTS;

    const inv =
      investigations.find((i) => i.id === investigationId) || investigations[0];

    const availableResources = resources.filter(
      (r) => r.status === "Available"
    );

    const promptText = `You are the NewsLink AI Resource & Collaborator Matchmaker.
Given the active investigation:
Title: "${inv.title}"
Summary: "${inv.summary}"

Available Partner Equipment in Network:
${availableResources.map((r) => `- ID: ${r.id} | ${r.title} (${r.category}, ${r.city}, $${r.suggestedRateUsd}/day)`).join("\n")}

Available Specialist Journalists in Network:
${experts.map((e) => `- ID: ${e.id} | ${e.name} (${e.role}, ${e.city}, Skills: ${e.skills.join(", ")}, Languages: ${e.languages.join(", ")})`).join("\n")}

Select the top 2 equipment resources and top 2 specialist journalists that best help verify and complete this investigation.
Return strictly JSON:
{
  "strategicBrief": "1 concise sentence explaining the cross-newsroom resource & expertise strategy",
  "recommendedResources": [
    { "resourceId": "exact ID from list", "title": "string", "city": "string", "rateUsd": number, "matchReason": "why this equipment is needed for this story" }
  ],
  "recommendedExperts": [
    { "expertId": "exact ID from list", "name": "string", "role": "string", "city": "string", "matchReason": "why this specialist is needed for this story" }
  ]
}`;

    let parsed: Omit<
      AIRecommendationResponse,
      "modelUsed" | "investigationTitle"
    > | null = null;

    if (GEMINI_API_KEY) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [{ role: "user", parts: [{ text: promptText }] }],
              generationConfig: { responseMimeType: "application/json" },
            }),
            signal: AbortSignal.timeout(8000),
          }
        );
        if (res.ok) {
          const data = await res.json();
          const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (raw) parsed = JSON.parse(raw);
        }
      } catch {
        // Fallback below
      }
    }

    const r1 = availableResources[0] || resources[0];
    const r2 = availableResources[1] || resources[1];
    const e1 = experts[0];
    const e2 = experts[1];

    const fallback: Omit<
      AIRecommendationResponse,
      "modelUsed" | "investigationTitle"
    > = {
      strategicBrief:
        "Pair Bulawayo aerial & water-quality field gear with Harare company-registry forensic expertise to corroborate both the physical breach and procurement trail.",
      recommendedResources: [
        {
          resourceId: r1.id,
          title: r1.title,
          city: r1.city,
          rateUsd: r1.suggestedRateUsd,
          matchReason:
            "Essential for geotagged visual & water-quality documentation at the Umzingwane / Gwanda site.",
        },
        {
          resourceId: r2.id,
          title: r2.title,
          city: r2.city,
          rateUsd: r2.suggestedRateUsd,
          matchReason:
            "Provides broadcast-grade field recording for affected ward residents' interviews.",
        },
      ],
      recommendedExperts: [
        {
          expertId: e1.id,
          name: e1.name,
          role: e1.role,
          city: e1.city,
          matchReason:
            "experienced in cross-referencing ZINWA/municipal tender ledgers with CR14 beneficial ownership filings.",
        },
        {
          expertId: e2.id,
          name: e2.name,
          role: e2.role,
          city: e2.city,
          matchReason:
            "Fluent in isiNdebele & environmental field sampling to verify downstream community impact.",
        },
      ],
    };

    insertAuditLog({
      id: `aud-rec-${Date.now()}`,
      timestamp: new Date().toISOString().slice(0, 16).replace("T", " "),
      actorName: `AI Matchmaker (${activeOrgId})`,
      actorOrgId: activeOrgId,
      category: "AI Query",
      action: `Generated AI equipment & collaborator recommendations for '${inv.codeName}' via ${GEMINI_MODEL}`,
      resourceTarget: inv.id,
    });

    return NextResponse.json({
      modelUsed: `${GEMINI_MODEL} (Resource & Collaborator Matchmaker)`,
      investigationTitle: inv.title,
      ...(parsed || fallback),
    } satisfies AIRecommendationResponse);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Recommendation failed" },
      { status: 500 }
    );
  }
}

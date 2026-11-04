import express from "express";
import cors from "cors";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { DatabaseSync } from "node:sqlite";

// Load .env / .env.local automatically if present
for (const envFile of [".env", ".env.local"]) {
  const envPath = path.join(process.cwd(), envFile);
  if (fs.existsSync(envPath) && typeof process.loadEnvFile === "function") {
    try {
      process.loadEnvFile(envPath);
    } catch {
      // ignore parse errors
    }
  }
}

const PORT = Number(process.env.BACKEND_PORT || 4000);
const GEMINI_API_KEY = (process.env.GEMINI_API_KEY || "").trim();
const GEMINI_MODEL = process.env.GEMINI_MODEL || "gemini-3.8-flash";
const MAPS_API_KEY = (process.env.MAPS_API_KEY || "").trim();

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}
const DB_PATH = path.join(DATA_DIR, "connected_newsroom.sqlite");
const SCHEMA_PATH = path.join(process.cwd(), "database", "schema.sql");

const db = new DatabaseSync(DB_PATH);
if (fs.existsSync(SCHEMA_PATH)) {
  const schemaSql = fs.readFileSync(SCHEMA_PATH, "utf-8");
  db.exec(schemaSql);
}

// Helper to call Gemini 3.8 Flash
async function callGeminiJson(prompt, fallbackObj) {
  if (!GEMINI_API_KEY) return fallbackObj;
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ role: "user", parts: [{ text: prompt }] }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
        signal: AbortSignal.timeout(8000),
      }
    );
    if (res.ok) {
      const data = await res.json();
      const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (raw) {
        return JSON.parse(raw);
      }
    }
  } catch {
    // Fallback if offline or timeout
  }
  return fallbackObj;
}

// Seed relational tables if empty
function ensureRelationalSeed() {
  const countRow = db
    .prepare("SELECT COUNT(*) as c FROM organisations")
    .get();
  if (countRow && Number(countRow.c) > 0) return;

  const insertOrg = db.prepare(`
    INSERT INTO organisations (id, name, short_name, city, province, org_type, latitude, longitude, wallet_balance_usd, network_credits, verified, beats_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const initialOrgs = [
    ["org-byo", "Matabeleland Independent", "Matabeleland Ind.", "Bulawayo", "Matabeleland North", "Investigative Print & Digital", -20.156, 28.588, 420.0, 140, 1, JSON.stringify(["Water & Extractive Industries", "Municipal Accountability"])],
    ["org-cite", "CITE ZW Media Hub", "CITE ZW", "Bulawayo", "Bulawayo Metro", "Multimedia Civic Hub", -20.149, 28.579, 580.0, 210, 1, JSON.stringify(["Documentary Video", "Drone Survey", "Community Fact-Checking"])],
    ["org-hre", "Harare Investigative Collective", "Harare Collective", "Harare", "Harare Metro", "Data & Forensic Unit", -17.825, 31.049, 890.0, 185, 1, JSON.stringify(["Public Procurement", "Company Registry Forensics", "FOIA Litigation"])],
    ["org-mut", "Manicaland Community Wire", "Manicaland Wire", "Mutare", "Manicaland", "Community Radio & Wire", -18.972, 32.669, 310.0, 120, 1, JSON.stringify(["Cross-Border Trade", "Environmental Monitoring", "Local Language Audio"])],
  ];
  for (const o of initialOrgs) insertOrg.run(...o);

  const insertLedger = db.prepare(`
    INSERT INTO ledger_transactions (id, from_org_id, to_org_id, category, description, gross_amount_usd, platform_fee_usd, net_payout_usd, credits_moved, payment_rail, status, reference_id)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertLedger.run(
    "tx-1001",
    "org-byo",
    "org-cite",
    "inDrive Gear Escrow",
    "DJI Mavic 3 Enterprise Drone + Operator (Gwanda/Umzingwane Survey)",
    65.0,
    3.25,
    61.75,
    0,
    "USD Escrow (EcoCash / Paynow)",
    "Released to Lender",
    "req-drone-01"
  );
  insertLedger.run(
    "tx-1002",
    "org-hre",
    "org-byo",
    "Network Credit Barter",
    "Co-investigation forensic registry audit exchanged for Bulawayo field verification",
    0.0,
    0.0,
    0.0,
    45,
    "Reciprocal Network Credits (0% Fee)",
    "Settled",
    "inv-umzingwane"
  );
  insertLedger.run(
    "tx-1003",
    "org-mut",
    "org-byo",
    "Story Syndication Split",
    "Commercial syndication license for Umzingwane Investigation Package (60% Lead / 35% Partner / 5% Platform)",
    120.0,
    6.0,
    114.0,
    0,
    "USD Wire / Paynow Split",
    "Settled",
    "pkg-umzingwane"
  );
}

ensureRelationalSeed();

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

// 1. Health & Relational DB Telemetry
app.get("/api/health", (_req, res) => {
  const orgCount = db.prepare("SELECT COUNT(*) as c FROM organisations").get().c;
  const txCount = db.prepare("SELECT COUNT(*) as c FROM ledger_transactions").get().c;
  const stat = fs.statSync(DB_PATH);
  res.json({
    service: "Connected Newsroom Express + SQLite + Gemini AI Backend",
    status: "ok",
    port: PORT,
    geminiModel: GEMINI_MODEL,
    geminiConfigured: Boolean(GEMINI_API_KEY),
    mapsConfigured: Boolean(MAPS_API_KEY),
    sqliteFile: DB_PATH,
    sqliteSizeKb: Math.round(stat.size / 1024),
    tables: { organisations: orgCount, ledger_transactions: txCount },
  });
});

// 2. Organisations & Onboarding + Escrow Wallets
app.get("/api/organisations", (_req, res) => {
  const rows = db
    .prepare("SELECT * FROM organisations ORDER BY created_at ASC")
    .all();
  const transactions = db
    .prepare("SELECT * FROM ledger_transactions ORDER BY created_at DESC LIMIT 25")
    .all();
  res.json({ organisations: rows, transactions });
});

app.post("/api/organisations", (req, res) => {
  const {
    name,
    shortName,
    city = "Bulawayo",
    province = "Bulawayo Metro",
    orgType = "Independent Digital Newsroom",
    beats = ["Investigative Reporting", "Local Governance"],
  } = req.body;

  if (!name) {
    return res.status(400).json({ error: "Organisation name is required." });
  }

  const id = `org-${Date.now().toString(36)}`;
  const lat = city.toLowerCase().includes("harare") ? -17.829 : -20.152;
  const lng = city.toLowerCase().includes("harare") ? 31.052 : 28.584;

  db.prepare(`
    INSERT INTO organisations (id, name, short_name, city, province, org_type, latitude, longitude, wallet_balance_usd, network_credits, verified, beats_json)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 300.0, 120, 1, ?)
  `).run(
    id,
    name,
    shortName || name.slice(0, 16),
    city,
    province,
    orgType,
    lat,
    lng,
    JSON.stringify(beats)
  );

  db.prepare(`
    INSERT INTO ledger_transactions (id, from_org_id, to_org_id, category, description, gross_amount_usd, platform_fee_usd, net_payout_usd, credits_moved, payment_rail, status, reference_id)
    VALUES (?, NULL, ?, 'Onboarding Grant', ?, 300.0, 0.0, 300.0, 120, 'Network Seed Wallet + Credits', 'Settled', ?)
  `).run(
    `tx-${Date.now()}`,
    id,
    `Initial onboarding wallet ($300 USD + 120 Network Credits) for ${name}`,
    id
  );

  const created = db.prepare("SELECT * FROM organisations WHERE id = ?").get(id);
  res.status(201).json({ organisation: created });
});

// 3. inDrive AI Fare Estimator & Equipment Listing
app.post("/api/indrive/ai-price-gear", async (req, res) => {
  const { title, category, city, includesOperator } = req.body;
  const prompt = `You are the Connected Newsroom inDrive Equipment Pricing AI for independent media in Zimbabwe.
Given equipment "${title}" (Category: ${category}, City: ${city}, Includes Operator: ${Boolean(includesOperator)}), return JSON with:
{
  "suggestedDailyRateUsd": number (between 15 and 85),
  "suggestedCreditCost": number (between 15 and 85),
  "pricingRationale": "1 concise sentence explaining why this peer-to-peer newsroom rate beats commercial rental rates",
  "recommendedHandoverChecklist": ["item 1", "item 2"]
}`;

  const result = await callGeminiJson(prompt, {
    suggestedDailyRateUsd: includesOperator ? 55 : 30,
    suggestedCreditCost: includesOperator ? 55 : 30,
    pricingRationale: `Peer-to-peer newsroom rate in ${city} (~60% below commercial rental houses) with reciprocal credit option.`,
    recommendedHandoverChecklist: [
      "Verify chassis serial number & battery charge",
      "Format dual SD/CFexpress media cards before dispatch",
    ],
  });

  res.json({
    model: GEMINI_MODEL,
    ...result,
  });
});

// 4. Real Money & Network Credit Escrow Settlement
app.post("/api/ledger/transfer", (req, res) => {
  const {
    fromOrgId,
    toOrgId,
    category = "inDrive Gear Escrow",
    description,
    amountUsd = 0,
    creditsMoved = 0,
    paymentRail = "USD Escrow (EcoCash / Paynow)",
    referenceId = "manual",
  } = req.body;

  const gross = Number(amountUsd) || 0;
  const fee = Number((gross * 0.05).toFixed(2));
  const net = Number((gross - fee).toFixed(2));
  const credits = Number(creditsMoved) || 0;

  db.exec("BEGIN");
  try {
    if (gross > 0 && fromOrgId) {
      db.prepare(
        "UPDATE organisations SET wallet_balance_usd = wallet_balance_usd - ? WHERE id = ?"
      ).run(gross, fromOrgId);
    }
    if (net > 0 && toOrgId) {
      db.prepare(
        "UPDATE organisations SET wallet_balance_usd = wallet_balance_usd + ? WHERE id = ?"
      ).run(net, toOrgId);
    }
    if (credits > 0 && fromOrgId && toOrgId) {
      db.prepare(
        "UPDATE organisations SET network_credits = network_credits - ? WHERE id = ?"
      ).run(credits, fromOrgId);
      db.prepare(
        "UPDATE organisations SET network_credits = network_credits + ? WHERE id = ?"
      ).run(credits, toOrgId);
    }

    const txId = `tx-${Date.now()}`;
    db.prepare(`
      INSERT INTO ledger_transactions (id, from_org_id, to_org_id, category, description, gross_amount_usd, platform_fee_usd, net_payout_usd, credits_moved, payment_rail, status, reference_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Settled', ?)
    `).run(
      txId,
      fromOrgId || null,
      toOrgId || null,
      category,
      description || "Cross-newsroom settlement",
      gross,
      fee,
      net,
      credits,
      paymentRail,
      referenceId
    );
    db.exec("COMMIT");

    const organisations = db.prepare("SELECT * FROM organisations").all();
    const transactions = db
      .prepare("SELECT * FROM ledger_transactions ORDER BY created_at DESC LIMIT 25")
      .all();

    res.json({ txId, gross, fee, net, credits, organisations, transactions });
  } catch (err) {
    db.exec("ROLLBACK");
    res.status(500).json({
      error: err instanceof Error ? err.message : "Transaction failed",
    });
  }
});

// 5. Kanban AI Verification Task Generator (Gemini 3.8 Flash)
app.post("/api/kanban/ai-generate-tasks", async (req, res) => {
  const { investigationTitle, leadHypothesis, activeOrgId = "org-byo" } = req.body;
  const prompt = `You are the Connected Newsroom Editorial Kanban AI Architect.
For the collaborative investigation "${investigationTitle}" (Hypothesis/Lead: "${leadHypothesis}"), generate 3 concrete cross-newsroom verification tasks across the workflow stages.
Return strictly a JSON object:
{
  "tasks": [
    {
      "title": "short task title",
      "description": "specific action for reporter",
      "columnId": "leads" | "doc_verification" | "field_reporting" | "editorial_review",
      "assignedOrgId": "org-byo" | "org-cite" | "org-hre",
      "assigneeName": "Nomsa Dube" | "Sipho Ncube" | "Tendai Moyo",
      "priority": "Critical" | "High",
      "evidenceRef": "Document or field target"
    }
  ]
}`;

  const fallback = {
    tasks: [
      {
        title: "Cross-check company registry beneficial owners in Harare",
        description:
          "Pull CR14 filings for Kalahari Hydro Logistics and match against tender award dates.",
        columnId: "doc_verification",
        assignedOrgId: "org-hre",
        assigneeName: "Tendai Moyo (Harare Collective)",
        priority: "Critical",
        evidenceRef: "Auditor-General Annex p. 47",
      },
      {
        title: "Conduct drone & water-sample verification at Weir #3",
        description:
          "Capture geotagged orthomosaic imagery of Tailings Dam #2 liner breach.",
        columnId: "field_reporting",
        assignedOrgId: "org-cite",
        assigneeName: "Sipho Ncube (CITE ZW)",
        priority: "High",
        evidenceRef: "EMA Compliance Order #EMA-BYO-882",
      },
      {
        title: "Dispatch 48-hour Right-of-Reply letter to named directors",
        description:
          "Send formal written questions to ZINWA Catchment Manager and contractor directors.",
        columnId: "editorial_review",
        assignedOrgId: activeOrgId,
        assigneeName: "Nomsa Dube (Matabeleland Ind.)",
        priority: "Critical",
        evidenceRef: "Legal Pre-Pub Protocol",
      },
    ],
  };

  const generated = await callGeminiJson(prompt, fallback);
  res.json({
    model: GEMINI_MODEL,
    tasks: generated.tasks || fallback.tasks,
  });
});

// 6. GitHub-Style Automated Pull Request Citation & Defamation Reviewer (Gemini 3.8 Flash)
app.post("/api/github/ai-pr-review", async (req, res) => {
  const { headline, bodyMarkdown, documentTitles = [] } = req.body;
  const citationsFound = (bodyMarkdown || "").match(/\[Citation:[^\]]+\]/g) || [];

  const prompt = `You are the Connected Newsroom GitHub-Style Pull Request Editorial & Legal Reviewer.
Review this investigative story draft before human editors merge it to the News Exchange.
Headline: "${headline}"
Draft Body:
"""
${bodyMarkdown}
"""
Indexed Repository Documents: ${documentTitles.join(", ")}
Return strictly JSON:
{
  "readinessScore": number (0 to 100),
  "status": "READY_FOR_HUMAN_SIGN_OFF" | "NEEDS_CITATIONS_OR_REPLY",
  "verifiedClaimsCount": number,
  "unverifiedWarnings": ["string warning 1"],
  "rightOfReplyCheck": "1 sentence assessment of whether named subjects' responses are included",
  "summaryVerdict": "2 concise sentences summarizing editorial & legal readiness"
}`;

  const fallback = {
    readinessScore: citationsFound.length >= 2 ? 94 : 68,
    status:
      citationsFound.length >= 2
        ? "READY_FOR_HUMAN_SIGN_OFF"
        : "NEEDS_CITATIONS_OR_REPLY",
    verifiedClaimsCount: citationsFound.length,
    unverifiedWarnings:
      citationsFound.length >= 2
        ? [
            "Ensure the 48-hour Right-of-Reply window for Kalahari Hydro Logistics is logged before final publication.",
          ]
        : [
            " Fewer than 2 inline [Citation: Doc, p. X] tags found in draft body—insert primary source citations before merging.",
          ],
    rightOfReplyCheck:
      "Draft references right-of-reply outreach; confirm signed legal gate before publishing to wire.",
    summaryVerdict: `Automated PR check detected ${citationsFound.length} inline primary source citation(s). Human 3-Gate Editorial & Legal sign-off is required to unlock publication.`,
  };

  const review = await callGeminiJson(prompt, fallback);
  res.json({
    model: GEMINI_MODEL,
    commitSha: crypto
      .createHash("sha1")
      .update(`${headline}-${bodyMarkdown}`)
      .digest("hex")
      .slice(0, 7),
    citationsDetected: citationsFound,
    ...review,
  });
});

app.listen(PORT, () => {
  console.log(
    `[Connected Newsroom Backend] Express + SQLite + Gemini (${GEMINI_MODEL}) listening on http://localhost:${PORT}`
  );
});

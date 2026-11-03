import { NextResponse } from "next/server";

export interface OpenSourceAppIntegration {
  id: string;
  name: string;
  role: string;
  moduleMapped: "gear" | "kanban" | "ocr" | "ai";
  serviceUrl: string;
}

export async function GET() {
  const apps: OpenSourceAppIntegration[] = [
    {
      id: "feature-evidence-vault",
      name: "Evidence Vault & OCR",
      role: "Document Archive & OCR",
      moduleMapped: "ai",
      serviceUrl: process.env.EVIDENCE_VAULT_URL || "http://localhost:8000",
    },
    {
      id: "feature-kanban",
      name: "Full Kanban Board",
      role: "Editorial Task Board",
      moduleMapped: "kanban",
      serviceUrl: process.env.KANBAN_SERVICE_URL || "http://localhost:3001",
    },
    {
      id: "feature-gear",
      name: "Full Asset Registry",
      role: "Equipment Inventory & Check-Out",
      moduleMapped: "gear",
      serviceUrl: process.env.GEAR_SERVICE_URL || "http://localhost:3002",
    },
  ];

  return NextResponse.json({
    apps,
    hasServerGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
}

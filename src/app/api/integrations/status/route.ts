import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

export interface OpenSourceAppIntegration {
  id: string;
  name: string;
  role: string;
  moduleMapped: "gear" | "kanban" | "ocr" | "ai";
  repoUrl: string;
  localClonePath: string;
  isClonedLocally: boolean;
  serviceUrl: string;
  dockerService: string;
  status: "Active (Integrated)" | "Cloned & Ready (Docker)" | "External Link";
  description: string;
}

export async function GET() {
  const cwd = process.cwd();

  const checkDir = (relPath: string) => {
    try {
      return fs.existsSync(path.join(cwd, relPath));
    } catch {
      return false;
    }
  };

  const apps: OpenSourceAppIntegration[] = [
    {
      id: "oss-tesseract",
      name: "Tesseract.js v7 + Paperless-ngx",
      role: "Free Open-Source OCR & Scanned Document Archive",
      moduleMapped: "ocr",
      repoUrl: "https://github.com/paperless-ngx/paperless-ngx",
      localClonePath: "external-apps/paperless-ngx",
      isClonedLocally:
        checkDir("external-apps/paperless-ngx") &&
        checkDir("node_modules/tesseract.js"),
      serviceUrl: process.env.PAPERLESS_OCR_URL || "http://localhost:8000",
      dockerService: "paperless-ngx",
      status: "Active (Integrated)",
      description:
        "Cloned in ./external-apps/paperless-ngx and wired directly into /api/documents/upload via tesseract.js v7.0.0 for free OCR on photographed receipts & scanned PDFs.",
    },
    {
      id: "oss-gemma-webui",
      name: "Google Gemma 3 (4B) + Open-WebUI RAG",
      role: "Small LLM Grounded Research Copilot & Citation Engine",
      moduleMapped: "ai",
      repoUrl: "https://github.com/open-webui/open-webui",
      localClonePath: "docker-compose.yml (open-webui + ollama)",
      isClonedLocally: true,
      serviceUrl: process.env.OPEN_WEBUI_URL || "http://localhost:8080",
      dockerService: "open-webui + ollama",
      status: "Active (Integrated)",
      description:
        "Wired into /api/ai/research to route confidential leaks to local Ollama (gemma3:4b) and public audit PDFs to Google Gemini Flash-Lite.",
    },
    {
      id: "oss-planka",
      name: "Planka Open-Source Kanban",
      role: "Cross-Newsroom Investigation & Verification Kanban Board",
      moduleMapped: "kanban",
      repoUrl: "https://github.com/plankanban/planka",
      localClonePath: "external-apps/planka",
      isClonedLocally: checkDir("external-apps/planka"),
      serviceUrl: process.env.PLANKA_URL || "http://localhost:3001",
      dockerService: "planka",
      status: checkDir("external-apps/planka")
        ? "Cloned & Ready (Docker)"
        : "External Link",
      description:
        "Cloned in ./external-apps/planka and linked on port 3001 for real-time multi-newsroom Kanban boards, checklists, and attachments.",
    },
    {
      id: "oss-homebox",
      name: "Homebox Equipment & Asset Exchange",
      role: "Serialized Camera, Drone & Field Kit Inventory & Check-Out",
      moduleMapped: "gear",
      repoUrl: "https://github.com/sysadminsmedia/homebox",
      localClonePath: "external-apps/homebox",
      isClonedLocally: checkDir("external-apps/homebox"),
      serviceUrl: process.env.HOMEBOX_URL || "http://localhost:3002",
      dockerService: "homebox",
      status: checkDir("external-apps/homebox")
        ? "Cloned & Ready (Docker)"
        : "External Link",
      description:
        "Cloned in ./external-apps/homebox and linked on port 3002 for serialized newsroom gear tracking, QR labels, and check-out condition logs.",
    },
  ];

  return NextResponse.json({
    apps,
    composeCommand: "docker compose up -d planka homebox paperless-ngx open-webui ollama",
  });
}

import { NextResponse } from "next/server";
import { auth } from "@sass-store/config/auth";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const dynamic = "force-dynamic";

interface QualityFinding {
  severity: string;
  message: string;
  category: string;
}

interface QualityData {
  qualityScore: number;
  documentation: number;
  agentsContract: number;
  testFilesDetected: number;
  backendEndpointsDetected: number;
  frontendRoutesDetected: number;
  ciPipelineDetected: boolean;
  lastScan: string;
  findings: QualityFinding[];
}

function buildFallbackData(): QualityData {
  return {
    qualityScore: 0,
    documentation: 0,
    agentsContract: 0,
    testFilesDetected: 0,
    backendEndpointsDetected: 0,
    frontendRoutesDetected: 0,
    ciPipelineDetected: false,
    lastScan: new Date().toISOString(),
    findings: [
      {
        severity: "P0",
        message: "No se encontró quality-report.json en .agent-reports",
        category: "quality-os",
      },
    ],
  };
}

/**
 * GET /api/system/quality
 * Returns Quality OS score and findings from quality-report.json.
 * Requires authenticated session (admin preferred).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let data: QualityData;
  try {
    const filePath = join(
      process.cwd(),
      ".agent-reports",
      "quality-report.json",
    );
    const raw = await readFile(filePath, "utf-8");
    const parsed = JSON.parse(raw);

    const findings: QualityFinding[] = [];
    if (Array.isArray(parsed.findings)) {
      for (const f of parsed.findings) {
        findings.push({
          severity: String(f.severity || f.level || "P2"),
          message: String(f.message || f.title || "Sin descripción"),
          category: String(f.category || "general"),
        });
      }
    } else if (parsed.issues) {
      for (const [key, value] of Object.entries(
        parsed.issues as Record<string, unknown>,
      )) {
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === "string") {
              findings.push({ severity: key, message: item, category: key });
            } else if (item && typeof item === "object") {
              findings.push({
                severity: String(
                  (item as { severity?: string }).severity || key,
                ),
                message: String(
                  (item as { message?: string }).message ||
                    JSON.stringify(item),
                ),
                category: String(
                  (item as { category?: string }).category || key,
                ),
              });
            }
          }
        }
      }
    }

    data = {
      qualityScore:
        typeof parsed.qualityScore === "number" ? parsed.qualityScore : 0,
      documentation:
        typeof parsed.documentation === "number" ? parsed.documentation : 0,
      agentsContract:
        typeof parsed.agentsContract === "number" ? parsed.agentsContract : 0,
      testFilesDetected:
        typeof parsed.testFilesDetected === "number"
          ? parsed.testFilesDetected
          : 0,
      backendEndpointsDetected:
        typeof parsed.backendEndpointsDetected === "number"
          ? parsed.backendEndpointsDetected
          : 0,
      frontendRoutesDetected:
        typeof parsed.frontendRoutesDetected === "number"
          ? parsed.frontendRoutesDetected
          : 0,
      ciPipelineDetected: Boolean(
        parsed.ciPipelineDetected ?? parsed.ciPipeline,
      ),
      lastScan:
        parsed.lastScan || parsed.lastScanAt || new Date().toISOString(),
      findings,
    };
  } catch {
    data = buildFallbackData();
  }

  return NextResponse.json({
    success: true,
    data,
  });
}

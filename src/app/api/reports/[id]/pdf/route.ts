import { NextResponse } from "next/server";

import { getCaseById } from "@/lib/data";
import { prisma } from "@/lib/prisma";
import { createReportPdf } from "@/lib/reports";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const report = await prisma.report.findUnique({
    where: { id },
  });

  if (!report) {
    return NextResponse.json({ error: "Report not found." }, { status: 404 });
  }

  const item = await getCaseById(report.caseId);
  if (!item) {
    return NextResponse.json({ error: "Case not found." }, { status: 404 });
  }

  const bytes = await createReportPdf({
    caseHeader: {
      title: item.title,
      description: item.description,
      tags: item.tags,
    },
    report: {
      id: report.id,
      title: report.title,
      authorDisplayName: report.authorDisplayName,
      status: report.status,
      clinicalInfo: report.clinicalInfo,
      technique: report.technique,
      findings: report.findings,
      impression: report.impression,
      revisionNumber: report.revisionNumber,
      createdAt: report.createdAt.toISOString(),
      updatedAt: report.updatedAt.toISOString(),
      finalizedAt: report.finalizedAt?.toISOString() ?? null,
    },
    studies: item.studies,
  });

  return new NextResponse(Buffer.from(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="${report.title.replace(/\s+/g, "-").toLowerCase() || "report"}.pdf"`,
    },
  });
}

import { NextResponse } from "next/server";

import { updateReportWithRevision } from "@/lib/report-service";
import { updateReportSchema } from "@/lib/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const payload = updateReportSchema.parse(await request.json());
    const report = await updateReportWithRevision(id, {
      title: payload.title,
      authorDisplayName: payload.authorDisplayName,
      clinicalInfo: payload.clinicalInfo,
      technique: payload.technique,
      findings: payload.findings,
      impression: payload.impression,
      status: payload.status,
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json({ id: report.id });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update report.",
      },
      { status: 400 },
    );
  }
}

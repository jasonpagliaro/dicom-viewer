import { NextResponse } from "next/server";

import { updateReportWithRevision } from "@/lib/report-service";
import { finalizeReportSchema } from "@/lib/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const payload = finalizeReportSchema.parse(await request.json());
    const report = await updateReportWithRevision(id, {
      status: payload.status,
    });

    if (!report) {
      return NextResponse.json({ error: "Report not found." }, { status: 404 });
    }

    return NextResponse.json({ id: report.id });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update report status.",
      },
      { status: 400 },
    );
  }
}

import { NextResponse } from "next/server";

import { createReportForCase } from "@/lib/report-service";
import { createReportSchema } from "@/lib/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const payload = createReportSchema.parse(await request.json());
    const report = await createReportForCase(id, {
      title: payload.title || undefined,
      authorDisplayName: payload.authorDisplayName || null,
    });

    return NextResponse.json({ id: report.id }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create report.",
      },
      { status: 400 },
    );
  }
}

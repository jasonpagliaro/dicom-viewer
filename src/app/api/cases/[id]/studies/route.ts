import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { attachStudySchema } from "@/lib/schemas";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const payload = attachStudySchema.parse(await request.json());
    const count = await prisma.caseStudy.count({
      where: { caseId: id },
    });

    await prisma.caseStudy.upsert({
      where: {
        caseId_studyId: {
          caseId: id,
          studyId: payload.studyId,
        },
      },
      update: {},
      create: {
        caseId: id,
        studyId: payload.studyId,
        position: count,
      },
    });

    await prisma.case.update({
      where: { id },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to attach study.",
      },
      { status: 400 },
    );
  }
}

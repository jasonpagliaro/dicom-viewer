import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { updateCaseSchema } from "@/lib/schemas";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const payload = updateCaseSchema.parse(await request.json());
    const item = await prisma.case.update({
      where: { id },
      data: {
        title: payload.title,
        description: payload.description === undefined ? undefined : payload.description || null,
        tags: payload.tags,
      },
    });

    return NextResponse.json({ id: item.id });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to update case.",
      },
      { status: 400 },
    );
  }
}

import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createCaseSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const payload = createCaseSchema.parse(await request.json());
    const item = await prisma.case.create({
      data: {
        title: payload.title,
        description: payload.description || null,
        tags: payload.tags,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(item, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create case.",
      },
      { status: 400 },
    );
  }
}

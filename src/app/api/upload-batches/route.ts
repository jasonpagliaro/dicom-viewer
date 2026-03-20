import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import { createUploadBatchSchema } from "@/lib/schemas";

export async function POST(request: Request) {
  try {
    const payload = createUploadBatchSchema.parse(await request.json());
    const batch = await prisma.uploadBatch.create({
      data: {
        label: payload.label || null,
        expectedFilesCount: payload.expectedFilesCount,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json(batch, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create upload batch.",
      },
      { status: 400 },
    );
  }
}

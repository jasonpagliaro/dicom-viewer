import { NextResponse } from "next/server";
import { customAlphabet } from "nanoid";

import { prisma } from "@/lib/prisma";
import { createShareSchema } from "@/lib/schemas";

const generateShareToken = customAlphabet("0123456789abcdefghijklmnopqrstuvwxyz", 18);

export async function POST(request: Request) {
  try {
    const payload = createShareSchema.parse(await request.json());
    const share = await prisma.shareToken.create({
      data: {
        caseId: payload.caseId,
        label: payload.label || null,
        token: generateShareToken(),
      },
      select: {
        id: true,
        token: true,
      },
    });

    await prisma.case.update({
      where: { id: payload.caseId },
      data: { updatedAt: new Date() },
    });

    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      {
        error: error instanceof Error ? error.message : "Unable to create share link.",
      },
      { status: 400 },
    );
  }
}

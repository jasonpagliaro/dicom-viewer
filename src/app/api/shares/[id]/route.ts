import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const share = await prisma.shareToken.findUnique({
    where: { id },
  });

  if (!share) {
    return NextResponse.json({ error: "Share link not found." }, { status: 404 });
  }

  await prisma.shareToken.update({
    where: { id },
    data: {
      revokedAt: share.revokedAt ?? new Date(),
    },
  });

  await prisma.case.update({
    where: { id: share.caseId },
    data: { updatedAt: new Date() },
  });

  return NextResponse.json({ ok: true });
}

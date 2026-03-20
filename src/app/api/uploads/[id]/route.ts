import { NextResponse } from "next/server";

import { getUploadBatchById } from "@/lib/data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const batch = await getUploadBatchById(id);

  if (!batch) {
    return NextResponse.json({ error: "Upload batch not found." }, { status: 404 });
  }

  return NextResponse.json(batch);
}

import { NextResponse } from "next/server";

import { getStudyById } from "@/lib/data";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;
  const study = await getStudyById(id);

  if (!study) {
    return NextResponse.json({ error: "Study not found." }, { status: 404 });
  }

  return NextResponse.json(study);
}

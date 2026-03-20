import { NextResponse } from "next/server";

import { listStudies } from "@/lib/data";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const studies = await listStudies(searchParams.get("q") ?? undefined);
  return NextResponse.json(studies);
}

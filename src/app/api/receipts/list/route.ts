import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId");

  return NextResponse.json({
    familyId,
    receipts: [],
    note: "Hackathon MVP: receipt indexing is not yet persisted; store and track receipt CIDs client-side or add a DB index.",
  });
}


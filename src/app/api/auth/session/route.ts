import { NextRequest, NextResponse } from "next/server";
import { bootstrapSession } from "@/lib/auth/sessionBootstrap";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const result = await bootstrapSession({
      role: body.role,
      pkpPublicKey: body.pkpPublicKey,
      pkpTokenId: body.pkpTokenId,
      pkpAddress: body.pkpAddress,
      authMethod: body.authMethod,
      address: body.address,
      phoneNumber: body.phoneNumber,
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}

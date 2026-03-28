import { NextRequest, NextResponse } from "next/server";

import { getSessionSigs, mintPKPWithGoogle } from "@/lib/lit/auth";
import type { UserSession } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { googleIdToken, familyId } = body;

    const pkp = await mintPKPWithGoogle(googleIdToken, "guardian");
    const authMethod = { authMethodType: 6, accessToken: googleIdToken };
    const sessionSigs = await getSessionSigs(pkp.publicKey, authMethod);

    const session: UserSession = {
      role: "guardian",
      address: pkp.ethAddress,
      pkpPublicKey: pkp.publicKey,
      pkpTokenId: pkp.tokenId,
      familyId,
      sessionSigs,
      authMethod,
    };

    return NextResponse.json({ success: true, session });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}


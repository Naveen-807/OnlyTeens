import { NextRequest, NextResponse } from "next/server";

import { bootstrapSession } from "@/lib/auth/sessionBootstrap";
import { getSessionSigs, mintPKPWithGoogle } from "@/lib/lit/auth";
import type { UserSession } from "@/lib/types";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { googleIdToken, familyId } = body;

    const pkp = await mintPKPWithGoogle(googleIdToken, "teen");
    const authMethod = { authMethodType: 6, accessToken: googleIdToken };
    const sessionSigs = await getSessionSigs(pkp.publicKey, authMethod);

    const session: UserSession = {
      role: "teen",
      address: pkp.ethAddress,
      pkpPublicKey: pkp.publicKey,
      pkpTokenId: pkp.tokenId,
      familyId,
      sessionSigs,
      authMethod,
    };

    const bootstrap = await bootstrapSession({
      role: session.role,
      pkpPublicKey: session.pkpPublicKey,
      pkpTokenId: session.pkpTokenId,
      authMethod: { ...authMethod, sessionSigs },
      address: session.address,
    });

    return NextResponse.json({ success: true, ...bootstrap, session: { ...bootstrap.session, sessionSigs } });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error?.message },
      { status: 500 },
    );
  }
}

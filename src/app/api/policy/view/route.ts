import { fail, mapErrorToCode, ok } from "@/lib/api/response";
import { assertContractConfigForDemo } from "@/lib/runtime/config";
import { guardianDecryptPolicy } from "@/lib/zama/decrypt";

export async function GET(request: Request) {
  try {
    assertContractConfigForDemo();
    const { searchParams } = new URL(request.url);
    const familyId = searchParams.get("familyId");

    if (!familyId) {
      return fail("BAD_REQUEST", "familyId is required", 400);
    }

    const policy = await guardianDecryptPolicy({
      familyId: familyId as `0x${string}`,
    });

    return ok(policy);
  } catch (error: any) {
    return fail(mapErrorToCode(error), error?.message || "Policy view failed", 500);
  }
}

import { ok } from "@/lib/api/response";
import { getRuntimeCapabilities } from "@/lib/runtime/capabilities";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const familyId = searchParams.get("familyId") || undefined;

  return ok({
    capabilities: await getRuntimeCapabilities(familyId),
  });
}

import { NextRequest, NextResponse } from "next/server";
import {
  getReceiptsByFamily,
  getReceiptsByTeen,
} from "@/lib/receipts/receiptStore";
import { fail, mapErrorToCode, ok } from "@/lib/api/response";

export async function GET(req: NextRequest) {
  try {
    const familyId = req.nextUrl.searchParams.get("familyId");
    const teenAddress = req.nextUrl.searchParams.get("teenAddress");

    let receipts;
    if (familyId) {
      receipts = getReceiptsByFamily(familyId);
    } else if (teenAddress) {
      receipts = getReceiptsByTeen(teenAddress);
    } else {
      return fail("BAD_REQUEST", "familyId or teenAddress required", 400);
    }

    return ok({ items: receipts, receipts, count: receipts.length });
  } catch (error: any) {
    return fail(mapErrorToCode(error), error.message, 500);
  }
}

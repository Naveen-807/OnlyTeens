export function flowToWei(flowAmount: string | number): bigint {
  const value = typeof flowAmount === "number" ? flowAmount : Number(flowAmount);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid FLOW amount: ${flowAmount}`);
  }
  return BigInt(Math.round(value * 1e18));
}

export function inrToPaise(amountInInr: string | number): number {
  const value = typeof amountInInr === "number" ? amountInInr : Number(amountInInr);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid INR amount: ${amountInInr}`);
  }
  return Math.round(value * 100);
}


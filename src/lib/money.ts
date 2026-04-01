export function flowToWei(flowAmount: string | number): bigint {
  const value = typeof flowAmount === "number" ? flowAmount : Number(flowAmount);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid FLOW amount: ${flowAmount}`);
  }
  return BigInt(Math.round(value * 1e18));
}

export function flowToPolicyUnits(flowAmount: string | number): number {
  const value = typeof flowAmount === "number" ? flowAmount : Number(flowAmount);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid FLOW amount: ${flowAmount}`);
  }
  return Math.round(value);
}

export function formatFlowAmount(flowAmount: string | number): string {
  const value = typeof flowAmount === "number" ? flowAmount : Number(flowAmount);
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Invalid FLOW amount: ${flowAmount}`);
  }
  return value.toFixed(2);
}


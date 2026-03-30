function isHexPrivateKey(value: string): boolean {
  return /^(0x)?[0-9a-fA-F]{64}$/.test(value);
}

export function normalizePrivateKeyEnv(name: string, rawValue?: string): `0x${string}` {
  const value = rawValue?.trim();

  if (!value) {
    throw new Error(`Missing ${name}`);
  }

  if (!isHexPrivateKey(value)) {
    throw new Error(
      `${name} must be a 32-byte secp256k1 private key in hex format (0x-prefixed or 64 hex chars)`,
    );
  }

  return (value.startsWith("0x") ? value : `0x${value}`) as `0x${string}`;
}

import { PrivateKey } from '@hashgraph/sdk';

/**
 * Parse Hedera private keys safely for both raw 0x-prefixed ECDSA keys
 * and the usual SDK string formats.
 */
export function parseHederaPrivateKey(rawKey: string): PrivateKey {
  if (rawKey.startsWith('0x')) {
    return PrivateKey.fromStringECDSA(rawKey);
  }

  return PrivateKey.fromString(rawKey);
}

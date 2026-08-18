import "server-only";

import { decryptJson, decryptText, encryptJson, encryptText, isEncryptedValue } from "@/lib/data-encryption";

export function readPrivateText(encrypted: string | null | undefined, legacy: string | null | undefined) {
  return isEncryptedValue(encrypted) ? decryptText(encrypted) : legacy ?? null;
}

export function readPrivateJson(encrypted: string | null | undefined, legacy: unknown) {
  return isEncryptedValue(encrypted) ? decryptJson(encrypted) : legacy ?? null;
}

export function writePrivateText(value: string | null | undefined) { return encryptText(value || null); }
export function writePrivateJson(value: unknown) { return encryptJson(value); }

import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

const ALGORITHM = "aes-256-gcm";
const IV_BYTES = 12;
const KEY_BYTES = 32;
const TAG_BYTES = 16;
const FORMAT_VERSION = "v1";

type EncryptionKey = { version: string; key: Buffer };

function parseKey(raw: string | undefined, fallbackVersion: string): EncryptionKey | null {
  if (!raw?.trim()) return null;
  const trimmed = raw.trim();
  const separator = trimmed.indexOf(":");
  const version = separator > 0 ? trimmed.slice(0, separator) : fallbackVersion;
  const encoded = separator > 0 ? trimmed.slice(separator + 1) : trimmed;
  const key = Buffer.from(encoded, "base64");
  if (key.length !== KEY_BYTES) throw new Error("DATA_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  return { version, key };
}

function currentKey() {
  const key = parseKey(process.env.DATA_ENCRYPTION_KEY, "current");
  if (!key) throw new Error("DATA_ENCRYPTION_KEY is required for encrypted customer data.");
  return key;
}

function decryptionKeys() {
  const keys = [parseKey(process.env.DATA_ENCRYPTION_KEY, "current"), parseKey(process.env.DATA_ENCRYPTION_KEY_PREVIOUS, "previous")].filter((key): key is EncryptionKey => Boolean(key));
  if (keys.length === 0) throw new Error("DATA_ENCRYPTION_KEY is required to decrypt customer data.");
  return keys;
}

function encode(value: Buffer) { return value.toString("base64url"); }
function decode(value: string) { return Buffer.from(value, "base64url"); }

export function isEncryptedValue(value: unknown): value is string {
  return typeof value === "string" && value.startsWith(`${FORMAT_VERSION}.`) && value.split(".").length === 5;
}

export function encryptText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  const selected = currentKey();
  const iv = randomBytes(IV_BYTES);
  const cipher = createCipheriv(ALGORITHM, selected.key, iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  return [FORMAT_VERSION, selected.version, encode(iv), encode(cipher.getAuthTag()), encode(ciphertext)].join(".");
}

export function decryptText(value: string | null | undefined): string | null {
  if (value === null || value === undefined) return null;
  if (!isEncryptedValue(value)) throw new Error("Value is not encrypted customer data.");
  const [, version, ivEncoded, tagEncoded, ciphertextEncoded] = value.split(".");
  const iv = decode(ivEncoded);
  const tag = decode(tagEncoded);
  if (iv.length !== IV_BYTES || tag.length !== TAG_BYTES) throw new Error("Encrypted customer data is malformed.");
  const candidates = decryptionKeys();
  const preferred = candidates.filter((candidate) => candidate.version === version);
  const ordered = [...preferred, ...candidates.filter((candidate) => candidate.version !== version)];
  for (const candidate of ordered) {
    try {
      const decipher = createDecipheriv(ALGORITHM, candidate.key, iv);
      decipher.setAuthTag(tag);
      return Buffer.concat([decipher.update(decode(ciphertextEncoded)), decipher.final()]).toString("utf8");
    } catch {
      // Try the previous rotation key without exposing ciphertext or key material.
    }
  }
  throw new Error("Encrypted customer data could not be authenticated.");
}

export function encryptJson(value: unknown): string | null {
  return value === null || value === undefined ? null : encryptText(JSON.stringify(value));
}

export function decryptJson(value: string | null | undefined): unknown | null {
  const text = decryptText(value);
  return text === null ? null : JSON.parse(text);
}

export function generateDataEncryptionKey() { return randomBytes(KEY_BYTES).toString("base64"); }

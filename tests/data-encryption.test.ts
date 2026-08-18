import { beforeEach, describe, expect, it } from "vitest";
import { decryptJson, decryptText, encryptJson, encryptText } from "../lib/data-encryption";

beforeEach(() => { process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 7).toString("base64"); delete process.env.DATA_ENCRYPTION_KEY_PREVIOUS; });

describe("data encryption", () => {
  it("uses a fresh IV for identical values", () => { expect(encryptText("same")).not.toBe(encryptText("same")); });
  it("round trips text and JSON", () => { const text = encryptText("customer note"); expect(decryptText(text)).toBe("customer note"); const json = encryptJson({ total: 90000, currency: "LKR" }); expect(decryptJson(json)).toEqual({ total: 90000, currency: "LKR" }); });
  it("rejects tampered ciphertext and wrong keys", () => { const value = encryptText("secret")!; const parts = value.split("."); parts[4] = `${parts[4].slice(0, -1)}${parts[4].at(-1) === "A" ? "B" : "A"}`; expect(() => decryptText(parts.join("."))).toThrow(); process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 8).toString("base64"); expect(() => decryptText(value)).toThrow(); });
  it("supports a previous key during rotation", () => { const previous = process.env.DATA_ENCRYPTION_KEY; const value = encryptText("rotating")!; process.env.DATA_ENCRYPTION_KEY = Buffer.alloc(32, 8).toString("base64"); process.env.DATA_ENCRYPTION_KEY_PREVIOUS = previous; expect(decryptText(value)).toBe("rotating"); });
});

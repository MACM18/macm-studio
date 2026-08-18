import { describe, expect, it } from "vitest";
import { localeFromCookie, normalizeLocale, translate, translateStatus } from "../lib/i18n";

describe("language mode", () => {
  it("normalizes supported and unknown locales safely", () => {
    expect(normalizeLocale("si")).toBe("si");
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("fr")).toBe("en");
    expect(localeFromCookie("si")).toBe("si");
    expect(localeFromCookie(undefined)).toBe("en");
  });

  it("returns curated translations and keeps English as the fallback locale", () => {
    expect(translate("si", "nav.plan")).toContain("website");
    expect(translate("en", "nav.plan")).toBe("Plan my website");
    expect(translate("en", "nav.plan")).toBe(translate("en", "nav.plan"));
  });

  it("keeps the hero English while exposing Sinhala helper copy", () => {
    expect(translate("en", "hero.title")).toBe("Websites that work. Built with care.");
    expect(translate("si", "hero.title")).not.toBe(translate("en", "hero.title"));
    expect(translate("si", "hero.overlay.title")).toContain("websites");
    expect(translate("en", "hero.overlay.title")).toContain("websites");
  });

  it("translates shared status labels without changing stored values", () => {
    expect(translateStatus("en", "PUBLISHED")).toBe("PUBLISHED");
    expect(translateStatus("si", "PUBLISHED")).toBe("Publish කර ඇත");
    expect(translateStatus("si", "UNKNOWN_STATUS")).toBe("UNKNOWN STATUS");
  });
});

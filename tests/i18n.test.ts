import { describe, expect, it } from "vitest";
import { localeFromCookie, normalizeLocale, translate, translateStatus } from "../lib/i18n";

describe("language mode", () => {
  it("normalizes all locales to English", () => {
    expect(normalizeLocale("si")).toBe("en");
    expect(normalizeLocale("en")).toBe("en");
    expect(normalizeLocale("fr")).toBe("en");
    expect(localeFromCookie("si")).toBe("en");
    expect(localeFromCookie(undefined)).toBe("en");
  });

  it("returns curated English translations", () => {
    expect(translate("en", "nav.plan")).toBe("Plan my website");
    expect(translate("en", "hero.title")).toBe("Websites that work. Built with care.");
  });

  it("translates shared status labels into readable English", () => {
    expect(translateStatus("en", "PUBLISHED")).toBe("PUBLISHED");
    expect(translateStatus("en", "IN_PROGRESS")).toBe("IN PROGRESS");
    expect(translateStatus("en", "NOT_STARTED")).toBe("NOT STARTED");
  });
});

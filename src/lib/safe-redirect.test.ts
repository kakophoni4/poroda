import { describe, expect, it } from "vitest";
import { safeNextPath } from "./safe-redirect";

describe("safeNextPath", () => {
  const def = "/account";

  it('допустимый путь "/account"', () => {
    expect(safeNextPath("/account")).toBe("/account");
  });

  it("//evil.com — отклоняется", () => {
    expect(safeNextPath("//evil.com/x", def)).toBe(def);
  });

  it("внешний http — отклоняется", () => {
    expect(safeNextPath("http://evil", def)).toBe(def);
  });

  it("javascript: — отклоняется", () => {
    expect(safeNextPath("javascript:alert(1)", def)).toBe(def);
  });

  it("переносы строки — отклоняется", () => {
    expect(safeNextPath("/foo\nbar", def)).toBe(def);
  });

  it("undefined — fallback по умолчанию (в коде /account)", () => {
    expect(safeNextPath(undefined)).toBe("/account");
  });

  it("слишком длинный путь — отклоняется", () => {
    expect(safeNextPath("/" + "a".repeat(300), def)).toBe(def);
  });

  it("кастомный fallback", () => {
    expect(safeNextPath(null, "/")).toBe("/");
  });
});

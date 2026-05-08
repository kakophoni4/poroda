import { describe, expect, it } from "vitest";
import { sanitizeRichHtml, sanitizeText } from "./sanitize";

describe("sanitizeText", () => {
  it("убирает теги script", () => {
    expect(sanitizeText("<script>x</script>hello")).toBe("hello");
  });
});

describe("sanitizeRichHtml", () => {
  it("сохраняет разрешённые p и a", () => {
    const out = sanitizeRichHtml("<p><a href='/x'>ok</a></p>");
    expect(out).toContain("<p");
    expect(out).toContain("<a ");
    expect(out).toContain(">ok<");
  });

  it("убирает onerror с img", () => {
    const out = sanitizeRichHtml("<img src='x' onerror='y'>");
    expect(out).not.toMatch(/onerror/i);
  });

  it("убирает script", () => {
    const out = sanitizeRichHtml("<script>alert(1)</script><p>hi</p>");
    expect(out).not.toContain("<script");
    expect(out).toContain("hi");
  });
});

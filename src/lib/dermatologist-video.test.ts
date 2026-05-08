import { describe, expect, it } from "vitest";
import { parseDermatologistVideoUrl } from "./dermatologist-video";

describe("parseDermatologistVideoUrl", () => {
  it("возвращает null для пусто", () => {
    expect(parseDermatologistVideoUrl("")).toBeNull();
    expect(parseDermatologistVideoUrl("   ")).toBeNull();
    expect(parseDermatologistVideoUrl(null)).toBeNull();
    expect(parseDermatologistVideoUrl(undefined)).toBeNull();
  });

  it("принимает YouTube и нормализует URL", () => {
    const y = parseDermatologistVideoUrl("https://youtu.be/dQw4w9WgXcQ");
    expect(y).toBe("https://youtu.be/dQw4w9WgXcQ");
  });

  it("принимает Vimeo", () => {
    expect(parseDermatologistVideoUrl("https://vimeo.com/123456789")).toBe("https://vimeo.com/123456789");
  });

  it("принимает прямой mp4", () => {
    expect(parseDermatologistVideoUrl("https://example.com/v/file.mp4")).toBe("https://example.com/v/file.mp4");
  });

  it("отклоняет посторонний https-адрес", () => {
    expect(parseDermatologistVideoUrl("https://example.com/page")).toBeNull();
  });

  it("отклоняет невалидную строку", () => {
    expect(parseDermatologistVideoUrl("not-a-url")).toBeNull();
  });
});

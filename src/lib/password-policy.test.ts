import { describe, expect, it } from "vitest";
import { validatePassword } from "./password-policy";

describe("validatePassword", () => {
  it("пустая строка — минимальная длина", () => {
    const r = validatePassword("");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("Минимум 8 символов");
  });

  it("не-строка", () => {
    const r = validatePassword(null as unknown as string);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("Пароль должен быть строкой");
  });

  it("1234567 (короткий)", () => {
    const r = validatePassword("1234567");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("Минимум 8 символов");
  });

  it("«12345678» — сначала требуется буква; слабый список срабатывает позже", () => {
    const r = validatePassword("12345678");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("Должна быть хотя бы одна буква");
  });

  it("распространённый пароль из списка", () => {
    const r = validatePassword("Password1");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("Пароль слишком распространённый");
  });

  it("abcdefgh — нет цифры", () => {
    const r = validatePassword("abcdefgh");
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("Должна быть хотя бы одна цифра");
  });

  it("12345678a — буква и цифра, не из списка", () => {
    expect(validatePassword("12345678a")).toEqual({ ok: true });
  });

  it("Passw0rd — ок", () => {
    expect(validatePassword("Passw0rd")).toEqual({ ok: true });
  });

  it("201 символ — слишком длинный", () => {
    const r = validatePassword("a".repeat(201));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("Слишком длинный пароль (макс. 200)");
  });
});

export const PASSWORD_MIN_LENGTH = 8;

const WEAK = new Set([
  "12345678",
  "password",
  "qwerty12",
  "admin123",
  "11111111",
  "87654321",
  "00000000",
  "password1",
  "qwerty123",
  "porodaadmin",
  "porodacosmetics",
]);

export function validatePassword(
  p: string
): { ok: true } | { ok: false; reason: string } {
  if (typeof p !== "string") return { ok: false, reason: "Пароль должен быть строкой" };
  if (p.length < PASSWORD_MIN_LENGTH) return { ok: false, reason: `Минимум ${PASSWORD_MIN_LENGTH} символов` };
  if (p.length > 200) return { ok: false, reason: "Слишком длинный пароль (макс. 200)" };
  if (!/[a-zA-Zа-яА-Я]/.test(p)) return { ok: false, reason: "Должна быть хотя бы одна буква" };
  if (!/[0-9]/.test(p)) return { ok: false, reason: "Должна быть хотя бы одна цифра" };
  if (WEAK.has(p.toLowerCase())) return { ok: false, reason: "Пароль слишком распространённый" };
  return { ok: true };
}

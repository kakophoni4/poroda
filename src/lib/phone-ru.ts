/** Маска отображения: +7(999)999-99-99 (10 цифр после кода страны) */

export const RU_PHONE_HINT = "Формат: +7(999)999-99-99";

/** Цифры после +7 (макс. 10) */
function nationalDigits(input: string): string {
  let d = input.replace(/\D/g, "");
  if (d.startsWith("8")) d = "7" + d.slice(1);
  if (d.startsWith("7")) d = d.slice(1);
  return d.slice(0, 10);
}

/** Форматирование при вводе; пустое → «+7» */
export function formatRuPhoneInput(raw: string): string {
  const tail = nationalDigits(raw);
  if (tail.length === 0) return "+7";
  let out = "+7(" + tail.slice(0, 3);
  if (tail.length <= 3) return out + (tail.length === 3 ? ")" : "");
  out += ")" + tail.slice(3, 6);
  if (tail.length <= 6) return out;
  out += "-" + tail.slice(6, 8);
  if (tail.length <= 8) return out;
  return out + "-" + tail.slice(8, 10);
}

export function ruPhoneNational10(display: string): string {
  return nationalDigits(display);
}

export function isRuPhoneComplete(display: string): boolean {
  return nationalDigits(display).length === 10;
}

/** Для подстановки из БД (любые цифры / +7…) */
export function formatRuPhoneFromStored(stored: string | null | undefined): string {
  if (!stored?.trim()) return "+7";
  return formatRuPhoneInput(stored);
}

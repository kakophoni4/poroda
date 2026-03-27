"use client";

import { formatRuPhoneInput, RU_PHONE_HINT } from "@/lib/phone-ru";

type Props = {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  className?: string;
  inputClassName?: string;
};

export default function PhoneInput({
  id,
  label,
  value,
  onChange,
  required,
  disabled,
  className,
  inputClassName = "liquid-input mt-1 w-full rounded-xl px-4 py-2.5",
}: Props) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-zinc-700">
        {label}
      </label>
      <input
        id={id}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        placeholder="+7(999)999-99-99"
        required={required}
        disabled={disabled}
        value={value}
        onChange={(e) => onChange(formatRuPhoneInput(e.target.value))}
        className={inputClassName}
      />
      <p className="mt-1 text-xs text-zinc-500">{RU_PHONE_HINT}</p>
    </div>
  );
}

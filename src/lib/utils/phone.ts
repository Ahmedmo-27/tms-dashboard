/** Keep digits only for tel:/wa.me links. */
export function digitsOnlyPhone(phone: string | null | undefined): string {
  return (phone ?? "").replace(/\D/g, "");
}

const INVALID_PLACEHOLDER_PHONES = new Set([
  "00000000000",
  "01111111111",
  "01000000000",
]);

export function isValidContactPhone(phone: string | null | undefined): boolean {
  const digits = digitsOnlyPhone(phone);
  if (digits.length < 10) return false;
  if (INVALID_PLACEHOLDER_PHONES.has(digits)) return false;
  if (/^0+$/.test(digits)) return false;
  if (/^(\d)\1+$/.test(digits)) return false;
  if (/^01(?:0+|1+)$/.test(digits)) return false;
  return true;
}

export function formatDisplayPhone(phone: string | null | undefined): string {
  const raw = (phone ?? "").trim();
  if (!raw) return "—";

  const digits = digitsOnlyPhone(raw);
  if (!isValidContactPhone(raw)) return raw;

  if (digits.length === 11 && digits.startsWith("20")) {
    return `+20 ${digits.slice(2, 5)} ${digits.slice(5, 8)} ${digits.slice(8)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  }

  return raw;
}

export function telHref(phone: string | null | undefined): string | undefined {
  const digits = digitsOnlyPhone(phone);
  return isValidContactPhone(phone) ? `tel:${digits}` : undefined;
}

export function whatsAppHref(phone: string | null | undefined): string | undefined {
  const digits = digitsOnlyPhone(phone);
  return isValidContactPhone(phone) ? `https://wa.me/${digits}` : undefined;
}

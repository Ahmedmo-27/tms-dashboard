import { isValidEgyptianMobile, toE164Egypt } from "./egyptian-phone";

/**
 * Returns digits-only string for tel: and wa.me links, preserving leading + if present.
 */
export function digitsOnlyPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  const hasPlus = trimmed.startsWith("+");
  const digits = trimmed.replace(/\D/g, "");
  if (!digits) return "";
  return hasPlus ? `+${digits}` : digits;
}

/**
 * Standard compact display: Egyptian mobiles formatted via toE164Egypt,
 * otherwise trimmed original (e.g. landline or international).
 */
export function formatDisplayPhone(raw: string | null | undefined): string {
  if (!raw) return "";
  const trimmed = raw.trim();
  if (isValidEgyptianMobile(trimmed)) {
    return toE164Egypt(trimmed);
  }
  return trimmed;
}

export function isValidContactPhone(raw: string | null | undefined): boolean {
  if (!raw) return false;
  const digits = raw.replace(/\D/g, "");
  return digits.length >= 7 && digits.length <= 15;
}

export function telHref(phone: string | null | undefined): string | undefined {
  const digits = digitsOnlyPhone(phone);
  return isValidContactPhone(phone) ? `tel:${digits}` : undefined;
}

export function whatsAppHref(phone: string | null | undefined, text?: string): string | undefined {
  const digits = digitsOnlyPhone(phone);
  if (!isValidContactPhone(phone)) return undefined;
  if (text) {
    return `https://wa.me/${digits}?text=${encodeURIComponent(text)}`;
  }
  return `https://wa.me/${digits}`;
}


export function normalizePhoneE164(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) {
    return null;
  }

  if (trimmed.startsWith("+")) {
    const digits = trimmed.slice(1).replace(/\D/g, "");
    if (digits.length >= 10 && digits.length <= 15) {
      return `+${digits}`;
    }
    return null;
  }

  const digitsOnly = trimmed.replace(/\D/g, "");

  // 10-digit Indian mobile (6–9 start)
  if (digitsOnly.length === 10 && /^[6-9]/.test(digitsOnly)) {
    return `+91${digitsOnly}`;
  }

  // 91 + 10 digits without +
  if (digitsOnly.length === 12 && digitsOnly.startsWith("91")) {
    return `+${digitsOnly}`;
  }

  // Leading 0 + 10 digits
  if (digitsOnly.length === 11 && digitsOnly.startsWith("0")) {
    const mobile = digitsOnly.slice(1);
    if (/^[6-9]\d{9}$/.test(mobile)) {
      return `+91${mobile}`;
    }
  }

  return null;
}

export const PHONE_FORMAT_HINT =
  "Include country code (e.g. +919876543210). Ten-digit numbers are auto-formatted as +91.";

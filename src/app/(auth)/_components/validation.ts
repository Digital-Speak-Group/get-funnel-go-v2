import { z } from "zod";
import { authMessages } from "../messages";

const v = authMessages.validation;
const Email = z.string().email();

/** Client-side inline checks; the server actions re-validate everything. */
export function emailError(email: string): string | undefined {
  if (!email.trim()) return v.emailRequired;
  return Email.safeParse(email).success ? undefined : v.emailInvalid;
}

export function passwordRequiredError(password: string): string | undefined {
  return password ? undefined : v.passwordRequired;
}

export const MIN_PASSWORD = 8;

export function newPasswordError(password: string): string | undefined {
  if (!password) return v.passwordRequired;
  return password.length >= MIN_PASSWORD ? undefined : v.passwordTooShort;
}

export function confirmError(password: string, confirm: string): string | undefined {
  if (!confirm) return v.passwordRequired;
  return confirm === password ? undefined : v.passwordMismatch;
}

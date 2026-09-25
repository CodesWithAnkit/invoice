import { isAuthError } from "@supabase/supabase-js";

export type AuthErrorKind =
  | "invalid_credentials"
  | "email_not_confirmed"
  | "user_banned"
  | "user_exists"
  | "weak_password"
  | "same_password"
  | "rate_limited"
  | "network"
  | "unknown";

export const AUTH_ERROR_MESSAGES: Record<AuthErrorKind, string> = {
  invalid_credentials: "Incorrect email or password.",
  email_not_confirmed: "Confirm your email address before signing in. Check your inbox for the link.",
  user_banned: "This account has been disabled. Contact support if you think this is a mistake.",
  user_exists: "An account with this email already exists. Sign in or reset your password.",
  weak_password: "Choose a stronger password.",
  same_password: "Your new password must be different from your current password.",
  rate_limited: "Too many attempts. Wait a few minutes and try again.",
  network: "Can't reach the server. Check your connection and try again.",
  unknown: "Something went wrong. Try again.",
};

/** Map a Supabase Auth (or fetch) error to a user-facing category. */
export function classifyAuthError(error: unknown): AuthErrorKind {
  if (error instanceof TypeError) return "network";
  if (!isAuthError(error)) return "unknown";

  switch (error.code) {
    case "invalid_credentials":
      return "invalid_credentials";
    case "email_not_confirmed":
      return "email_not_confirmed";
    case "user_banned":
      return "user_banned";
    case "user_already_exists":
    case "email_exists":
      return "user_exists";
    case "weak_password":
      return "weak_password";
    case "same_password":
      return "same_password";
    case "over_request_rate_limit":
    case "over_email_send_rate_limit":
      return "rate_limited";
  }

  if (error.name === "AuthRetryableFetchError" || error.status === 0) return "network";
  if (error.status === 429) return "rate_limited";
  return "unknown";
}

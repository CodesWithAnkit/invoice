import { z } from "zod";

// Keep in sync with Supabase Auth `minimum_password_length` (supabase/config.toml
// locally; Authentication → Policies in the hosted dashboard).
export const PASSWORD_MIN_LENGTH = 8;

const email = z
  .string()
  .trim()
  .min(1, "Email is required.")
  .email("Enter a valid email address, like name@company.com.");

const password = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`);

export const LoginSchema = z.object({
  email,
  password: z.string().min(1, "Password is required."),
});

export const RegisterSchema = z
  .object({
    fullName: z.string().trim().min(1, "Full name is required."),
    email,
    password,
    confirmPassword: z.string().min(1, "Confirm your password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export const ForgotPasswordSchema = z.object({ email });

export const ResetPasswordSchema = z
  .object({
    password,
    confirmPassword: z.string().min(1, "Confirm your new password."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

export type FieldErrors<T> = Partial<Record<keyof T, string>>;

/** Validate `data` and return the first message per field, or null when valid. */
export function fieldErrors<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown
): FieldErrors<z.infer<T>> | null {
  const result = schema.safeParse(data);
  if (result.success) return null;
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "");
    if (key && !errors[key]) errors[key] = issue.message;
  }
  return errors as FieldErrors<z.infer<T>>;
}

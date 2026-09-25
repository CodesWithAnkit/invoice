"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { createClient } from "@/lib/supabase/browser";
import { AUTH_CALLBACK_PATH, DEFAULT_AUTHED_PATH } from "@/config/auth";
import { AUTH_ERROR_MESSAGES, classifyAuthError, type AuthErrorKind } from "@/modules/auth/auth.errors";
import {
  PASSWORD_MIN_LENGTH,
  RegisterSchema,
  fieldErrors,
  type FieldErrors,
} from "@/modules/auth/auth.schema";

type Values = { fullName: string; email: string; password: string; confirmPassword: string };

const EMPTY: Values = { fullName: "", email: "", password: "", confirmPassword: "" };

export function RegisterForm() {
  const router = useRouter();
  const [values, setValues] = useState<Values>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors<Values>>({});
  const [formError, setFormError] = useState<AuthErrorKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const update = (field: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const invalid = fieldErrors(RegisterSchema, values);
    setErrors(invalid ?? {});
    if (invalid) return;

    setSubmitting(true);
    try {
      const email = values.email.trim();
      const { data, error } = await createClient().auth.signUp({
        email,
        password: values.password,
        options: {
          data: { full_name: values.fullName.trim() },
          emailRedirectTo: `${window.location.origin}${AUTH_CALLBACK_PATH}?next=${DEFAULT_AUTHED_PATH}`,
        },
      });
      if (error) {
        setFormError(classifyAuthError(error));
        return;
      }
      // With email confirmation on, Supabase answers a duplicate sign-up with
      // a user that has no identities instead of an error (AC-AUTH-001).
      if (data.user && data.user.identities?.length === 0) {
        setFormError("user_exists");
        return;
      }
      if (data.session) {
        // Email confirmation disabled: already signed in.
        router.replace(DEFAULT_AUTHED_PATH);
        router.refresh();
        return;
      }
      setSentTo(email);
    } catch (error) {
      setFormError(classifyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <>
      Already have an account?{" "}
      <Link href="/login" className="font-medium text-primary hover:underline">
        Sign in
      </Link>
    </>
  );

  if (sentTo) {
    return (
      <AuthShell title="Check your email" footer={footer}>
        <Alert variant="success">
          We sent a confirmation link to <strong className="break-all">{sentTo}</strong>. Open it to
          activate your account.
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Create your account"
      description="Start creating professional quotations in minutes."
      footer={footer}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && (
          <Alert variant="error">
            {AUTH_ERROR_MESSAGES[formError]}
            {formError === "user_exists" && (
              <div className="mt-2 flex gap-4">
                <Link href="/login" className="font-medium text-foreground underline underline-offset-4">
                  Sign in
                </Link>
                <Link
                  href="/forgot-password"
                  className="font-medium text-foreground underline underline-offset-4"
                >
                  Reset password
                </Link>
              </div>
            )}
          </Alert>
        )}

        <FormField label="Full name" error={errors.fullName}>
          {(field) => (
            <Input {...field} autoComplete="name" value={values.fullName} onChange={update("fullName")} />
          )}
        </FormField>

        <FormField label="Email" error={errors.email}>
          {(field) => (
            <Input
              {...field}
              type="email"
              autoComplete="email"
              value={values.email}
              onChange={update("email")}
            />
          )}
        </FormField>

        <FormField
          label="Password"
          help={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          error={errors.password}
        >
          {(field) => (
            <PasswordInput
              {...field}
              autoComplete="new-password"
              value={values.password}
              onChange={update("password")}
            />
          )}
        </FormField>

        <FormField label="Confirm password" error={errors.confirmPassword}>
          {(field) => (
            <PasswordInput
              {...field}
              autoComplete="new-password"
              value={values.confirmPassword}
              onChange={update("confirmPassword")}
            />
          )}
        </FormField>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Creating account…" : "Create account"}
        </Button>
      </form>
    </AuthShell>
  );
}

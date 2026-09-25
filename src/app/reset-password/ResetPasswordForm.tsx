"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { PasswordInput } from "@/components/ui/password-input";
import { createClient } from "@/lib/supabase/browser";
import { AUTH_ERROR_MESSAGES, classifyAuthError, type AuthErrorKind } from "@/modules/auth/auth.errors";
import {
  PASSWORD_MIN_LENGTH,
  ResetPasswordSchema,
  fieldErrors,
  type FieldErrors,
} from "@/modules/auth/auth.schema";

type Values = { password: string; confirmPassword: string };

export function ResetPasswordForm() {
  const router = useRouter();
  const [status, setStatus] = useState<"checking" | "ready" | "no_session">("checking");
  const [values, setValues] = useState<Values>({ password: "", confirmPassword: "" });
  const [errors, setErrors] = useState<FieldErrors<Values>>({});
  const [formError, setFormError] = useState<AuthErrorKind | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The recovery link (via /auth/callback) signs the user in; without that
  // session there is nothing to reset.
  useEffect(() => {
    createClient()
      .auth.getUser()
      .then(({ data }) => setStatus(data.user ? "ready" : "no_session"))
      .catch(() => setStatus("no_session"));
  }, []);

  const update = (field: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const invalid = fieldErrors(ResetPasswordSchema, values);
    setErrors(invalid ?? {});
    if (invalid) return;

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password: values.password });
      if (error) {
        setFormError(classifyAuthError(error));
        return;
      }
      // PRD §9: New Password → Sign In. Signing out everywhere also ends any
      // session an attacker may hold with the old password.
      await supabase.auth.signOut();
      router.replace("/login?reset=success");
      router.refresh();
    } catch (error) {
      setFormError(classifyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  if (status === "checking") {
    return (
      <AuthShell title="Set a new password">
        <p role="status" className="text-body text-muted-foreground">
          Checking your reset link…
        </p>
      </AuthShell>
    );
  }

  if (status === "no_session") {
    return (
      <AuthShell title="Link expired">
        <Alert variant="error">This password reset link is invalid or has expired.</Alert>
        <Link
          href="/forgot-password"
          className="mt-4 inline-block text-body font-medium text-primary hover:underline"
        >
          Request a new link
        </Link>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Set a new password" description="Choose a new password for your account.">
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert variant="error">{AUTH_ERROR_MESSAGES[formError]}</Alert>}

        <FormField
          label="New password"
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

        <FormField label="Confirm new password" error={errors.confirmPassword}>
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
          {submitting ? "Updating…" : "Update password"}
        </Button>
      </form>
    </AuthShell>
  );
}

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
import { AUTH_CALLBACK_PATH } from "@/config/auth";
import { AUTH_ERROR_MESSAGES, classifyAuthError, type AuthErrorKind } from "@/modules/auth/auth.errors";
import { LoginSchema, fieldErrors, type FieldErrors } from "@/modules/auth/auth.schema";

type Values = { email: string; password: string };

export function LoginForm({
  next,
  linkInvalid,
  passwordReset,
}: {
  next: string;
  linkInvalid: boolean;
  passwordReset: boolean;
}) {
  const router = useRouter();
  const [values, setValues] = useState<Values>({ email: "", password: "" });
  const [errors, setErrors] = useState<FieldErrors<Values>>({});
  const [formError, setFormError] = useState<AuthErrorKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [resendState, setResendState] = useState<"idle" | "sending" | "sent">("idle");

  const update = (field: keyof Values) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setValues((v) => ({ ...v, [field]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const invalid = fieldErrors(LoginSchema, values);
    setErrors(invalid ?? {});
    if (invalid) return;

    setSubmitting(true);
    try {
      const { error } = await createClient().auth.signInWithPassword({
        email: values.email.trim(),
        password: values.password,
      });
      if (error) {
        setFormError(classifyAuthError(error));
        return;
      }
      router.replace(next);
      router.refresh();
    } catch (error) {
      setFormError(classifyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const resendConfirmation = async () => {
    setResendState("sending");
    try {
      const { error } = await createClient().auth.resend({
        type: "signup",
        email: values.email.trim(),
        options: { emailRedirectTo: `${window.location.origin}${AUTH_CALLBACK_PATH}` },
      });
      if (error) throw error;
      setResendState("sent");
    } catch (error) {
      setResendState("idle");
      setFormError(classifyAuthError(error));
    }
  };

  return (
    <AuthShell
      title="Sign in"
      description="Welcome back. Sign in to manage your quotations."
      footer={
        <>
          New here?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </>
      }
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {passwordReset && (
          <Alert variant="success">Password updated. Sign in with your new password.</Alert>
        )}
        {linkInvalid && (
          <Alert variant="error">That link is invalid or has expired. Request a new one.</Alert>
        )}
        {formError && (
          <Alert variant="error">
            {AUTH_ERROR_MESSAGES[formError]}
            {formError === "email_not_confirmed" && (
              <div className="mt-2">
                {resendState === "sent" ? (
                  <span className="text-foreground">Confirmation email sent.</span>
                ) : (
                  <button
                    type="button"
                    onClick={resendConfirmation}
                    disabled={resendState === "sending"}
                    className="font-medium text-foreground underline underline-offset-4"
                  >
                    {resendState === "sending" ? "Sending…" : "Resend confirmation email"}
                  </button>
                )}
              </div>
            )}
          </Alert>
        )}

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

        <FormField label="Password" error={errors.password}>
          {(field) => (
            <PasswordInput
              {...field}
              autoComplete="current-password"
              value={values.password}
              onChange={update("password")}
            />
          )}
        </FormField>

        <div className="flex justify-end">
          <Link href="/forgot-password" className="text-body text-primary hover:underline">
            Forgot password?
          </Link>
        </div>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Signing in…" : "Sign in"}
        </Button>
      </form>
    </AuthShell>
  );
}

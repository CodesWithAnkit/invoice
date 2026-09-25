"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthShell } from "@/components/auth/AuthShell";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { FormField } from "@/components/ui/form-field";
import { Input } from "@/components/ui/input";
import { createClient } from "@/lib/supabase/browser";
import { AUTH_CALLBACK_PATH, RESET_PASSWORD_PATH } from "@/config/auth";
import { AUTH_ERROR_MESSAGES, classifyAuthError, type AuthErrorKind } from "@/modules/auth/auth.errors";
import { ForgotPasswordSchema, fieldErrors } from "@/modules/auth/auth.schema";

export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState<string | undefined>();
  const [formError, setFormError] = useState<AuthErrorKind | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const invalid = fieldErrors(ForgotPasswordSchema, { email });
    setEmailError(invalid?.email);
    if (invalid) return;

    setSubmitting(true);
    try {
      const { error } = await createClient().auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}${AUTH_CALLBACK_PATH}?next=${RESET_PASSWORD_PATH}`,
      });
      // Never reveal whether the address has an account (AC-AUTH-005): only
      // transport and rate-limit problems are surfaced.
      if (error) {
        const kind = classifyAuthError(error);
        if (kind === "network" || kind === "rate_limited") {
          setFormError(kind);
          return;
        }
      }
      setSent(true);
    } catch (error) {
      setFormError(classifyAuthError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const footer = (
    <Link href="/login" className="font-medium text-primary hover:underline">
      Back to sign in
    </Link>
  );

  if (sent) {
    return (
      <AuthShell title="Check your email" footer={footer}>
        <Alert variant="success">
          If an account exists for <strong className="break-all">{email.trim()}</strong>, you&apos;ll
          get an email with a link to reset your password.
        </Alert>
      </AuthShell>
    );
  }

  return (
    <AuthShell
      title="Forgot your password?"
      description="Enter your email and we'll send you a link to reset it."
      footer={footer}
    >
      <form onSubmit={handleSubmit} noValidate className="space-y-4">
        {formError && <Alert variant="error">{AUTH_ERROR_MESSAGES[formError]}</Alert>}

        <FormField label="Email" error={emailError}>
          {(field) => (
            <Input
              {...field}
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          )}
        </FormField>

        <Button type="submit" className="w-full" disabled={submitting}>
          {submitting ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthShell>
  );
}

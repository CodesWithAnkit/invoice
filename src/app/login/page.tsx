import { LoginForm } from "./LoginForm";
import { safeNextPath } from "@/config/auth";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string; reset?: string }>;
}) {
  const params = await searchParams;
  return (
    <LoginForm
      next={safeNextPath(params.next)}
      linkInvalid={params.error === "link_invalid"}
      passwordReset={params.reset === "success"}
    />
  );
}

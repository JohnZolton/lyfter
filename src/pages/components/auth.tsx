import { useAuth } from "~/pages/_app";
import React, { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/router";

interface AuthComponentProps {
  children: ReactNode;
}

export function SignedIn({ children }: AuthComponentProps) {
  const { user } = useAuth();
  if (!user) {
    return null;
  }
  return <>{children}</>;
}

export function SignedOut({ children }: AuthComponentProps) {
  const { user } = useAuth();
  if (user) {
    return null;
  }
  return <>{children}</>;
}

export function SignOutButton() {}

export function SignInButton() {
  const { authWithNostr } = useAuth();
  async function handleSignIn() {
    try {
      const token = await authWithNostr();
      sessionStorage.setItem("authToken", token);
    } catch (error) {
      console.error("Auth failed: ", error);
    }
  }
  return <Button onClick={() => handleSignIn()}>Sign in with Nostr</Button>;
}

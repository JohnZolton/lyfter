import { useAuth } from "~/pages/_app";
import React, { ReactNode } from "react";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/router";

interface AuthComponentProps {
  children: ReactNode;
}

export default function SignedIn({ children }: AuthComponentProps) {
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

interface SignOutButtonProps {
  className?: string;
}
export function SignOutButton({ className }: SignOutButtonProps) {
  const router = useRouter();
  function handleSignOut() {
    try {
      sessionStorage.clear();
      void router.push("/");
    } catch (error) {
      console.error("logout failed: ", error);
    }
  }
  return (
    <button onClick={() => handleSignOut()} className={className ?? ""}>
      Sign out
    </button>
  );
}

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
  function handleButtonClick() {
    handleSignIn().catch((error) => console.error("error: ", error));
  }
  return <Button onClick={handleButtonClick}>Sign in with Nostr</Button>;
}

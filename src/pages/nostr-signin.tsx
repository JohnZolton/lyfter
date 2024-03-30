import { useSession } from "next-auth/react";
import { useNostrAuth } from "next-auth-pubkey/hooks";
import LoadingSpinner from "./components/loadingspinner";

export default function SignIn() {
  const session = useSession();
  const { isLoading, error, retry } = useNostrAuth();

  if (isLoading) {
    return (
      <div className="flex flex-row items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center">
      <div>{session.data?.user.name}</div>
      <div>{session.data?.user.id}</div>
      <div>expires: {session.data?.expires}</div>
    </div>
  );
}

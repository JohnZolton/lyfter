import { api } from "~/utils/api";
import "~/styles/globals.css";
import type { AppProps } from "next/app";
import NDK, { NDKEvent, NostrEvent, NDKNip07Signer } from "@nostr-dev-kit/ndk";
import {
  createContext,
  useEffect,
  useState,
  ReactNode,
  useContext,
} from "react";
import { SessionProvider } from "next-auth/react";
import { Session } from "next-auth";
import { finalizeEvent } from "nostr-tools";

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <AuthProvider>
      <SessionProvider session={session}>
        <Component {...pageProps} />
      </SessionProvider>
    </AuthProvider>
  );
}

export default api.withTRPC(MyApp);

interface AuthContextProps {
  authHeader: string | null;
  user: string | null;
  authWithNostr: () => Promise<string>;
}
export const AuthContext = createContext<AuthContextProps>({
  authHeader: null,
  user: null,
  authWithNostr: async () => "",
});

const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [authHeader, setAuthHeader] = useState<string | null>(null);
  const [user, setUser] = useState<string | null>(null);
  useEffect(() => {
    const storedAuthHeader = sessionStorage.getItem("authHeader");
    if (storedAuthHeader) {
      setAuthHeader(storedAuthHeader);
    }
    const storedNpub = sessionStorage.getItem("userNpub");
    if (storedNpub) {
      setUser(storedNpub);
    }
  }, []);

  const authWithNostr = async () => {
    try {
      if (!(window as any).nostr) {
        return;
      }
      let event = await (window as any).nostr.signEvent({
        kind: 27235,
        created_at: Math.floor(Date.now() / 1000),
        tags: [
          ["u", "https://localhost:3000/api"],
          ["method", "GET"],
        ],
        content: "",
      });
      console.log(event.pubkey);
      const base64Event = Buffer.from(JSON.stringify(event)).toString("base64");
      const response = await fetch("/api/authenticate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ signedEvent: base64Event }),
      });
      if (!response.ok) {
        throw new Error("failed to authenticate");
      }
      const { token } = await response.json();
      console.log("NEW TOOKEN: ", token);
      sessionStorage.setItem("authHeader", `Bearer ${token}`);
      sessionStorage.setItem("userNpub", event.pubkey);
      setUser(event.pubkey);
      return token;
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    console.log("new auth header: ", authHeader);
  }, [authHeader]);

  return (
    <AuthContext.Provider value={{ authHeader, user, authWithNostr }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

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
import { EventTemplate } from "nostr-tools";
import { WindowNostr } from "nostr-tools/lib/types/nip07";
import { Buffer } from "buffer";

function MyApp({ Component, pageProps: { session, ...pageProps } }: AppProps) {
  return (
    <AuthProvider>
      <Component {...pageProps} />
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
  authWithNostr: async () => Promise.resolve(""),
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
    const nostr = window.nostr as WindowNostr;
    if (!nostr) {
      return "";
    }
    const event = await nostr.signEvent({
      kind: 27235,
      created_at: Math.floor(Date.now() / 1000),
      tags: [
        ["u", "https://localhost:3000/api"],
        ["method", "GET"],
      ],
      content: "",
    });

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
    interface AuthResponse {
      token: string;
    }
    const { token } = (await response.json()) as AuthResponse;
    sessionStorage.setItem("authHeader", `Bearer ${token}`);
    sessionStorage.setItem("userNpub", event.pubkey);
    setUser(event.pubkey);
    return token;
  };

  return (
    <AuthContext.Provider value={{ authHeader, user, authWithNostr }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

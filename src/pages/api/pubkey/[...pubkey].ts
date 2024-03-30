/*import NextAuthLightning, {
  NextAuthLightningConfig,
} from "next-auth-lightning-provider";
import generateQr from "next-auth-lightning-provider/generators/qr";
import generateName from "next-auth-lightning-provider/generators/name";
import generateAvatar from "next-auth-lightning-provider/generators/avatar";
*/
import storage from "node-persist";
import NextAuthLightning, { NextAuthLightningConfig } from "next-auth-pubkey";
import generateQr from "next-auth-pubkey/generators/qr";
import generateName from "next-auth-pubkey/generators/name";
import generateAvatar from "next-auth-pubkey/generators/avatar";
import { Session } from "next-auth";
import { StorageSession } from "next-auth-pubkey/main/config";

const initializeStorage = async () => {
  try {
    await storage.init();
  } catch (error) {
    console.error("Error initializing storage:", error);
  }
};
initializeStorage().catch((error) => {
  console.error("Error initializing storage:", error);
});

const config: NextAuthLightningConfig = {
  // required
  baseUrl: `${process.env.NEXTAUTH_URL!}`,
  secret: process.env.NEXTAUTH_SECRET!,
  storage: {
    async set({ k1, session }) {
      await storage.setItem(`k1:${k1}`, session);
    },
    async get({ k1 }): Promise<StorageSession | null> {
      return (await storage.getItem(`k1:${k1}`)) as StorageSession | null;
    },
    async update({ k1, session }) {
      const old = (await storage.getItem(`k1:${k1}`)) as StorageSession | null;
      if (!old) throw new Error(`Could not find k1:${k1}`);
      await storage.updateItem(`k1:${k1}`, { ...old, ...session });
    },
    async delete({ k1 }) {
      await storage.removeItem(`k1:${k1}`);
    },
  },
  generateQr,
  pages: {
    nostrSignIn: "/nostr-signin",
    error: "/error",
  },

  generateName,
  generateAvatar,
  theme: {
    colorScheme: "dark",
  },
};

const { nostrProvider, handler } = NextAuthLightning(config);

export { nostrProvider };

export default handler;

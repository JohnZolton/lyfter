import NextAuthLightning, { NextAuthLightningConfig } from "next-auth-pubkey";
import generateQr from "next-auth-pubkey/generators/qr";
import { StorageSession } from "next-auth-pubkey/main/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const config: NextAuthLightningConfig = {
  // required
  baseUrl: `${process.env.NEXTAUTH_URL!}`,
  secret: process.env.NEXTAUTH_SECRET!,
  storage: {
    async set({ k1, session }) {
      console.log("set:");
      console.log(k1);
      console.log(session);
      const sesh = await prisma.session.create({
        data: {
          k1: k1,
          sessionToken: session.k1,
          state: session.state,
        },
      });
      console.log("set sesh:", sesh);
    },
    async get({ k1 }) {
      let dbSession = await prisma.session.findUnique({
        where: { k1 },
      });
      if (!dbSession) {
        return null;
      }
      const seshWithKey: StorageSession = {
        ...dbSession,
        k1: dbSession.k1 ?? "no k1",
        state: dbSession.state ?? "no state",
        sessionToken: dbSession.sessionToken ?? "no token",
      };
      console.log("get sesh:", seshWithKey);
      return seshWithKey;
    },
    async update({ k1, session }) {
      console.log("update");
      console.log("session:", session);

      const existingSession = await prisma.session.findUnique({
        where: {
          k1: k1,
        },
        include: {
          user: true,
        },
      });
      console.log("existing sesh:", existingSession);
      if (existingSession) {
        let user = await prisma.user.findUnique({
          where: { id: session.pubkey },
        });
        if (!user) {
          user = await prisma.user.create({
            data: {
              id: session.pubkey,
              name: session.pubkey,
              pubkey: session.pubkey,
            },
          });
        }
        const updatedSession = await prisma.session.update({
          where: {
            k1: k1,
          },
          data: {
            pubkey: session.pubkey,
            sig: session.sig,
            success: session.success,
            userId: user.id,
          },
          include: { user: true },
        });
        console.log("updated session:", updatedSession);
      } else {
        throw new Error(`session does not exist`);
      }
    },
    async delete({ k1 }) {
      await prisma.session.delete({
        where: { k1 },
      });
    },
  },
  generateQr,
  pages: {
    nostrSignIn: "/nostr-signin",
    error: "/error",
  },

  theme: {
    colorScheme: "dark",
  },
  flags: {
    diagnostics: true,
    logs: true,
  },
};

const { nostrProvider, handler } = NextAuthLightning(config);

export { nostrProvider };

export default handler;

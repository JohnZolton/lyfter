//src/pages/server/trpc.ts
import { type CreateNextContextOptions } from "@trpc/server/adapters/next";
import { prisma } from "~/server/db";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "your_jwt_secret";

export const createTRPCContext = (opts: CreateNextContextOptions) => {
  const { req } = opts;
  console.log("headers: ", req.headers);

  const authorization = req.headers["authorization"];

  if (!authorization || !authorization.startsWith("Bearer ")) {
    throw new Error("Missing or invalid auth header");
  }
  const token = authorization.slice(7);
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { pubkey: string };
    console.log(decoded);
    console.log(decoded.pubkey);

    return {
      prisma,
      userId: decoded.pubkey,
    };
  } catch (error) {
    throw new Error("invalid token");
  }
};

/**
 * 2. INITIALIZATION
 *
 * This is where the tRPC API is initialized, connecting the context and transformer.
 */
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import { ZodError } from "zod";

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

/**
 * 3. ROUTER & PROCEDURE (THE IMPORTANT BIT)
 *
 * These are the pieces you use to build your tRPC API. You should import these a lot in the
 * "/src/server/api/routers" directory.
 */

/**
 * This is how you create new routers and sub-routers in your tRPC API.
 *
 * @see https://trpc.io/docs/router
 */
export const createTRPCRouter = t.router;

/**
 * Public (unauthenticated) procedure
 *
 * This is the base piece you use to build new queries and mutations on your tRPC API. It does not
 * guarantee that a user querying is authorized, but you can still access user session data if they
 * are logged in.
 */
export const publicProcedure = t.procedure;

const enforceUserIsAuthed = t.middleware(async ({ ctx, next }) => {
  if (!ctx.userId) {
    throw new TRPCError({
      code: "UNAUTHORIZED",
    });
  }

  return next({
    ctx: {
      userId: ctx.userId,
    },
  });
});

export const privateProcedure = t.procedure.use(enforceUserIsAuthed);

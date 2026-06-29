import type { CreateExpressContextOptions } from "@trpc/server/adapters/express";
import { parse as parseCookieHeader } from "cookie";
import { jwtVerify } from "jose";
import type { User } from "../../drizzle/schema";
import { getUserByOpenId } from "../db";
import { ENV } from "./env";

export type TrpcContext = {
  req: CreateExpressContextOptions["req"];
  res: CreateExpressContextOptions["res"];
  user: User | null;
};

function getSessionSecret() {
  return new TextEncoder().encode(ENV.cookieSecret);
}

interface JwtPayload {
  openId?: string;
  name?: string;
  appId?: string;
}

async function verifySessionCookie(cookieHeader: string | undefined): Promise<JwtPayload | null> {
  if (!cookieHeader) return null;
  const cookies = parseCookieHeader(cookieHeader);
  const token = cookies["tot_session"];
  if (!token) return null;

  try {
    const { payload } = await jwtVerify(token, getSessionSecret(), { algorithms: ["HS256"] });
    const openId = payload["openId"];
    if (typeof openId !== "string") return null;
    return {
      openId,
      name: typeof payload["name"] === "string" ? payload["name"] : undefined,
    };
  } catch {
    return null;
  }
}

export async function createContext(
  opts: CreateExpressContextOptions
): Promise<TrpcContext> {
  let user: User | null = null;

  try {
    const jwtData = await verifySessionCookie(opts.req.headers.cookie);
    if (jwtData?.openId) {
      // Try DB lookup first; fall back to a minimal user built from JWT payload
      const dbUser = await getUserByOpenId(jwtData.openId).catch(() => null);
      if (dbUser) {
        user = dbUser;
      } else {
        // No DB available — construct a minimal user from JWT claims so protected
        // routes still work (progress will be stored in-memory / localStorage only)
        user = {
          id: 0,
          openId: jwtData.openId,
          name: jwtData.name ?? "Ambassador",
          email: null,
          loginMethod: "password",
          role: "user",
          createdAt: new Date(),
          updatedAt: new Date(),
          lastSignedIn: new Date(),
        } as User;
      }
    }
  } catch {
    user = null;
  }

  return {
    req: opts.req,
    res: opts.res,
    user,
  };
}

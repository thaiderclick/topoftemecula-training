/**
 * Thin server-side client for Supabase Auth (GoTrue) on THIS app's Supabase
 * project. Supabase is used purely as the credential store (hashed passwords,
 * uniqueness, rate limits); sessions stay on our own JWT cookie.
 *
 * Public self-signup is not used — registration goes through /api/auth/register,
 * which validates the enrollment code and creates the user with the service
 * role. The client never talks to Supabase directly.
 */
import { ENV } from "./env";

export interface SupabaseAuthUser {
  id: string; // uuid
  email: string;
  user_metadata?: { name?: string };
}

export function supabaseAuthConfigured(): boolean {
  return !!(ENV.supabaseUrl && ENV.supabaseAnonKey && ENV.supabaseServiceRoleKey);
}

function authUrl(path: string): string {
  return `${ENV.supabaseUrl.replace(/\/$/, "")}/auth/v1${path}`;
}

async function parseError(res: Response, fallback: string): Promise<string> {
  const body = (await res.json().catch(() => ({}))) as {
    msg?: string;
    message?: string;
    error_description?: string;
  };
  return body.msg ?? body.message ?? body.error_description ?? fallback;
}

/** Verify email+password. Returns the auth user, or null on bad credentials. */
export async function signInWithPassword(email: string, password: string): Promise<SupabaseAuthUser | null> {
  const res = await fetch(authUrl("/token?grant_type=password"), {
    method: "POST",
    headers: { apikey: ENV.supabaseAnonKey, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (res.status === 400 || res.status === 401) return null;
  if (!res.ok) throw new Error(await parseError(res, `auth sign-in failed (${res.status})`));
  const body = (await res.json()) as { user?: SupabaseAuthUser };
  return body.user ?? null;
}

/**
 * Create a user with the service role (email pre-confirmed — the enrollment
 * code already proves they were invited). Throws with `code: "exists"` when the
 * email is already registered.
 */
export async function adminCreateUser(opts: {
  email: string;
  password: string;
  name: string;
}): Promise<SupabaseAuthUser> {
  const res = await fetch(authUrl("/admin/users"), {
    method: "POST",
    headers: {
      apikey: ENV.supabaseServiceRoleKey,
      Authorization: `Bearer ${ENV.supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      email: opts.email,
      password: opts.password,
      email_confirm: true,
      user_metadata: { name: opts.name },
    }),
  });
  if (res.status === 422 || res.status === 409) {
    const err = new Error("An account with this email already exists.") as Error & { code?: string };
    err.code = "exists";
    throw err;
  }
  if (!res.ok) throw new Error(await parseError(res, `auth user creation failed (${res.status})`));
  return (await res.json()) as SupabaseAuthUser;
}

/** Set a new password for a user (used by the reset-code flow). */
export async function adminUpdatePassword(userId: string, newPassword: string): Promise<void> {
  const res = await fetch(authUrl(`/admin/users/${userId}`), {
    method: "PUT",
    headers: {
      apikey: ENV.supabaseServiceRoleKey,
      Authorization: `Bearer ${ENV.supabaseServiceRoleKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ password: newPassword }),
  });
  if (!res.ok) throw new Error(await parseError(res, `password update failed (${res.status})`));
}

import { createHash, randomBytes } from "node:crypto";
import bcrypt from "bcryptjs";
import { getDb } from "../db";

export const AUTH_SESSION_COOKIE_NAME = "sv_session";
const AUTH_SESSION_DURATION_SECONDS = 60 * 60 * 24 * 30;
const AUTH_EMAIL_CODE_RESEND_COOLDOWN_SECONDS = 60;
const AUTH_EMAIL_CODE_EXPIRATION_SECONDS = 60 * 10;

type AuthCodePurpose = "password_reset" | "register";

export interface RequestClientMetadata {
  ipAddress: string | null;
  userAgent: string | null;
}

export interface AuthCodePayload {
  cooldownSeconds: number;
  debugCode?: string;
  expiresInSeconds: number;
  message: string;
}

type LocalAuthUser = {
  account_type: string;
  avatar_url: string | null;
  bio: string | null;
  email: string | null;
  email_verified_at: string | null;
  id: number;
  name: string | null;
  password_hash: string | null;
  username: string | null;
};

type AuthEmailCodeRow = {
  code_hash: string;
  expires_at: string | null;
  id: number;
  sent_at: string | null;
};

export class AuthValidationError extends Error {
  errors: Record<string, string[]>;
  status: number;

  constructor(message: string, errors: Record<string, string[]>, status = 422) {
    super(message);
    this.name = "AuthValidationError";
    this.errors = errors;
    this.status = status;
  }
}

export function getAuthCookieOptions() {
  return {
    httpOnly: true,
    maxAge: AUTH_SESSION_DURATION_SECONDS,
    path: "/",
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
  };
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function normalizeCode(code: string) {
  return code.trim();
}

function normalizeLegacyBcryptHash(hash: string) {
  return hash.startsWith("$2y$") ? `$2a$${hash.slice(4)}` : hash;
}

function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function getDefaultDisplayName(email: string) {
  const localPart = email.split("@")[0]?.trim() ?? "";
  return localPart === "" ? "用户" : localPart.slice(0, 80);
}

async function hashSecret(secret: string) {
  return bcrypt.hash(secret, 12);
}

async function compareSecret(secret: string, hash: string) {
  return bcrypt.compare(secret, normalizeLegacyBcryptHash(hash));
}

async function findLocalUserByEmail(email: string): Promise<LocalAuthUser | null> {
  const { data } = await getDb()
    .from("users")
    .select(`
      id, name, username, email, avatar_url, bio, account_type, email_verified_at,
      cred:user_local_credentials!user_id(password_hash)
    `)
    .eq("account_type", "local")
    .ilike("email", normalizeEmail(email))
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  const cred = data.cred as unknown as { password_hash: string } | { password_hash: string }[] | null;
  const passwordHash = Array.isArray(cred) ? (cred[0]?.password_hash ?? null) : (cred?.password_hash ?? null);
  return {
    id: data.id,
    name: data.name,
    username: data.username,
    email: data.email,
    avatar_url: data.avatar_url,
    bio: data.bio,
    account_type: data.account_type,
    email_verified_at: data.email_verified_at,
    password_hash: passwordHash,
  };
}

async function markLastLogin(userId: number) {
  const now = new Date().toISOString();
  await getDb().from("users").update({ last_login_at: now, updated_at: now }).eq("id", userId);
}

async function consumeAuthCode(email: string, purpose: AuthCodePurpose, code: string) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedCode = normalizeCode(code);

  const { data: latestCode } = await getDb()
    .from("auth_email_codes")
    .select("id, code_hash, sent_at, expires_at")
    .eq("email", normalizedEmail)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestCode) {
    throw new AuthValidationError("验证码不存在或已失效。", { code: ["验证码不存在或已失效。"] });
  }

  const expiresAt = latestCode.expires_at ? new Date(latestCode.expires_at) : null;
  const now = new Date().toISOString();

  if (!(expiresAt instanceof Date) || Number.isNaN(expiresAt.getTime()) || expiresAt.getTime() <= Date.now()) {
    await getDb().from("auth_email_codes").update({ consumed_at: now, updated_at: now }).eq("id", latestCode.id);
    throw new AuthValidationError("验证码已过期，请重新获取。", { code: ["验证码已过期，请重新获取。"] });
  }

  if (!(await compareSecret(normalizedCode, (latestCode as unknown as AuthEmailCodeRow).code_hash))) {
    throw new AuthValidationError("验证码错误，请重新输入。", { code: ["验证码错误，请重新输入。"] });
  }

  await getDb().from("auth_email_codes").update({ consumed_at: now, updated_at: now }).eq("id", latestCode.id);
}

async function createSession(userId: number, metadata: RequestClientMetadata) {
  const rawToken = randomBytes(32).toString("base64url");
  const tokenHash = hashSessionToken(rawToken);
  const expiresAt = new Date(Date.now() + AUTH_SESSION_DURATION_SECONDS * 1000).toISOString();

  await getDb().from("auth_sessions").insert({
    user_id: userId,
    session_token_hash: tokenHash,
    user_agent: metadata.userAgent,
    ip_address: metadata.ipAddress || null,
    expires_at: expiresAt,
  });

  return rawToken;
}

async function generateUniqueUsername() {
  for (let attempt = 0; attempt < 10; attempt += 1) {
    const candidate = `user_${randomBytes(6).toString("hex")}`;
    const { count } = await getDb()
      .from("users")
      .select("*", { count: "exact", head: true })
      .eq("username", candidate);
    if ((count ?? 1) === 0) return candidate;
  }
  throw new Error("Unable to generate a unique username.");
}

export async function resolveViewerUserIdFromCookieToken(token: string | undefined): Promise<number | null> {
  if (!token || token.trim() === "") return null;

  const { data } = await getDb()
    .from("auth_sessions")
    .select("user_id")
    .eq("session_token_hash", hashSessionToken(token))
    .gt("expires_at", new Date().toISOString())
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data ? Number(data.user_id) : null;
}

export async function loginWithEmailAndPassword(
  email: string,
  password: string,
  metadata: RequestClientMetadata,
) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = password.trim();

  if (normalizedEmail === "") {
    throw new AuthValidationError("请输入邮箱地址。", { email: ["请输入邮箱地址。"] });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalizedEmail)) {
    throw new AuthValidationError("请输入有效的邮箱地址。", { email: ["请输入有效的邮箱地址。"] });
  }
  if (normalizedPassword === "") {
    throw new AuthValidationError("请输入密码。", { password: ["请输入密码。"] });
  }

  const user = await findLocalUserByEmail(normalizedEmail);

  if (!user || !user.password_hash || !(await compareSecret(normalizedPassword, user.password_hash))) {
    throw new AuthValidationError("邮箱或密码错误。", { auth: ["邮箱或密码错误。"] });
  }

  await markLastLogin(Number(user.id));

  return {
    sessionToken: await createSession(Number(user.id), metadata),
    userId: Number(user.id),
  };
}

export async function sendAuthEmailCode(email: string, purpose: AuthCodePurpose): Promise<AuthCodePayload> {
  const normalizedEmail = normalizeEmail(email);

  if (normalizedEmail === "") {
    throw new AuthValidationError("请输入邮箱地址。", { email: ["请输入邮箱地址。"] });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalizedEmail)) {
    throw new AuthValidationError("请输入有效的邮箱地址。", { email: ["请输入有效的邮箱地址。"] });
  }

  const user = await findLocalUserByEmail(normalizedEmail);

  if (purpose === "register" && user) {
    throw new AuthValidationError("该邮箱已被使用，请直接登录。", { email: ["该邮箱已被使用，请直接登录。"] });
  }
  if (purpose === "password_reset" && !user) {
    throw new AuthValidationError("未找到可重置密码的本地账号。", { email: ["未找到可重置密码的本地账号。"] });
  }

  const { data: latestCode } = await getDb()
    .from("auth_email_codes")
    .select("id, code_hash, sent_at, expires_at")
    .eq("email", normalizedEmail)
    .eq("purpose", purpose)
    .is("consumed_at", null)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (latestCode?.sent_at) {
    const sentAt = new Date(latestCode.sent_at);
    const remainingSeconds = Math.ceil((sentAt.getTime() + AUTH_EMAIL_CODE_RESEND_COOLDOWN_SECONDS * 1000 - Date.now()) / 1000);
    if (remainingSeconds > 0) {
      throw new AuthValidationError("验证码发送过于频繁，请 60 秒后再试。", { email: ["验证码发送过于频繁，请 60 秒后再试。"] }, 429);
    }
  }

  const now = new Date().toISOString();
  await getDb()
    .from("auth_email_codes")
    .update({ consumed_at: now, updated_at: now })
    .eq("email", normalizedEmail)
    .eq("purpose", purpose)
    .is("consumed_at", null);

  const code = String(Math.floor(Math.random() * 1_000_000)).padStart(6, "0");
  const expiresAt = new Date(Date.now() + AUTH_EMAIL_CODE_EXPIRATION_SECONDS * 1000).toISOString();

  await getDb().from("auth_email_codes").insert({
    email: normalizedEmail,
    purpose,
    code_hash: await hashSecret(code),
    sent_at: now,
    expires_at: expiresAt,
  });

  return {
    cooldownSeconds: AUTH_EMAIL_CODE_RESEND_COOLDOWN_SECONDS,
    debugCode: process.env.NODE_ENV !== "production" ? code : undefined,
    expiresInSeconds: AUTH_EMAIL_CODE_EXPIRATION_SECONDS,
    message: "验证码已发送，请查看邮箱。",
  };
}

export async function registerLocalUser(
  email: string,
  code: string,
  password: string,
  passwordConfirmation: string,
  metadata: RequestClientMetadata,
) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = password.trim();
  const normalizedPasswordConfirmation = passwordConfirmation.trim();

  if (normalizedEmail === "") throw new AuthValidationError("请输入邮箱地址。", { email: ["请输入邮箱地址。"] });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/u.test(normalizedEmail)) throw new AuthValidationError("请输入有效的邮箱地址。", { email: ["请输入有效的邮箱地址。"] });
  if (!/^\d{6}$/u.test(normalizeCode(code))) throw new AuthValidationError("验证码必须为 6 位数字。", { code: ["验证码必须为 6 位数字。"] });
  if (normalizedPassword === "") throw new AuthValidationError("请输入密码。", { password: ["请输入密码。"] });
  if (Array.from(normalizedPassword).length < 8) throw new AuthValidationError("密码至少需要 8 位。", { password: ["密码至少需要 8 位。"] });
  if (normalizedPassword !== normalizedPasswordConfirmation) throw new AuthValidationError("两次输入的密码不一致。", { password_confirmation: ["两次输入的密码不一致。"] });
  if (await findLocalUserByEmail(normalizedEmail)) throw new AuthValidationError("该邮箱已被使用，请直接登录。", { email: ["该邮箱已被使用，请直接登录。"] });

  await consumeAuthCode(normalizedEmail, "register", code);

  const username = await generateUniqueUsername();
  const nowTs = new Date().toISOString();
  const [hashedPassword] = await Promise.all([hashSecret(normalizedPassword)]);

  const { data: newUser } = await getDb()
    .from("users")
    .insert({
      name: getDefaultDisplayName(normalizedEmail),
      username,
      account_type: "local",
      email: normalizedEmail,
      phone: null,
      email_verified_at: nowTs,
      last_login_at: nowTs,
    })
    .select("id")
    .single();

  if (!newUser) throw new Error("Failed to create user account.");
  const userId = Number(newUser.id);

  await getDb()
    .from("user_local_credentials")
    .insert({ user_id: userId, password_hash: hashedPassword });

  return {
    sessionToken: await createSession(userId, metadata),
    userId,
  };
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
  newPasswordConfirmation: string,
) {
  const normalizedEmail = normalizeEmail(email);
  const normalizedPassword = newPassword.trim();

  if (normalizedEmail === "") throw new AuthValidationError("请输入邮箱地址。", { email: ["请输入邮箱地址。"] });
  if (normalizedPassword === "") throw new AuthValidationError("请输入新密码。", { password: ["请输入新密码。"] });
  if (Array.from(normalizedPassword).length < 8) throw new AuthValidationError("密码至少需要 8 位。", { password: ["密码至少需要 8 位。"] });
  if (normalizedPassword !== newPasswordConfirmation.trim()) throw new AuthValidationError("两次输入的密码不一致。", { password_confirmation: ["两次输入的密码不一致。"] });

  await consumeAuthCode(normalizedEmail, "password_reset", code);

  const user = await findLocalUserByEmail(normalizedEmail);
  if (!user) throw new AuthValidationError("账号不存在。", { email: ["账号不存在。"] });

  await getDb()
    .from("user_local_credentials")
    .upsert(
      { user_id: Number(user.id), password_hash: await hashSecret(normalizedPassword), updated_at: new Date().toISOString() },
      { onConflict: "user_id" },
    );
}

export async function destroySession(sessionToken: string) {
  if (!sessionToken.trim()) return;
  await getDb()
    .from("auth_sessions")
    .delete()
    .eq("session_token_hash", hashSessionToken(sessionToken));
}

const encoder = new TextEncoder();

export const ADMIN_SESSION_COOKIE = "bp_admin_session";

const DEFAULT_AUTH_SECRET = "baanpool-auth-secret-change-me";

type SessionPayload = {
  userId: number;
  username: string;
  role: "super_admin" | "editor";
  exp: number;
};

function getAuthSecret() {
  return process.env.AUTH_SECRET || DEFAULT_AUTH_SECRET;
}

function toBase64Url(value: string) {
  return btoa(value).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(value.length / 4) * 4, "=");
  return atob(padded);
}

async function signValue(value: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(getAuthSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  const bytes = new Uint8Array(signature);
  return Array.from(bytes)
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export async function createSessionToken(session: {
  userId: number;
  username: string;
  role: "super_admin" | "editor";
}) {
  const payload: SessionPayload = {
    userId: session.userId,
    username: session.username,
    role: session.role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7,
  };
  const encodedPayload = toBase64Url(JSON.stringify(payload));
  const signature = await signValue(encodedPayload);
  return `${encodedPayload}.${signature}`;
}

export async function verifySessionToken(token?: string | null) {
  if (!token) return null;

  const [encodedPayload, signature] = token.split(".");
  if (!encodedPayload || !signature) return null;

  const expectedSignature = await signValue(encodedPayload);
  if (expectedSignature !== signature) return null;

  try {
    const payload = JSON.parse(fromBase64Url(encodedPayload)) as SessionPayload;
    if (!payload.userId || !payload.username || !payload.role || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

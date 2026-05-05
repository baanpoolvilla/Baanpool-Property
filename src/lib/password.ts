import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const COST = 16384;
const BLOCK_SIZE = 8;
const PARALLEL = 1;

export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = scryptSync(password, salt, KEY_LENGTH, {
    N: COST,
    r: BLOCK_SIZE,
    p: PARALLEL,
  });

  return `scrypt$${COST}$${BLOCK_SIZE}$${PARALLEL}$${salt}$${derivedKey.toString("hex")}`;
}

export function verifyPassword(password: string, passwordHash: string) {
  const [algorithm, n, r, p, salt, hash] = passwordHash.split("$");
  if (algorithm !== "scrypt" || !n || !r || !p || !salt || !hash) return false;

  const derivedKey = scryptSync(password, salt, KEY_LENGTH, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  });

  const hashBuffer = Buffer.from(hash, "hex");
  if (hashBuffer.length !== derivedKey.length) return false;

  return timingSafeEqual(hashBuffer, derivedKey);
}
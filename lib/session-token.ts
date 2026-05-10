const SESSION_TOKEN_VERSION = "v1";

function encodeBase64(input: string): string {
  if (typeof btoa === "function") {
    return btoa(input);
  }
  return Buffer.from(input, "binary").toString("base64");
}

function decodeBase64(input: string): string {
  if (typeof atob === "function") {
    return atob(input);
  }
  return Buffer.from(input, "base64").toString("binary");
}

function toBase64Url(input: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < input.length; i += 1) {
    binary += String.fromCharCode(input[i]);
  }

  return encodeBase64(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function fromBase64Url(input: string): Uint8Array {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = decodeBase64(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function asArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

function getSessionSecret(): string {
  const secret = process.env.AUTH_SESSION_SECRET || process.env.NEXTAUTH_SECRET;

  if (!secret) {
    throw new Error("Missing AUTH_SESSION_SECRET or NEXTAUTH_SECRET");
  }

  return secret;
}

async function getSigningKey() {
  return crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(getSessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

async function sign(data: string): Promise<string> {
  const key = await getSigningKey();
  const signature = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(data));
  return toBase64Url(new Uint8Array(signature));
}

async function verify(data: string, signature: string): Promise<boolean> {
  const key = await getSigningKey();
  return crypto.subtle.verify(
    "HMAC",
    key,
    asArrayBuffer(fromBase64Url(signature)),
    new TextEncoder().encode(data)
  );
}

export interface SessionTokenPayload {
  userId: number;
  email: string;
  expiresAt: string;
}

export async function createSessionToken(payload: SessionTokenPayload): Promise<string> {
  const payloadJson = JSON.stringify(payload);
  const encodedPayload = toBase64Url(new TextEncoder().encode(payloadJson));
  const dataToSign = `${SESSION_TOKEN_VERSION}.${encodedPayload}`;
  const signature = await sign(dataToSign);

  return `${dataToSign}.${signature}`;
}

export async function verifySessionToken(token: string): Promise<SessionTokenPayload | null> {
  const [version, encodedPayload, signature] = token.split(".");

  if (!version || !encodedPayload || !signature || version !== SESSION_TOKEN_VERSION) {
    return null;
  }

  const isValid = await verify(`${version}.${encodedPayload}`, signature);
  if (!isValid) {
    return null;
  }

  try {
    const decoded = new TextDecoder().decode(fromBase64Url(encodedPayload));
    const payload = JSON.parse(decoded) as SessionTokenPayload;

    if (
      typeof payload.userId !== "number" ||
      typeof payload.email !== "string" ||
      typeof payload.expiresAt !== "string"
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

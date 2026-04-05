/**
 * crypto.ts — Client-side AES-256-GCM encryption/decryption using the native Web Crypto API.
 * Zero third-party dependencies. All operations happen entirely in the browser.
 */

const PBKDF2_ITERATIONS = 310_000;
const SALT_LENGTH = 16;
const IV_LENGTH = 12;

/** Converts a hex string to a Uint8Array */
function hexToBytes(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

/** Converts a Uint8Array to a hex string */
function bytesToHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

/** Converts a Uint8Array to base64 */
function bytesToBase64(bytes: Uint8Array): string {
  let binary = '';
  const chunkSize = 8192;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode.apply(null, chunk as unknown as number[]);
  }
  return btoa(binary);
}

/** Converts base64 to Uint8Array */
function base64ToBytes(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Derives an AES-256-GCM CryptoKey from a password + salt using PBKDF2.
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt, iterations: PBKDF2_ITERATIONS, hash: 'SHA-256' },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Hashes a password using SHA-256 for server-side verification without exposing the key.
 * Returns a hex string.
 */
export async function hashPassword(password: string): Promise<string> {
  const hashBuffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(password));
  return bytesToHex(new Uint8Array(hashBuffer));
}

/**
 * Encrypts a plaintext string using AES-256-GCM with a PBKDF2-derived key.
 * Returns a base64-encoded ciphertext prefixed with salt+iv.
 * Format: base64(salt[16] + iv[12] + ciphertext)
 */
export async function encryptText(plaintext: string, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    new TextEncoder().encode(plaintext)
  );

  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + cipherBuffer.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(cipherBuffer), SALT_LENGTH + IV_LENGTH);

  return bytesToBase64(combined);
}

/**
 * Decrypts a base64-encoded ciphertext (salt+iv+ciphertext) using the provided password.
 * Throws if the password is incorrect (AES-GCM authentication fails).
 */
export async function decryptText(ciphertext: string, password: string): Promise<string> {
  const combined = base64ToBytes(ciphertext);
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const data = combined.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  const plainBuffer = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );

  return new TextDecoder().decode(plainBuffer);
}

/**
 * Encrypts a File using AES-256-GCM.
 * Returns a base64-encoded blob: salt + iv + encrypted file bytes.
 */
export async function encryptFile(file: File, password: string): Promise<string> {
  const salt = crypto.getRandomValues(new Uint8Array(SALT_LENGTH));
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await deriveKey(password, salt);
  const fileBytes = await file.arrayBuffer();

  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    fileBytes
  );

  const combined = new Uint8Array(SALT_LENGTH + IV_LENGTH + cipherBuffer.byteLength);
  combined.set(salt, 0);
  combined.set(iv, SALT_LENGTH);
  combined.set(new Uint8Array(cipherBuffer), SALT_LENGTH + IV_LENGTH);

  return bytesToBase64(combined);
}

/**
 * Decrypts an encrypted file blob (base64) back to an ArrayBuffer.
 */
export async function decryptFile(ciphertext: string, password: string): Promise<ArrayBuffer> {
  const combined = base64ToBytes(ciphertext);
  const salt = combined.slice(0, SALT_LENGTH);
  const iv = combined.slice(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const data = combined.slice(SALT_LENGTH + IV_LENGTH);

  const key = await deriveKey(password, salt);

  return crypto.subtle.decrypt(
    { name: 'AES-GCM', iv },
    key,
    data
  );
}

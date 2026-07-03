// Hash de senha no navegador via Web Crypto API (SHA-256 + salt aleatório).
// Não é tão forte quanto bcrypt/scrypt (sem custo computacional ajustável),
// mas evita guardar senha em texto puro no banco.

function toHex(buffer) {
  return Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function randomSalt() {
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  return toHex(bytes.buffer);
}

async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return toHex(hashBuffer);
}

export async function hashPassword(password) {
  const salt = randomSalt();
  const hash = await sha256Hex(salt + password);
  return { hash, salt };
}

export async function verifyPassword(password, hash, salt) {
  if (!hash || !salt) return false;
  const computed = await sha256Hex(salt + password);
  return computed === hash;
}
